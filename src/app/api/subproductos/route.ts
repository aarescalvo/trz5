import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Listar subproductos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activos = searchParams.get('activos');
    const categoria = searchParams.get('categoria');

    const where: Record<string, unknown> = {};
    if (activos === 'true') {
      where.activo = true;
    }
    if (categoria) {
      where.categoria = categoria;
    }

    const subproductos = await db.subproducto.findMany({
      where,
      orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }]
    });

    return NextResponse.json(subproductos);
  } catch (error) {
    console.error('Error al obtener subproductos:', error);
    return NextResponse.json({ error: 'Error al obtener subproductos' }, { status: 500 });
  }
}

// POST - Crear subproducto
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const subproducto = await db.subproducto.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion,
        categoria: data.categoria,
        tipo: data.tipo,
        precioKg: data.precioKg,
        costoProcesamiento: data.costoProcesamiento,
        requiereTrazabilidad: data.requiereTrazabilidad ?? false,
        unidadMedida: data.unidadMedida || 'KG',
        stockMinimo: data.stockMinimo,
        activo: data.activo ?? true,
      }
    });

    return NextResponse.json(subproducto);
  } catch (error) {
    console.error('Error al crear subproducto:', error);
    return NextResponse.json({ error: 'Error al crear subproducto' }, { status: 500 });
  }
}

// PUT - Actualizar subproducto
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const subproducto = await db.subproducto.update({
      where: { id: data.id },
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion,
        categoria: data.categoria,
        tipo: data.tipo,
        precioKg: data.precioKg,
        costoProcesamiento: data.costoProcesamiento,
        requiereTrazabilidad: data.requiereTrazabilidad,
        unidadMedida: data.unidadMedida,
        stockMinimo: data.stockMinimo,
        activo: data.activo,
      }
    });

    return NextResponse.json(subproducto);
  } catch (error) {
    console.error('Error al actualizar subproducto:', error);
    return NextResponse.json({ error: 'Error al actualizar subproducto' }, { status: 500 });
  }
}

// DELETE - Eliminar subproducto
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    await db.subproducto.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar subproducto:', error);
    return NextResponse.json({ error: 'Error al eliminar subproducto' }, { status: 500 });
  }
}
