'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import {
  Building2, Filter, RefreshCw, FileText, CheckCircle, XCircle,
} from 'lucide-react'
import { ExportButton } from '@/components/ui/export-button'
import { ExcelExporter } from '@/lib/export-excel'
import { PDFExporter } from '@/lib/export-pdf'
import { usePagination } from '@/hooks/use-pagination'
import { DataTablePagination } from '@/components/ui/data-table-pagination'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface CCTotal {
  clienteId: string
  clienteNombre: string
  clienteCuit: string | null
  totalFacturado: number
  totalPagado: number
  saldo: number
  diasDesdeUltimoPago: number | null
  estado: string
  cantidadFacturas: number
  aging0_30: number
  aging31_60: number
  aging61_90: number
  agingMas90: number
}

interface ResumenCC {
  totalClientes: number
  totalSaldos: number
  clientesAlDia: number
  clientesVencidos: number
  saldoVencido: number
}

interface ReporteCuentasCorrientesProps {
  operador: Operador
}

export function ReporteCuentasCorrientes({ operador }: ReporteCuentasCorrientesProps) {
  const [loading, setLoading] = useState(false)
  const [datos, setDatos] = useState<CCTotal[]>([])
  const [resumen, setResumen] = useState<ResumenCC | null>(null)
  const [clientes, setClientes] = useState<{ id: string; nombre: string }[]>([])

  // Filtros
  const [fechaDesde, setFechaDesde] = useState<string>(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().split('T')[0]
  })
  const [fechaHasta, setFechaHasta] = useState<string>(() => {
    const d = new Date()
    return d.toISOString().split('T')[0]
  })
  const [filtroCliente, setFiltroCliente] = useState<string>('todos')

  const { paginatedData, currentPage, pageSize, totalPages, setPage, setPageSize } =
    usePagination(datos, { initialPageSize: 25 })

  useEffect(() => {
    fetchClientes()
    fetchDatos()
  }, [])

  const fetchClientes = async () => {
    try {
      const res = await fetch('/api/clientes?limit=500')
      const result = await res.json()
      if (result.success) {
        setClientes(result.data || [])
      }
    } catch (e) {
      // silently ignore
    }
  }

  const fetchDatos = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('fechaDesde', fechaDesde)
      params.append('fechaHasta', fechaHasta)
      if (filtroCliente !== 'todos') params.append('clienteId', filtroCliente)

      const res = await fetch(`/api/reportes/cuentas-corrientes?${params.toString()}`)
      const result = await res.json()

      if (result.success) {
        setDatos(result.data.detalles || [])
        setResumen(result.data.resumen || null)
      } else {
        toast.error('Error al cargar datos')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleBuscar = () => fetchDatos()

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)

  const getEstadoBadge = (estado: string, dias: number | null) => {
    if (estado === 'al dia') {
      return <Badge className="bg-green-100 text-green-700 text-xs"><CheckCircle className="w-3 h-3 mr-1" />Al día</Badge>
    }
    if (!dias) return <Badge className="bg-stone-100 text-stone-600 text-xs">Sin pagos</Badge>
    if (dias <= 30) return <Badge className="bg-yellow-100 text-yellow-700 text-xs">0-30 días</Badge>
    if (dias <= 60) return <Badge className="bg-amber-100 text-amber-700 text-xs">31-60 días</Badge>
    if (dias <= 90) return <Badge className="bg-orange-100 text-orange-700 text-xs">61-90 días</Badge>
    return <Badge className="bg-red-100 text-red-700 text-xs"><XCircle className="w-3 h-3 mr-1" />{'>'}90 días</Badge>
  }

  const handleExportarExcel = () => {
    if (datos.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }

    const headers = [
      'Cliente', 'CUIT', 'Total Facturado', 'Total Pagado', 'Saldo',
      'Días últ. pago', 'Estado', '0-30 días', '31-60 días', '61-90 días', '+90 días',
    ]
    const rows = datos.map(d => [
      d.clienteNombre, d.clienteCuit || '', d.totalFacturado, d.totalPagado,
      d.saldo, d.diasDesdeUltimoPago ?? '', d.estado,
      d.aging0_30, d.aging31_60, d.aging61_90, d.agingMas90,
    ])

    ExcelExporter.exportToExcel({
      filename: `reporte_ctas_ctes_${fechaDesde}_${fechaHasta}`,
      sheets: [{ name: 'Cuentas Corrientes', headers, data: rows }],
      title: 'Reporte de Cuentas Corrientes - Solemar Alimentaria',
    })
  }

  const handleExportarPDF = () => {
    if (datos.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }

    const headers = ['Cliente', 'Total Fact.', 'Total Pag.', 'Saldo', 'Días', 'Estado']
    const rows = datos.map(d => [
      d.clienteNombre, formatCurrency(d.totalFacturado), formatCurrency(d.totalPagado),
      formatCurrency(d.saldo), d.diasDesdeUltimoPago ?? '-', d.estado,
    ])

    const doc = PDFExporter.generateReport({
      title: 'Reporte de Cuentas Corrientes',
      subtitle: `Período: ${fechaDesde} al ${fechaHasta}`,
      headers,
      data: rows,
      orientation: 'landscape',
    })
    PDFExporter.downloadPDF(doc, `reporte_ctas_ctes_${fechaDesde}_${fechaHasta}.pdf`)
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5 text-cyan-500" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs">Fecha Desde</Label>
              <Input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Fecha Hasta</Label>
              <Input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Cliente</Label>
              <Select value={filtroCliente} onValueChange={setFiltroCliente}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los clientes</SelectItem>
                  {clientes.slice(0, 100).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleBuscar} className="w-full bg-cyan-600 hover:bg-cyan-700">
                <RefreshCw className="w-4 h-4 mr-2" />
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500 mb-1">Total Saldos</p>
              <p className="text-xl font-bold text-stone-800">{formatCurrency(resumen.totalSaldos)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500 mb-1">Total Clientes</p>
              <p className="text-2xl font-bold text-stone-800">{resumen.totalClientes}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500 mb-1">Al Día</p>
              <p className="text-2xl font-bold text-green-600">{resumen.clientesAlDia}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500 mb-1">Vencidos</p>
              <p className="text-2xl font-bold text-red-600">{resumen.clientesVencidos}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500 mb-1">Saldo Vencido</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(resumen.saldoVencido)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-500" />
            Cuentas Corrientes
          </CardTitle>
          <ExportButton
            onExportExcel={handleExportarExcel}
            onExportPDF={handleExportarPDF}
            onPrint={() => window.print()}
            disabled={datos.length === 0}
            size="sm"
          />
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-cyan-500 mx-auto" />
              <p className="mt-2 text-stone-500">Cargando datos...</p>
            </div>
          ) : datos.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay datos para el período seleccionado</p>
            </div>
          ) : (
            <>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-stone-50">
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Total Facturado</TableHead>
                      <TableHead className="text-right">Total Pagado</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                      <TableHead className="text-right">Días últ. pago</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">0-30</TableHead>
                      <TableHead className="text-right">31-60</TableHead>
                      <TableHead className="text-right">61-90</TableHead>
                      <TableHead className="text-right">{'>'}90</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((d) => (
                      <TableRow key={d.clienteId} className={`hover:bg-stone-50 ${d.estado === 'vencido' ? 'bg-red-50/30' : ''}`}>
                        <TableCell>
                          <div>
                            <p className="text-xs font-medium">{d.clienteNombre}</p>
                            {d.clienteCuit && (
                              <p className="text-xs text-stone-400">{d.clienteCuit}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-xs">{formatCurrency(d.totalFacturado)}</TableCell>
                        <TableCell className="text-right text-xs text-green-600">{formatCurrency(d.totalPagado)}</TableCell>
                        <TableCell className={`text-right font-medium ${d.saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(d.saldo)}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {d.diasDesdeUltimoPago !== null ? `${d.diasDesdeUltimoPago} días` : '-'}
                        </TableCell>
                        <TableCell>
                          {getEstadoBadge(d.estado, d.diasDesdeUltimoPago)}
                        </TableCell>
                        <TableCell className={`text-right text-xs ${d.aging0_30 > 0 ? 'text-yellow-600 font-medium' : 'text-stone-300'}`}>
                          {d.aging0_30 > 0 ? formatCurrency(d.aging0_30) : '-'}
                        </TableCell>
                        <TableCell className={`text-right text-xs ${d.aging31_60 > 0 ? 'text-amber-600 font-medium' : 'text-stone-300'}`}>
                          {d.aging31_60 > 0 ? formatCurrency(d.aging31_60) : '-'}
                        </TableCell>
                        <TableCell className={`text-right text-xs ${d.aging61_90 > 0 ? 'text-orange-600 font-medium' : 'text-stone-300'}`}>
                          {d.aging61_90 > 0 ? formatCurrency(d.aging61_90) : '-'}
                        </TableCell>
                        <TableCell className={`text-right text-xs ${d.agingMas90 > 0 ? 'text-red-600 font-medium' : 'text-stone-300'}`}>
                          {d.agingMas90 > 0 ? formatCurrency(d.agingMas90) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <DataTablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={datos.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ReporteCuentasCorrientes
