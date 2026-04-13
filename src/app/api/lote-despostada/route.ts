import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar lotes de despostada
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const anio = searchParams.get('anio')

    const where: any = {}
    if (estado) where.estado = estado
    if (anio) where.anio = parseInt(anio)

    const lotes = await db.loteDespostada.findMany({
      where,
      include: {
        operador: {
          select: { id: true, nombre: true }
        },
        _count: {
          select: { cuartos: true, cajas: true }
        }
      },
      orderBy: { fecha: 'desc' }
    })

    // Calcular estadísticas
    const stats = {
      total: lotes.length,
      abiertos: lotes.filter(l => l.estado === 'ABIERTO').length,
      cerrados: lotes.filter(l => l.estado === 'CERRADO').length,
      kgIngresados: lotes.reduce((acc, l) => acc + l.kgIngresados, 0),
      kgProducidos: lotes.reduce((acc, l) => acc + l.kgProducidos, 0),
      kgMermas: lotes.reduce((acc, l) => acc + l.kgMermas, 0)
    }

    return NextResponse.json({ success: true, data: lotes, stats })
  } catch (error) {
    console.error('Error al obtener lotes:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener lotes' }, { status: 500 })
  }
}

// POST - Crear nuevo lote de despostada
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { operadorId, observaciones } = body

    // Obtener año actual
    const anio = new Date().getFullYear()

    // Obtener último número de lote del año
    const ultimoLote = await db.loteDespostada.findFirst({
      where: { anio },
      orderBy: { numero: 'desc' }
    })

    const numero = (ultimoLote?.numero || 0) + 1

    const lote = await db.loteDespostada.create({
      data: {
        numero,
        anio,
        estado: 'ABIERTO',
        operadorId,
        observaciones
      },
      include: {
        operador: {
          select: { id: true, nombre: true }
        }
      }
    })

    return NextResponse.json({ success: true, data: lote })
  } catch (error) {
    console.error('Error al crear lote:', error)
    return NextResponse.json({ success: false, error: 'Error al crear lote' }, { status: 500 })
  }
}

// PUT - Actualizar lote (cerrar, agregar kg)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, estado, kgProducidos, kgMermas, observaciones } = body

    const loteActual = await db.loteDespostada.findUnique({
      where: { id }
    })

    if (!loteActual) {
      return NextResponse.json({ success: false, error: 'Lote no encontrado' }, { status: 404 })
    }

    // Preparar datos de actualización
    const updateData: any = {}
    
    if (estado) {
      updateData.estado = estado
      if (estado === 'CERRADO') {
        updateData.fechaCierre = new Date()
        // Calcular rendimiento
        if (loteActual.kgIngresados > 0) {
          const totalProducidos = kgProducidos || loteActual.kgProducidos
          updateData.rendimiento = (totalProducidos / loteActual.kgIngresados) * 100
        }
      }
    }
    
    if (kgProducidos !== undefined) updateData.kgProducidos = kgProducidos
    if (kgMermas !== undefined) updateData.kgMermas = kgMermas
    if (observaciones) updateData.observaciones = observaciones

    // Recalcular rendimiento si hay cambios
    if (updateData.kgProducidos !== undefined && loteActual.kgIngresados > 0) {
      updateData.rendimiento = (updateData.kgProducidos / loteActual.kgIngresados) * 100
    }

    const lote = await db.loteDespostada.update({
      where: { id },
      data: updateData,
      include: {
        operador: {
          select: { id: true, nombre: true }
        },
        _count: {
          select: { cuartos: true, cajas: true }
        }
      }
    })

    return NextResponse.json({ success: true, data: lote })
  } catch (error) {
    console.error('Error al actualizar lote:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar lote' }, { status: 500 })
  }
}
