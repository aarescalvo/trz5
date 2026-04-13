import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar mermas de despostada
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const loteId = searchParams.get('loteId')
    const tipo = searchParams.get('tipo')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    const where: any = {}
    if (loteId) where.loteId = loteId
    if (tipo) where.tipo = tipo
    if (fechaDesde || fechaHasta) {
      where.fecha = {}
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde)
      if (fechaHasta) where.fecha.lte = new Date(fechaHasta)
    }

    const mermas = await db.mermaDespostada.findMany({
      where,
      include: {
        lote: {
          select: { 
            id: true, 
            numero: true, 
            anio: true,
            kgIngresados: true,
            kgProducidos: true
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
      total: mermas.length,
      pesoTotal: mermas.reduce((acc, m) => acc + m.pesoKg, 0),
      porTipo: {
        hueso: mermas.filter(m => m.tipo === 'HUESO').reduce((acc, m) => acc + m.pesoKg, 0),
        grasa: mermas.filter(m => m.tipo === 'GRASA').reduce((acc, m) => acc + m.pesoKg, 0),
        incomestible: mermas.filter(m => m.tipo === 'INCOMESTIBLE').reduce((acc, m) => acc + m.pesoKg, 0),
        recortes: mermas.filter(m => m.tipo === 'RECORTES').reduce((acc, m) => acc + m.pesoKg, 0),
        otro: mermas.filter(m => m.tipo === 'OTRO').reduce((acc, m) => acc + m.pesoKg, 0)
      }
    }

    return NextResponse.json({ success: true, data: mermas, stats })
  } catch (error) {
    console.error('Error al obtener mermas:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener mermas' }, { status: 500 })
  }
}

// POST - Registrar nueva merma
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { loteId, tipo, pesoKg, observaciones, operadorId } = body

    if (!loteId || !tipo || !pesoKg) {
      return NextResponse.json({ 
        success: false, 
        error: 'Lote, tipo y peso son requeridos' 
      }, { status: 400 })
    }

    // Verificar que el lote existe y está abierto
    const lote = await db.loteDespostada.findUnique({
      where: { id: loteId }
    })

    if (!lote) {
      return NextResponse.json({ success: false, error: 'Lote no encontrado' }, { status: 404 })
    }

    if (lote.estado !== 'ABIERTO') {
      return NextResponse.json({ 
        success: false, 
        error: 'No se pueden agregar mermas a un lote cerrado' 
      }, { status: 400 })
    }

    // Crear merma
    const merma = await db.mermaDespostada.create({
      data: {
        loteId,
        tipo,
        pesoKg,
        observaciones,
        operadorId
      },
      include: {
        lote: {
          select: { id: true, numero: true, anio: true }
        },
        operador: {
          select: { id: true, nombre: true }
        }
      }
    })

    // Actualizar kg de mermas del lote
    await db.loteDespostada.update({
      where: { id: loteId },
      data: {
        kgMermas: {
          increment: pesoKg
        }
      }
    })

    return NextResponse.json({ success: true, data: merma })
  } catch (error) {
    console.error('Error al crear merma:', error)
    return NextResponse.json({ success: false, error: 'Error al crear merma' }, { status: 500 })
  }
}

// PUT - Actualizar merma
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, tipo, pesoKg, observaciones } = body

    const mermaActual = await db.mermaDespostada.findUnique({
      where: { id },
      include: { lote: true }
    })

    if (!mermaActual) {
      return NextResponse.json({ success: false, error: 'Merma no encontrada' }, { status: 404 })
    }

    if (mermaActual.lote.estado !== 'ABIERTO') {
      return NextResponse.json({ 
        success: false, 
        error: 'No se puede modificar una merma de un lote cerrado' 
      }, { status: 400 })
    }

    const updateData: any = {}
    if (tipo) updateData.tipo = tipo
    if (observaciones) updateData.observaciones = observaciones

    // Si cambia el peso, actualizar el lote
    if (pesoKg !== undefined && pesoKg !== mermaActual.pesoKg) {
      const diferencia = pesoKg - mermaActual.pesoKg
      updateData.pesoKg = pesoKg

      await db.loteDespostada.update({
        where: { id: mermaActual.loteId },
        data: {
          kgMermas: {
            increment: diferencia
          }
        }
      })
    }

    const merma = await db.mermaDespostada.update({
      where: { id },
      data: updateData,
      include: {
        lote: {
          select: { id: true, numero: true, anio: true }
        },
        operador: {
          select: { id: true, nombre: true }
        }
      }
    })

    return NextResponse.json({ success: true, data: merma })
  } catch (error) {
    console.error('Error al actualizar merma:', error)
    return NextResponse.json({ success: false, error: 'Error al actualizar merma' }, { status: 500 })
  }
}

// DELETE - Eliminar merma
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
    }

    const merma = await db.mermaDespostada.findUnique({
      where: { id },
      include: { lote: true }
    })

    if (!merma) {
      return NextResponse.json({ success: false, error: 'Merma no encontrada' }, { status: 404 })
    }

    if (merma.lote.estado !== 'ABIERTO') {
      return NextResponse.json({ 
        success: false, 
        error: 'No se puede eliminar una merma de un lote cerrado' 
      }, { status: 400 })
    }

    // Restar del lote
    await db.loteDespostada.update({
      where: { id: merma.loteId },
      data: {
        kgMermas: {
          decrement: merma.pesoKg
        }
      }
    })

    // Eliminar merma
    await db.mermaDespostada.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al eliminar merma:', error)
    return NextResponse.json({ success: false, error: 'Error al eliminar merma' }, { status: 500 })
  }
}
