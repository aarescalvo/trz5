import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener sesiones activas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const operadorId = searchParams.get('operadorId')
    const soloActivas = searchParams.get('activas') !== 'false'
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: any = {}
    
    if (operadorId) {
      where.operadorId = operadorId
    }
    
    if (soloActivas) {
      where.activa = true
      where.fechaExpiracion = { gt: new Date() }
    }

    const sesiones = await db.sesion.findMany({
      where,
      include: {
        operador: {
          select: {
            id: true,
            nombre: true,
            usuario: true,
            rol: true
          }
        }
      },
      orderBy: {
        fechaInicio: 'desc'
      },
      take: limit
    })
    
    return NextResponse.json({
      success: true,
      data: sesiones
    })
  } catch (error) {
    console.error('Error obteniendo sesiones:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener sesiones' },
      { status: 500 }
    )
  }
}
