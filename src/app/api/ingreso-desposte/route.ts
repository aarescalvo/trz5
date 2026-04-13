import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar ingresos a desposte
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha')
    const estado = searchParams.get('estado')
    
    const where: any = {}
    
    if (fecha) {
      const fechaInicio = new Date(fecha)
      fechaInicio.setHours(0, 0, 0, 0)
      const fechaFin = new Date(fecha)
      fechaFin.setHours(23, 59, 59, 999)
      where.fecha = { gte: fechaInicio, lte: fechaFin }
    }
    
    if (estado) {
      where.estado = estado
    }
    
    const ingresos = await db.ingresoDesposte.findMany({
      where,
      include: {
        camara: { select: { id: true, nombre: true } },
        operador: { select: { id: true, nombre: true } }
      },
      orderBy: { fecha: 'desc' }
    })
    
    return NextResponse.json({ success: true, data: ingresos })
  } catch (error) {
    console.error('Error fetching ingresos desposte:', error)
    return NextResponse.json({ success: false, error: 'Error al obtener ingresos' }, { status: 500 })
  }
}

// POST - Crear nuevo ingreso a desposte
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      origenTipo, 
      origenIds, 
      pesoEntrada, 
      camaraId, 
      operadorId, 
      observaciones 
    } = body
    
    // Validaciones
    if (!pesoEntrada || pesoEntrada <= 0) {
      return NextResponse.json({ success: false, error: 'Peso de entrada requerido' }, { status: 400 })
    }
    
    // Generar código único
    const ultimoIngreso = await db.ingresoDesposte.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { codigo: true }
    })
    
    const numeroIngreso = ultimoIngreso?.codigo 
      ? parseInt(ultimoIngreso.codigo.replace('ID-', '')) + 1 
      : 1
    
    const codigo = `ID-${numeroIngreso.toString().padStart(6, '0')}`
    
    const ingreso = await db.ingresoDesposte.create({
      data: {
        codigo,
        origenTipo: origenTipo || 'CUARTO',
        origenIds,
        pesoEntrada,
        camaraId,
        estado: 'EN_PROCESO',
        operadorId,
        observaciones
      },
      include: {
        camara: { select: { id: true, nombre: true } }
      }
    })
    
    return NextResponse.json({ success: true, data: ingreso })
  } catch (error) {
    console.error('Error creating ingreso desposte:', error)
    return NextResponse.json({ success: false, error: 'Error al crear ingreso' }, { status: 500 })
  }
}
