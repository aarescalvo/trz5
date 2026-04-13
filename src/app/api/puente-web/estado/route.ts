import { NextResponse } from 'next/server';
import { puenteWeb } from '@/lib/puente-web';

export async function GET() {
  try {
    const estado = await puenteWeb.getEstado();
    const conexion = await puenteWeb.probarConexion();
    
    return NextResponse.json({
      estado,
      conexion,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error obteniendo estado del puente web', details: String(error) },
      { status: 500 }
    );
  }
}
