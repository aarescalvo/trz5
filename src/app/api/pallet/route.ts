import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar pallets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const expedicionId = searchParams.get('expedicionId')

    const where: any = {}
    if (estado) where.estado = estado
    if (expedicionId) where.expedicionId = expedicionId

    const pallets = await db.pallet.findMany({
      where,
      include: {
        cajas: {
          include: {
            producto: {
              select: { id: true, codigo: true, nombre: true }
            },
            lote: {
              select: { id: true, numero: true, anio: true }
            },
            propietario: {
              select: { id: true, nombre: true }
            }
          }
        },
        expedicion: {
          select: { id: true, numero: true, destino: true, estado: true }
        },
        operador: {
          select: { id: true, nombre: true }
        }
      },
      orderBy: { fecha: 'desc' }
    })

    // Calcular estadísticas
    const stats = {
      total: pallets.length,
      armados: pallets.filter(p => p.estado === 'ARMADO').length,
      completos: pallets.filter(p => p.estado === 'COMPLETO').length,
      despachados: pallets.filter(p => p.estado === 'DESPACHADO').length,
      totalCajas: pallets.reduce((acc, p) => acc + p.cantidadCajas, 0),
      pesoTotal: pallets.reduce((acc, p) => acc + p.pesoTotal, 0)
    }

    return NextResponse.json({ success: true, data: pallets, stats })
  } catch (error) {
    console.error('Error al obtener pallets:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener pallets' }, { status: 500 })
  }
}

// POST - Crear nuevo pallet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { destino, destinoId, operadorId, observaciones } = body

    // Obtener último número de pallet
    const ultimoPallet = await db.pallet.findFirst({
      orderBy: { numero: 'desc' }
    })

    const numero = (ultimoPallet?.numero || 0) + 1

    const pallet = await db.pallet.create({
      data: {
        numero,
        destino,
        destinoId,
        operadorId,
        observaciones,
        estado: 'ARMADO'
      },
      include: {
        operador: {
          select: { id: true, nombre: true }
        }
      }
    })

    return NextResponse.json({ success: true, data: pallet })
  } catch (error) {
    console.error('Error al crear pallet:', error)
    return NextResponse.json({ success: false, error: 'Error al crear pallet' }, { status: 500 })
  }
}

// PUT - Actualizar pallet (agregar cajas, cerrar, asignar expedición)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, estado, expedicionId, observaciones } = body

    const updateData: any = {}
    if (estado) updateData.estado = estado
    if (expedicionId !== undefined) updateData.expedicionId = expedicionId || null
    if (observaciones) updateData.observaciones = observaciones

    const pallet = await db.pallet.update({
      where: { id },
      data: updateData,
      include: {
        cajas: {
          include: {
            producto: {
              select: { id: true, codigo: true, nombre: true }
            }
          }
        },
        expedicion: {
          select: { id: true, numero: true, destino: true }
        }
      }
    })

    // Si se cierra el pallet, actualizar estado de las cajas
    if (estado === 'COMPLETO') {
      await db.cajaEmpaque.updateMany({
        where: { palletId: id },
        data: { estado: 'EN_PALLETS' }
      })
    }

    // Si se asigna a expedición, actualizar estado de cajas a DESPACHADA
    if (expedicionId && pallet.estado === 'DESPACHADO') {
      await db.cajaEmpaque.updateMany({
        where: { palletId: id },
        data: { estado: 'DESPACHADA' }
      })
    }

    return NextResponse.json({ success: true, data: pallet })
  } catch (error) {
    console.error('Error al actualizar pallet:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar pallet' }, { status: 500 })
  }
}

// DELETE - Anular pallet
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
    }

    const pallet = await db.pallet.findUnique({
      where: { id },
      include: { cajas: true }
    })

    if (!pallet) {
      return NextResponse.json({ success: false, error: 'Pallet no encontrado' }, { status: 404 })
    }

    if (pallet.estado === 'DESPACHADO') {
      return NextResponse.json({ success: false, error: 'No se puede anular un pallet despachado' }, { status: 400 })
    }

    // Desasignar cajas del pallet
    await db.cajaEmpaque.updateMany({
      where: { palletId: id },
      data: { 
        palletId: null,
        estado: 'EN_CAMARA'
      }
    })

    // Anular pallet
    const palletAnulado = await db.pallet.update({
      where: { id },
      data: { estado: 'ANULADO' }
    })

    return NextResponse.json({ success: true, data: palletAnulado })
  } catch (error) {
    console.error('Error al anular pallet:', error)
    return NextResponse.json({ success: false, error: 'Error al anular pallet' }, { status: 500 })
  }
}
