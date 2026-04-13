import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener cuenta corriente de un cliente o resumen general
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('clienteId')
    const tipo = searchParams.get('tipo') || 'resumen' // resumen | detalle

    if (!clienteId) {
      // Si no hay cliente, devolver resumen de todos los clientes con saldo
      const clientesConSaldo = await db.cliente.findMany({
        where: {
          esUsuarioFaena: true,
          facturas: {
            some: {
              saldo: { gt: 0 }
            }
          }
        },
        include: {
          facturas: {
            where: {
              estado: { in: ['PENDIENTE', 'EMITIDA'] }
            },
            orderBy: { fecha: 'asc' }
          }
        }
      })

      const resumen = clientesConSaldo.map(cliente => {
        const totalSaldo = cliente.facturas.reduce((sum, f) => sum + f.saldo, 0)
        const facturasVencidas = cliente.facturas.filter(f => 
          f.fechaVencimiento && new Date(f.fechaVencimiento) < new Date()
        )
        
        return {
          cliente: {
            id: cliente.id,
            nombre: cliente.nombre,
            razonSocial: cliente.razonSocial,
            cuit: cliente.cuit
          },
          totalSaldo,
          cantidadFacturas: cliente.facturas.length,
          facturasVencidas: facturasVencidas.length,
          montoVencido: facturasVencidas.reduce((sum, f) => sum + f.saldo, 0),
          facturaMasAntigua: cliente.facturas[0]?.fecha || null
        }
      })

      return NextResponse.json({
        success: true,
        data: resumen
      })
    }

    // Obtener detalle de un cliente específico
    const cliente = await db.cliente.findUnique({
      where: { id: clienteId },
      include: {
        facturas: {
          where: {
            estado: { in: ['PENDIENTE', 'EMITIDA', 'PAGADA'] }
          },
          include: {
            detalles: true,
            pagos: {
              orderBy: { fecha: 'desc' }
            }
          },
          orderBy: { fecha: 'desc' }
        }
      }
    })

    if (!cliente) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Calcular totales
    const totalFacturado = cliente.facturas.reduce((sum, f) => sum + f.total, 0)
    const totalPagado = cliente.facturas.reduce((sum, f) => {
      return sum + f.pagos.reduce((s, p) => s + p.monto, 0)
    }, 0)
    const saldoActual = cliente.facturas.reduce((sum, f) => sum + f.saldo, 0)

    // Construir estado de cuenta
    const movimientos: any[] = []
    
    for (const factura of cliente.facturas) {
      movimientos.push({
        tipo: 'FACTURA',
        id: factura.id,
        fecha: factura.fecha,
        numero: factura.numero,
        concepto: `Factura ${factura.tipoComprobante?.replace('_', ' ') || ''} - ${factura.numero}`,
        debe: factura.total,
        haber: 0,
        saldo: null // Se calcula después
      })
      
      for (const pago of factura.pagos) {
        movimientos.push({
          tipo: 'PAGO',
          id: pago.id,
          fecha: pago.fecha,
          numero: pago.referencia || pago.id.slice(0, 8),
          concepto: `Pago ${pago.metodoPago} ${pago.referencia ? '- Ref: ' + pago.referencia : ''}`,
          debe: 0,
          haber: pago.monto,
          saldo: null
        })
      }
    }

    // Ordenar por fecha
    movimientos.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())

    // Calcular saldo acumulado
    let saldoAcumulado = 0
    for (const mov of movimientos) {
      saldoAcumulado += mov.debe - mov.haber
      mov.saldo = saldoAcumulado
    }

    return NextResponse.json({
      success: true,
      data: {
        cliente: {
          id: cliente.id,
          nombre: cliente.nombre,
          razonSocial: cliente.razonSocial,
          cuit: cliente.cuit,
          condicionIva: cliente.condicionIva
        },
        resumen: {
          totalFacturado,
          totalPagado,
          saldoActual,
          cantidadFacturas: cliente.facturas.length,
          facturasPendientes: cliente.facturas.filter(f => f.estado === 'PENDIENTE').length
        },
        movimientos
      }
    })
  } catch (error) {
    console.error('Error fetching cuenta corriente:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener cuenta corriente' },
      { status: 500 }
    )
  }
}

// POST - Registrar pago
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      facturaId, 
      clienteId, 
      monto, 
      metodoPago, 
      referencia, 
      banco, 
      numeroCheque, 
      fechaCheque, 
      observaciones,
      operadorId 
    } = body

    if (!facturaId && !clienteId) {
      return NextResponse.json(
        { success: false, error: 'Debe especificar una factura o un cliente' },
        { status: 400 }
      )
    }

    if (!monto || monto <= 0) {
      return NextResponse.json(
        { success: false, error: 'El monto debe ser mayor a cero' },
        { status: 400 }
      )
    }

    // Si es un pago a cuenta (sin factura específica), distribuir automáticamente
    if (!facturaId && clienteId) {
      // Buscar facturas pendientes del cliente ordenadas por fecha (más antiguas primero)
      const facturasPendientes = await db.factura.findMany({
        where: {
          clienteId,
          estado: { in: ['PENDIENTE', 'EMITIDA'] },
          saldo: { gt: 0 }
        },
        orderBy: { fecha: 'asc' }
      })

      if (facturasPendientes.length === 0) {
        return NextResponse.json(
          { success: false, error: 'El cliente no tiene facturas pendientes' },
          { status: 400 }
        )
      }

      let montoRestante = monto
      const pagosCreados = []

      for (const factura of facturasPendientes) {
        if (montoRestante <= 0) break

        const montoPago = Math.min(montoRestante, factura.saldo)
        
        const pago = await db.pagoFactura.create({
          data: {
            facturaId: factura.id,
            fecha: new Date(),
            monto: montoPago,
            metodoPago,
            referencia,
            banco,
            numeroCheque,
            fechaCheque: fechaCheque ? new Date(fechaCheque) : null,
            observaciones,
            operadorId
          }
        })

        // Actualizar saldo de la factura
        const nuevoSaldo = factura.saldo - montoPago
        await db.factura.update({
          where: { id: factura.id },
          data: {
            saldo: nuevoSaldo,
            estado: nuevoSaldo <= 0 ? 'PAGADA' : 'PENDIENTE'
          }
        })

        pagosCreados.push(pago)
        montoRestante -= montoPago
      }

      return NextResponse.json({
        success: true,
        data: pagosCreados,
        message: `Pago distribuido en ${pagosCreados.length} factura(s)`
      })
    }

    // Pago a factura específica
    const factura = await db.factura.findUnique({
      where: { id: facturaId }
    })

    if (!factura) {
      return NextResponse.json(
        { success: false, error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    if (monto > factura.saldo) {
      return NextResponse.json(
        { success: false, error: `El monto excede el saldo pendiente ($${factura.saldo.toLocaleString()})` },
        { status: 400 }
      )
    }

    // Crear el pago
    const pago = await db.pagoFactura.create({
      data: {
        facturaId,
        fecha: new Date(),
        monto,
        metodoPago,
        referencia,
        banco,
        numeroCheque,
        fechaCheque: fechaCheque ? new Date(fechaCheque) : null,
        observaciones,
        operadorId
      }
    })

    // Actualizar saldo de la factura
    const nuevoSaldo = factura.saldo - monto
    await db.factura.update({
      where: { id: facturaId },
      data: {
        saldo: nuevoSaldo,
        estado: nuevoSaldo <= 0 ? 'PAGADA' : factura.estado
      }
    })

    return NextResponse.json({
      success: true,
      data: pago
    })
  } catch (error) {
    console.error('Error creating pago:', error)
    return NextResponse.json(
      { success: false, error: 'Error al registrar pago' },
      { status: 500 }
    )
  }
}

// DELETE - Anular un pago
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    const pago = await db.pagoFactura.findUnique({
      where: { id },
      include: { factura: true }
    })

    if (!pago) {
      return NextResponse.json(
        { success: false, error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    // Revertir el saldo de la factura
    await db.factura.update({
      where: { id: pago.facturaId },
      data: {
        saldo: { increment: pago.monto },
        estado: 'PENDIENTE'
      }
    })

    // Eliminar el pago
    await db.pagoFactura.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'Pago anulado correctamente'
    })
  } catch (error) {
    console.error('Error annulling pago:', error)
    return NextResponse.json(
      { success: false, error: 'Error al anular pago' },
      { status: 500 }
    )
  }
}
