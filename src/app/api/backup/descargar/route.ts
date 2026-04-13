import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

// GET - Descargar archivo de backup
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID de backup requerido' }, { status: 400 });
    }
    
    const backup = await db.historialBackup.findUnique({
      where: { id }
    });
    
    if (!backup) {
      return NextResponse.json({ error: 'Backup no encontrado' }, { status: 404 });
    }
    
    // Verificar si el archivo existe
    if (!fs.existsSync(backup.rutaArchivo)) {
      return NextResponse.json({ error: 'Archivo de backup no encontrado' }, { status: 404 });
    }
    
    // Leer archivo
    const fileBuffer = fs.readFileSync(backup.rutaArchivo);
    
    // Devolver como descarga
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${backup.nombreArchivo}"`,
        'Content-Length': backup.tamano.toString()
      }
    });
  } catch (error) {
    console.error('Error al descargar backup:', error);
    return NextResponse.json({ error: 'Error al descargar backup' }, { status: 500 });
  }
}
