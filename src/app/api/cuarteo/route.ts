import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar registros de cuarteo
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const camaraId = searchParams.get('camaraId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (estado) where.estado = estado
    if (camaraId) where.camaraId = camaraId

    const [registros, total] = await Promise.all([
      db.registroCuarteo.findMany({
        where,
        include: {
          camara: { select: { id: true, nombre: true } },
          operador: { select: { id: true, nombre: true } }
        },
        orderBy: { fecha: 'desc' },
        take: limit,
        skip: offset
      }),
      db.registroCuarteo.count({ where })
    ])

    // Calcular estadísticas
    const stats = await db.registroCuarteo.aggregate({
      _count: { id: true },
      _sum: { pesoTotal: true, pesoDelantero: true, pesoTrasero: true }
    })

    return NextResponse.json({
      success: true,
      data: registros,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + registros.length < total
      },
      stats: {
        total: stats._count.id,
        pesoTotal: stats._sum.pesoTotal || 0,
        pesoDelantero: stats._sum.pesoDelantero || 0,
        pesoTrasero: stats._sum.pesoTrasero || 0
      }
    })
  } catch (error) {
    console.error('Error fetching cuarteos:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener registros de cuarteo' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo registro de cuarteo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      mediaResId,
      tipoCorte,
      pesoTotal,
      pesoDelantero,
      pesoTrasero,
      camaraId,
      operadorId,
      observaciones
    } = body

    if (!pesoTotal) {
      return NextResponse.json(
        { success: false, error: 'El peso total es requerido' },
        { status: 400 }
      )
    }

    const registro = await db.registroCuarteo.create({
      data: {
        mediaResId,
        tipoCorte: tipoCorte || 'DELANTERO_TRASERO',
        pesoTotal: parseFloat(pesoTotal),
        pesoDelantero: pesoDelantero ? parseFloat(pesoDelantero) : null,
        pesoTrasero: pesoTrasero ? parseFloat(pesoTrasero) : null,
        camaraId,
        operadorId,
        observaciones
      },
      include: {
        camara: { select: { id: true, nombre: true } },
        operador: { select: { id: true, nombre: true } }
      }
    })

    // Si hay mediaResId, actualizar estado de la media
    if (mediaResId) {
      await db.mediaRes.update({
        where: { id: mediaResId },
        data: { estado: 'EN_CUARTEO' }
      })
    }

    return NextResponse.json({
      success: true,
      data: registro,
      message: 'Registro de cuarteo creado correctamente'
    })
  } catch (error) {
    console.error('Error creating cuarteo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear registro de cuarteo' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar registro de cuarteo
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    // Preparar datos de actualización
    const data: any = {}
    if (updateData.tipoCorte) data.tipoCorte = updateData.tipoCorte
    if (updateData.pesoTotal) data.pesoTotal = parseFloat(updateData.pesoTotal)
    if (updateData.pesoDelantero !== undefined) data.pesoDelantero = updateData.pesoDelantero ? parseFloat(updateData.pesoDelantero) : null
    if (updateData.pesoTrasero !== undefined) data.pesoTrasero = updateData.pesoTrasero ? parseFloat(updateData.pesoTrasero) : null
    if (updateData.camaraId) data.camaraId = updateData.camaraId
    if (updateData.observaciones !== undefined) data.observaciones = updateData.observaciones

    const registro = await db.registroCuarteo.update({
      where: { id },
      data,
      include: {
        camara: { select: { id: true, nombre: true } },
        operador: { select: { id: true, nombre: true } }
      }
    })

    return NextResponse.json({
      success: true,
      data: registro,
      message: 'Registro actualizado correctamente'
    })
  } catch (error) {
    console.error('Error updating cuarteo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar registro' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar registro de cuarteo
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

    await db.registroCuarteo.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Registro eliminado correctamente'
    })
  } catch (error) {
    console.error('Error deleting cuarteo:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar registro' },
      { status: 500 }
    )
  }
}
