import { NextRequest, NextResponse } from 'next/server';
import { puenteWeb } from '@/lib/puente-web';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listaFaenaId } = body;

    if (!listaFaenaId) {
      return NextResponse.json(
        { error: 'ID de lista de faena requerido' },
        { status: 400 }
      );
    }

    const resultados = await puenteWeb.procesarFlujoPostFaena(listaFaenaId);

    const exito = resultados.every(r => r.exito);

    return NextResponse.json({
      exito,
      resultados,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error procesando flujo post-faena', details: String(error) },
      { status: 500 }
    );
  }
}
