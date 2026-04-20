'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import {
  TrendingUp, Filter, RefreshCw, FileText, Package, Award, AlertTriangle,
} from 'lucide-react'
import { ExportButton } from '@/components/ui/export-button'
import { ExcelExporter } from '@/lib/export-excel'
import { PDFExporter } from '@/lib/export-pdf'
import { usePagination } from '@/hooks/use-pagination'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface RendimientoDetalle {
  tropaCodigo: string
  productor: string
  cabezas: number
  kgVivo: number
  kgCanal: number
  rinde: number
  fecha: string
  especie: string
}

interface ResumenRendimiento {
  totalTropas: number
  totalCabezas: number
  rindePromedio: number
  mejorTropa: { tropaCodigo: string; productor: string; rinde: number } | null
  peorTropa: { tropaCodigo: string; productor: string; rinde: number } | null
}

interface ReporteRendimientosProps {
  operador: Operador
}

export function ReporteRendimientos({ operador }: ReporteRendimientosProps) {
  const [loading, setLoading] = useState(false)
  const [datos, setDatos] = useState<RendimientoDetalle[]>([])
  const [resumen, setResumen] = useState<ResumenRendimiento | null>(null)

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
  const [filtroEspecie, setFiltroEspecie] = useState<string>('todas')

  const { paginatedData, currentPage, pageSize, totalPages, setPage, setPageSize } =
    usePagination(datos, { initialPageSize: 25 })

  useEffect(() => {
    fetchDatos()
  }, [])

  const fetchDatos = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('fechaDesde', fechaDesde)
      params.append('fechaHasta', fechaHasta)
      if (filtroEspecie !== 'todas') params.append('especie', filtroEspecie)

      const res = await fetch(`/api/reportes/rendimientos-gerenciales?${params.toString()}`)
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

  const formatNumber = (num: number) => new Intl.NumberFormat('es-AR').format(num)

  const getRindeColor = (rinde: number) => {
    if (rinde >= 52) return 'bg-green-100 text-green-700'
    if (rinde >= 48) return 'bg-amber-100 text-amber-700'
    return 'bg-red-100 text-red-700'
  }

  const getRindeBarColor = (rinde: number) => {
    if (rinde >= 52) return '#16a34a'
    if (rinde >= 48) return '#f59e0b'
    return '#dc2626'
  }

  // Datos del gráfico: top 20 tropas por rinde
  const chartData = useMemo(() => {
    return datos
      .slice(0, 30)
      .map(d => ({
        tropa: d.tropaCodigo.length > 10 ? d.tropaCodigo.slice(0, 10) + '…' : d.tropaCodigo,
        rinde: Math.round(d.rinde * 10) / 10,
        fill: getRindeBarColor(d.rinde),
      }))
  }, [datos])

  const handleExportarExcel = () => {
    if (datos.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }

    const headers = ['Tropa', 'Productor', 'Cabezas', 'Kg Vivo', 'Kg Canal', 'Rinde %', 'Fecha', 'Especie']
    const rows = datos.map(d => [
      d.tropaCodigo, d.productor, d.cabezas, d.kgVivo.toFixed(1),
      d.kgCanal.toFixed(1), d.rinde.toFixed(1), d.fecha, d.especie,
    ])

    ExcelExporter.exportToExcel({
      filename: `reporte_rendimientos_${fechaDesde}_${fechaHasta}`,
      sheets: [{ name: 'Rendimientos', headers, data: rows }],
      title: 'Reporte de Rendimientos - Solemar Alimentaria',
    })
  }

  const handleExportarPDF = () => {
    if (datos.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }

    const headers = ['Tropa', 'Productor', 'Cabezas', 'Kg Vivo', 'Kg Canal', 'Rinde %', 'Fecha']
    const rows = datos.map(d => [
      d.tropaCodigo, d.productor, d.cabezas, formatNumber(d.kgVivo),
      formatNumber(d.kgCanal), `${d.rinde.toFixed(1)}%`, d.fecha,
    ])

    const doc = PDFExporter.generateReport({
      title: 'Reporte de Rendimientos Gerenciales',
      subtitle: `Período: ${fechaDesde} al ${fechaHasta}`,
      headers,
      data: rows,
      orientation: 'landscape',
    })
    PDFExporter.downloadPDF(doc, `reporte_rendimientos_${fechaDesde}_${fechaHasta}.pdf`)
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5 text-green-500" />
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
              <Label className="text-xs">Especie</Label>
              <Select value={filtroEspecie} onValueChange={setFiltroEspecie}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="BOVINO">Bovinos</SelectItem>
                  <SelectItem value="EQUINO">Equinos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleBuscar} className="w-full bg-green-600 hover:bg-green-700">
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
              <p className="text-xs text-stone-500 mb-1">Total Tropas</p>
              <p className="text-2xl font-bold text-stone-800">{resumen.totalTropas}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500 mb-1">Total Cabezas</p>
              <p className="text-2xl font-bold text-stone-800">{formatNumber(resumen.totalCabezas)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500 mb-1">Rinde Promedio</p>
              <p className={`text-2xl font-bold ${getRindeColor(resumen.rindePromedio).replace('bg-', '').split(' ')[1] || 'text-stone-800'}`}>
                {resumen.rindePromedio.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500 mb-1 flex items-center justify-center gap-1">
                <Award className="w-3 h-3 text-green-500" /> Mejor Tropa
              </p>
              <p className="text-sm font-bold text-green-600">{resumen.mejorTropa?.tropaCodigo || '-'}</p>
              <p className="text-xs text-green-600">{resumen.mejorTropa?.rinde.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500 mb-1 flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3 text-red-500" /> Peor Tropa
              </p>
              <p className="text-sm font-bold text-red-600">{resumen.peorTropa?.tropaCodigo || '-'}</p>
              <p className="text-xs text-red-600">{resumen.peorTropa?.rinde.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráfico */}
      {chartData.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Rinde por Tropa
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-stone-200" />
                <XAxis dataKey="tropa" className="text-xs" angle={-45} textAnchor="end" height={80} />
                <YAxis className="text-xs" domain={[0, 'auto']} />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, 'Rinde']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e7e5e4' }}
                />
                <Legend />
                <Bar dataKey="rinde" name="Rinde %" fill="#16a34a" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <rect key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tabla */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-green-500" />
            Detalle de Rendimientos
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
              <RefreshCw className="w-8 h-8 animate-spin text-green-500 mx-auto" />
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
                      <TableHead>Tropa</TableHead>
                      <TableHead>Productor</TableHead>
                      <TableHead className="text-right">Cabezas</TableHead>
                      <TableHead className="text-right">Kg Vivo</TableHead>
                      <TableHead className="text-right">Kg Canal</TableHead>
                      <TableHead className="text-right">Rinde</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((d, i) => (
                      <TableRow key={i} className="hover:bg-stone-50">
                        <TableCell className="font-mono text-xs">{d.tropaCodigo}</TableCell>
                        <TableCell className="text-xs max-w-32 truncate">{d.productor}</TableCell>
                        <TableCell className="text-right font-medium">{d.cabezas}</TableCell>
                        <TableCell className="text-right">{formatNumber(d.kgVivo)}</TableCell>
                        <TableCell className="text-right">{formatNumber(d.kgCanal)}</TableCell>
                        <TableCell className="text-right">
                          <Badge className={`text-xs ${getRindeColor(d.rinde)}`}>
                            {d.rinde.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {new Date(d.fecha).toLocaleDateString('es-AR')}
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

export default ReporteRendimientos
