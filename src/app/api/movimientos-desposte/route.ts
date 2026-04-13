import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar movimientos de desposte
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipoMovimiento = searchParams.get('tipoMovimiento')
    const fecha = searchParams.get('fecha')
    
    const where: any = {}
    
    if (tipoMovimiento) {
      where.tipoMovimiento = tipoMovimiento
    }
    
    if (fecha) {
      const fechaInicio = new Date(fecha)
      fechaInicio.setHours(0, 0, 0, 0)
      const fechaFin = new Date(fecha)
      fechaFin.setHours(23, 59, 59, 999)
      where.fecha = { gte: fechaInicio, lte: fechaFin }
    }
    
    const movimientos = await db.movimientoDesposte.findMany({
      where,
      include: {
        operador: { select: { id: true, nombre: true } }
      },
      orderBy: { fecha: 'desc' }
    })
    
    return NextResponse.json({ success: true, data: movimientos })
  } catch (error) {
    console.error('Error fetching movimientos desposte:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener movimientos' }, { status: 500 })
  }
}

// POST - Crear nuevo movimiento de desposte
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      tipoMovimiento, 
      descripcion, 
      kilos, 
      observaciones, 
      operadorId 
    } = body
    
    // Validaciones
    if (!tipoMovimiento || !kilos || kilos <= 0) {
      return NextResponse.json({ success: false, error: 'Faltan campos obligatorios' }, { status: 400 })
    }
    
    const movimiento = await db.movimientoDesposte.create({
      data: {
        tipoMovimiento,
        descripcion,
        kilos,
        observaciones,
        operadorId
      },
      include: {
        operador: { select: { id: true, nombre: true } }
      }
    })
    
    return NextResponse.json({ success: true, data: movimiento })
  } catch (error) {
    console.error('Error creating movimiento desposte:', error)
    return NextResponse.json({ success: false, error: 'Error al crear movimiento' }, { status: 500 })
  }
}

// GET - Resumen de movimientos (para cálculo de rinde)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { fechaInicio, fechaFin } = body
    
    const movimientos = await db.movimientoDesposte.findMany({
      where: {
        fecha: {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin)
        }
      }
    })
    
    // Agrupar por tipo
    const resumen = movimientos.reduce((acc: any, mov) => {
      if (!acc[mov.tipoMovimiento]) {
        acc[mov.tipoMovimiento] = { cantidad: 0, kilos: 0 }
      }
      acc[mov.tipoMovimiento].cantidad++
      acc[mov.tipoMovimiento].kilos += mov.kilos
      return acc
    }, {})
    
    const totalKilos = movimientos.reduce((acc, mov) => acc + mov.kilos, 0)
    
    return NextResponse.json({ 
      success: true, 
      data: { 
        resumen,
        totalKilos,
        cantidadMovimientos: movimientos.length
      } 
    })
  } catch (error) {
    console.error('Error getting resumen desposte:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener resumen' }, { status: 500 })
  }
}
