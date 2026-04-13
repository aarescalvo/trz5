import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Listar cajas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activos = searchParams.get('activos')
    const tipo = searchParams.get('tipo')
    const id = searchParams.get('id')

    // Si se pasa un ID específico, devolver esa caja con sus relaciones
    if (id) {
      const caja = await db.caja.findUnique({
        where: { id },
        include: {
          movimientos: {
            orderBy: { fecha: 'desc' },
            take: 50
          },
          arqueos: {
            orderBy: { fecha: 'desc' },
            take: 10
          }
        }
      })
      
      if (!caja) {
        return NextResponse.json(
          { success: false, error: 'Caja no encontrada' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        data: caja
      })
    }

    const where: Record<string, unknown> = {}
    if (activos === 'true') {
      where.activo = true
    }
    if (tipo) {
      where.tipo = tipo
    }

    const cajas = await db.caja.findMany({
      where,
      orderBy: { nombre: 'asc' },
      include: {
        _count: {
          select: {
            movimientos: true,
            arqueos: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: cajas
    })
  } catch (error) {
    console.error('Error al obtener cajas:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener cajas' },
      { status: 500 }
    )
  }
}

// POST - Crear caja
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validaciones
    if (!data.nombre) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      )
    }
    if (!data.tipo) {
      return NextResponse.json(
        { success: false, error: 'El tipo es requerido' },
        { status: 400 }
      )
    }

    // Verificar si ya existe una caja con el mismo nombre
    const existente = await db.caja.findUnique({
      where: { nombre: data.nombre }
    })
    if (existente) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una caja con ese nombre' },
        { status: 400 }
      )
    }

    const saldoInicial = data.saldoInicial ?? 0

    const caja = await db.caja.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        tipo: data.tipo,
        responsable: data.responsable || null,
        saldoActual: saldoInicial,
        saldoInicial: saldoInicial,
        cuentaBancariaId: data.cuentaBancariaId || null,
        activo: data.activo ?? true,
      }
    })

    // Si hay saldo inicial, crear movimiento de apertura
    if (saldoInicial > 0) {
      await db.movimientoCaja.create({
        data: {
          cajaId: caja.id,
          tipo: 'APERTURA',
          monto: saldoInicial,
          saldoAnterior: 0,
          saldoNueva: saldoInicial,
          concepto: 'Saldo inicial de apertura de caja',
          operadorId: data.operadorId || null,
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: caja
    })
  } catch (error) {
    console.error('Error al crear caja:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear caja' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar caja
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.id) {
      return NextResponse.json(
        { success: false, error: 'ID es requerido' },
        { status: 400 }
      )
    }

    // Verificar que existe
    const existente = await db.caja.findUnique({
      where: { id: data.id }
    })
    if (!existente) {
      return NextResponse.json(
        { success: false, error: 'Caja no encontrada' },
        { status: 404 }
      )
    }

    // Verificar nombre duplicado si se está cambiando
    if (data.nombre && data.nombre !== existente.nombre) {
      const nombreDuplicado = await db.caja.findUnique({
        where: { nombre: data.nombre }
      })
      if (nombreDuplicado) {
        return NextResponse.json(
          { success: false, error: 'Ya existe una caja con ese nombre' },
          { status: 400 }
        )
      }
    }

    const caja = await db.caja.update({
      where: { id: data.id },
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        tipo: data.tipo,
        responsable: data.responsable,
        cuentaBancariaId: data.cuentaBancariaId,
        activo: data.activo,
        // saldoActual solo se actualiza a través de movimientos
      }
    })

    return NextResponse.json({
      success: true,
      data: caja
    })
  } catch (error) {
    console.error('Error al actualizar caja:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar caja' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar caja
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

    // Verificar que no tenga movimientos asociados
    const movimientosAsociados = await db.movimientoCaja.findFirst({
      where: { cajaId: id }
    })
    if (movimientosAsociados) {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar, tiene movimientos asociados' },
        { status: 400 }
      )
    }

    // Verificar que no tenga arqueos asociados
    const arqueosAsociados = await db.arqueoCaja.findFirst({
      where: { cajaId: id }
    })
    if (arqueosAsociados) {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar, tiene arqueos asociados' },
        { status: 400 }
      )
    }

    await db.caja.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Caja eliminada correctamente'
    })
  } catch (error) {
    console.error('Error al eliminar caja:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar caja' },
      { status: 500 }
    )
  }
}
