import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { startOfDay, startOfWeek, startOfMonth, endOfWeek, endOfMonth, subDays, subWeeks, subMonths, format } from 'date-fns'
import { es } from 'date-fns/locale'

// GET - Informes de facturación con datos para gráficos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') || 'semanal' // semanal, mensual, porCliente
    const clienteId = searchParams.get('clienteId')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    // Construir filtro de fechas
    let fechaInicio: Date
    let fechaFin: Date = new Date()

    if (fechaDesde && fechaHasta) {
      fechaInicio = new Date(fechaDesde)
      fechaFin = new Date(fechaHasta)
    } else if (tipo === 'semanal') {
      // Últimas 8 semanas
      fechaInicio = subWeeks(new Date(), 8)
    } else if (tipo === 'mensual') {
      // Últimos 12 meses
      fechaInicio = subMonths(new Date(), 12)
    } else {
      fechaInicio = subMonths(new Date(), 3)
    }

    // Construir where
    const where: any = {
      estado: { not: 'ANULADA' },
      fecha: {
        gte: fechaInicio,
        lte: fechaFin
      }
    }

    if (clienteId) {
      where.clienteId = clienteId
    }

    // Obtener facturas
    const facturas = await db.factura.findMany({
      where,
      include: {
        cliente: {
          select: { id: true, nombre: true }
        }
      },
      orderBy: { fecha: 'asc' }
    })

    // Procesar según tipo de informe
    if (tipo === 'semanal') {
      return NextResponse.json({
        success: true,
        data: procesarDatosSemanales(facturas)
      })
    }

    if (tipo === 'mensual') {
      return NextResponse.json({
        success: true,
        data: procesarDatosMensuales(facturas)
      })
    }

    if (tipo === 'porCliente') {
      return NextResponse.json({
        success: true,
        data: procesarDatosPorCliente(facturas)
      })
    }

    // General: devolver resumen
    const resumen = {
      totalFacturas: facturas.length,
      montoTotal: facturas.reduce((sum, f) => sum + f.total, 0),
      montoPagado: facturas.reduce((sum, f) => sum + f.montoPagado, 0),
      saldoPendiente: facturas.reduce((sum, f) => sum + f.saldoPendiente, 0),
      facturasPendientes: facturas.filter(f => f.estado === 'PENDIENTE').length,
      facturasEmitidas: facturas.filter(f => f.estado === 'EMITIDA').length,
      facturasPagadas: facturas.filter(f => f.estado === 'PAGADA').length,
      periodo: {
        desde: fechaInicio,
        hasta: fechaFin
      }
    }

    return NextResponse.json({
      success: true,
      data: resumen
    })
  } catch (error) {
    console.error('Error generando informe de facturación:', error)
    return NextResponse.json(
      { success: false, error: 'Error al generar informe' },
      { status: 500 }
    )
  }
}

// Procesar datos para gráfico semanal
function procesarDatosSemanales(facturas: any[]) {
  const semanas: Record<string, { label: string; total: number; cantidad: number; pagado: number }> = {}

  for (const factura of facturas) {
    const fecha = new Date(factura.fecha)
    const inicioSemana = startOfWeek(fecha, { weekStartsOn: 1, locale: es })
    const key = format(inicioSemana, 'yyyy-MM-dd')
    const label = format(inicioSemana, "dd MMM", { locale: es })

    if (!semanas[key]) {
      semanas[key] = { label, total: 0, cantidad: 0, pagado: 0 }
    }

    semanas[key].total += factura.total
    semanas[key].cantidad += 1
    semanas[key].pagado += factura.montoPagado
  }

  // Convertir a array ordenado
  return Object.entries(semanas)
    .map(([key, data]) => ({
      fecha: key,
      ...data
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
}

// Procesar datos para gráfico mensual
function procesarDatosMensuales(facturas: any[]) {
  const meses: Record<string, { label: string; total: number; cantidad: number; pagado: number }> = {}

  for (const factura of facturas) {
    const fecha = new Date(factura.fecha)
    const key = format(fecha, 'yyyy-MM')
    const label = format(fecha, "MMMM yyyy", { locale: es })

    if (!meses[key]) {
      meses[key] = { label, total: 0, cantidad: 0, pagado: 0 }
    }

    meses[key].total += factura.total
    meses[key].cantidad += 1
    meses[key].pagado += factura.montoPagado
  }

  return Object.entries(meses)
    .map(([key, data]) => ({
      mes: key,
      ...data
    }))
    .sort((a, b) => a.mes.localeCompare(b.mes))
}

// Procesar datos por cliente
function procesarDatosPorCliente(facturas: any[]) {
  const clientes: Record<string, { clienteId: string; clienteNombre: string; total: number; cantidad: number; saldoPendiente: number }> = {}

  for (const factura of facturas) {
    const key = factura.clienteId

    if (!clientes[key]) {
      clientes[key] = {
        clienteId: factura.clienteId,
        clienteNombre: factura.cliente?.nombre || 'Sin cliente',
        total: 0,
        cantidad: 0,
        saldoPendiente: 0
      }
    }

    clientes[key].total += factura.total
    clientes[key].cantidad += 1
    clientes[key].saldoPendiente += factura.saldoPendiente
  }

  return Object.values(clientes)
    .sort((a, b) => b.total - a.total)
}
