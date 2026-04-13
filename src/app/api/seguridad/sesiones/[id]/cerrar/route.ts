import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Cerrar sesión forzadamente
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sesionId } = await params
    
    const sesion = await db.sesion.findUnique({
      where: { id: sesionId }
    })
    
    if (!sesion) {
      return NextResponse.json(
        { success: false, error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }
    
    // Cerrar sesión
    await db.sesion.update({
      where: { id: sesionId },
      data: {
        activa: false,
        fechaCierre: new Date(),
        motivoCierre: 'FORCED'
      }
    })
    
    // Registrar en auditoría
    await db.auditoria.create({
      data: {
        modulo: 'SEGURIDAD',
        accion: 'LOCK',
        entidad: 'Sesion',
        entidadId: sesionId,
        descripcion: `Sesión cerrada forzadamente. Operador: ${sesion.operadorId}`,
        ip: sesion.ip,
        userAgent: sesion.userAgent
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Sesión cerrada correctamente'
    })
  } catch (error) {
    console.error('Error cerrando sesión:', error)
    return NextResponse.json(
      { success: false, error: 'Error al cerrar sesión' },
      { status: 500 }
    )
  }
}
