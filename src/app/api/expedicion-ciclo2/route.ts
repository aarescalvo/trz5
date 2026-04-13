import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar expediciones del Ciclo II
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const clienteId = searchParams.get('clienteId')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    const where: any = {}
    if (estado) where.estado = estado
    if (clienteId) where.clienteId = clienteId
    if (fechaDesde || fechaHasta) {
      where.fecha = {}
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde)
      if (fechaHasta) where.fecha.lte = new Date(fechaHasta)
    }

    const expediciones = await db.expedicionCicloII.findMany({
      where,
      include: {
        cliente: {
          select: { id: true, nombre: true, cuit: true }
        },
        pallets: {
          include: {
            cajas: {
              include: {
                producto: {
                  select: { id: true, codigo: true, nombre: true }
                }
              }
            }
          }
        },
        operador: {
          select: { id: true, nombre: true }
        }
      },
      orderBy: { fecha: 'desc' }
    })

    // Calcular estadísticas
    const stats = {
      total: expediciones.length,
      pendientes: expediciones.filter(e => e.estado === 'PENDIENTE').length,
      enCarga: expediciones.filter(e => e.estado === 'EN_CARGA').length,
      despachadas: expediciones.filter(e => e.estado === 'DESPACHADO').length,
      entregadas: expediciones.filter(e => e.estado === 'ENTREGADO').length,
      totalPallets: expediciones.reduce((acc, e) => acc + e.cantidadPallets, 0),
      totalCajas: expediciones.reduce((acc, e) => acc + e.cantidadCajas, 0),
      kgTotal: expediciones.reduce((acc, e) => acc + e.kgTotal, 0)
    }

    return NextResponse.json({ success: true, data: expediciones, stats })
  } catch (error) {
    console.error('Error al obtener expediciones:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener expediciones' }, { status: 500 })
  }
}

// POST - Crear nueva expedición
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      destino,
      direccionDestino,
      clienteId,
      patenteCamion,
      patenteAcoplado,
      chofer,
      choferDni,
      transportista,
      remito,
      numeroPrecintos,
      operadorId,
      observaciones,
      palletIds // Array de IDs de pallets a incluir
    } = body

    // Obtener último número de expedición
    const ultimaExpedicion = await db.expedicionCicloII.findFirst({
      orderBy: { numero: 'desc' }
    })

    const numero = (ultimaExpedicion?.numero || 0) + 1

    // Crear expedición
    const expedicion = await db.expedicionCicloII.create({
      data: {
        numero,
        destino,
        direccionDestino,
        clienteId,
        patenteCamion,
        patenteAcoplado,
        chofer,
        choferDni,
        transportista,
        remito,
        numeroPrecintos,
        operadorId,
        observaciones,
        estado: 'PENDIENTE'
      },
      include: {
        cliente: {
          select: { id: true, nombre: true }
        },
        operador: {
          select: { id: true, nombre: true }
        }
      }
    })

    // Si se proporcionan pallets, asignarlos
    if (palletIds && palletIds.length > 0) {
      await db.pallet.updateMany({
        where: { id: { in: palletIds } },
        data: { expedicionId: expedicion.id }
      })

      // Calcular totales
      const pallets = await db.pallet.findMany({
        where: { id: { in: palletIds } },
        select: { cantidadCajas: true, pesoTotal: true }
      })

      await db.expedicionCicloII.update({
        where: { id: expedicion.id },
        data: {
          cantidadPallets: pallets.length,
          cantidadCajas: pallets.reduce((acc, p) => acc + p.cantidadCajas, 0),
          kgTotal: pallets.reduce((acc, p) => acc + p.pesoTotal, 0)
        }
      })
    }

    return NextResponse.json({ success: true, data: expedicion })
  } catch (error) {
    console.error('Error al crear expedición:', error)
    return NextResponse.json({ success: false, error: 'Error al crear expedición' }, { status: 500 })
  }
}

// PUT - Actualizar expedición (agregar pallets, cambiar estado, despachar)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      id, 
      estado, 
      palletIds, 
      patenteCamion,
      patenteAcoplado,
      chofer,
      choferDni,
      remito,
      numeroPrecintos,
      observaciones
    } = body

    const expedicionActual = await db.expedicionCicloII.findUnique({
      where: { id },
      include: { pallets: true }
    })

    if (!expedicionActual) {
      return NextResponse.json({ success: false, error: 'Expedición no encontrada' }, { status: 404 })
    }

    const updateData: any = {}
    if (estado) updateData.estado = estado
    if (patenteCamion) updateData.patenteCamion = patenteCamion
    if (patenteAcoplado) updateData.patenteAcoplado = patenteAcoplado
    if (chofer) updateData.chofer = chofer
    if (choferDni) updateData.choferDni = choferDni
    if (remito) updateData.remito = remito
    if (numeroPrecintos) updateData.numeroPrecintos = numeroPrecintos
    if (observaciones) updateData.observaciones = observaciones

    // Si se despacha, actualizar estado de pallets y cajas
    if (estado === 'DESPACHADO') {
      // Actualizar todos los pallets de esta expedición
      await db.pallet.updateMany({
        where: { expedicionId: id },
        data: { estado: 'DESPACHADO' }
      })

      // Actualizar todas las cajas de los pallets
      const palletsExpedicion = await db.pallet.findMany({
        where: { expedicionId: id },
        select: { id: true }
      })

      const palletIdsList = palletsExpedicion.map(p => p.id)

      await db.cajaEmpaque.updateMany({
        where: { palletId: { in: palletIdsList } },
        data: { estado: 'DESPACHADA' }
      })
    }

    // Si se agregan pallets
    if (palletIds && palletIds.length > 0) {
      await db.pallet.updateMany({
        where: { id: { in: palletIds } },
        data: { expedicionId: id }
      })

      // Recalcular totales
      const pallets = await db.pallet.findMany({
        where: { expedicionId: id },
        select: { cantidadCajas: true, pesoTotal: true }
      })

      updateData.cantidadPallets = pallets.length
      updateData.cantidadCajas = pallets.reduce((acc, p) => acc + p.cantidadCajas, 0)
      updateData.kgTotal = pallets.reduce((acc, p) => acc + p.pesoTotal, 0)
    }

    const expedicion = await db.expedicionCicloII.update({
      where: { id },
      data: updateData,
      include: {
        cliente: {
          select: { id: true, nombre: true }
        },
        pallets: {
          include: {
            cajas: {
              include: {
                producto: {
                  select: { id: true, codigo: true, nombre: true }
                }
              }
            }
          }
        },
        operador: {
          select: { id: true, nombre: true }
        }
      }
    })

    return NextResponse.json({ success: true, data: expedicion })
  } catch (error) {
    console.error('Error al actualizar expedición:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar expedición' }, { status: 500 })
  }
}

// DELETE - Anular expedición
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
    }

    const expedicion = await db.expedicionCicloII.findUnique({
      where: { id },
      include: { pallets: true }
    })

    if (!expedicion) {
      return NextResponse.json({ success: false, error: 'Expedición no encontrada' }, { status: 404 })
    }

    if (expedicion.estado === 'DESPACHADO' || expedicion.estado === 'ENTREGADO') {
      return NextResponse.json({ 
        success: false, 
        error: 'No se puede anular una expedición despachada o entregada' 
      }, { status: 400 })
    }

    // Desasignar pallets
    await db.pallet.updateMany({
      where: { expedicionId: id },
      data: { 
        expedicionId: null,
        estado: 'COMPLETO'
      }
    })

    // Anular expedición
    const expedicionAnulada = await db.expedicionCicloII.update({
      where: { id },
      data: { estado: 'ANULADO' }
    })

    return NextResponse.json({ success: true, data: expedicionAnulada })
  } catch (error) {
    console.error('Error al anular expedición:', error)
    return NextResponse.json({ success: false, error: 'Error al anular expedición' }, { status: 500 })
  }
}
