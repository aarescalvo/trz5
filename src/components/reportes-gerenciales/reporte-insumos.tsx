'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import {
  Package, Filter, RefreshCw, FileText, AlertTriangle, DollarSign,
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

interface InsumoDetalle {
  id: string
  nombre: string
  codigo: string
  categoria: string
  stockActual: number
  stockMinimo: number
  stockMaximo: number | null
  unidadMedida: string
  precioUnitario: number | null
  ubicacion: string | null
  proveedorNombre: string | null
  alerta: boolean
}

interface ResumenInsumos {
  totalInsumos: number
  alertas: number
  valorTotal: number
}

interface ReporteInsumosProps {
  operador: Operador
}

const CATEGORIAS = [
  { value: 'todas', label: 'Todas' },
  { value: 'EMBALAJE', label: 'Embalaje' },
  { value: 'ETIQUETAS', label: 'Etiquetas' },
  { value: 'HIGIENE', label: 'Higiene' },
  { value: 'PROTECCION', label: 'Protección' },
  { value: 'HERRAMIENTAS', label: 'Herramientas' },
  { value: 'OFICINA', label: 'Oficina' },
  { value: 'OTROS', label: 'Otros' },
]

export function ReporteInsumos({ operador }: ReporteInsumosProps) {
  const [loading, setLoading] = useState(false)
  const [datos, setDatos] = useState<InsumoDetalle[]>([])
  const [resumen, setResumen] = useState<ResumenInsumos | null>(null)
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas')

  const { paginatedData, currentPage, pageSize, totalPages, setPage, setPageSize } =
    usePagination(datos, { initialPageSize: 25 })

  useEffect(() => {
    fetchDatos()
  }, [])

  const fetchDatos = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroCategoria !== 'todas') params.append('categoria', filtroCategoria)

      const res = await fetch(`/api/reportes/insumos?${params.toString()}`)
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

  const formatNumber = (num: number) => new Intl.NumberFormat('es-AR').format(num)

  const handleExportarExcel = () => {
    if (datos.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }

    const headers = ['Código', 'Nombre', 'Categoría', 'Stock Actual', 'Stock Mínimo', 'Unidad', 'Precio Unitario', 'Estado']
    const rows = datos.map(d => [
      d.codigo, d.nombre, d.categoria, d.stockActual, d.stockMinimo,
      d.unidadMedida, d.precioUnitario || '', d.alerta ? '⚠ BAJO MÍNIMO' : 'Normal',
    ])

    ExcelExporter.exportToExcel({
      filename: `reporte_insumos_${new Date().toISOString().split('T')[0]}`,
      sheets: [{ name: 'Insumos', headers, data: rows }],
      title: 'Reporte de Consumo de Insumos - Solemar Alimentaria',
    })
  }

  const handleExportarPDF = () => {
    if (datos.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }

    const headers = ['Código', 'Nombre', 'Categoría', 'Stock Actual', 'Stock Mín.', 'Unidad', 'Estado']
    const rows = datos.map(d => [
      d.codigo, d.nombre, d.categoria, formatNumber(d.stockActual),
      formatNumber(d.stockMinimo), d.unidadMedida,
      d.alerta ? '⚠ BAJO MÍNIMO' : 'Normal',
    ])

    const doc = PDFExporter.generateReport({
      title: 'Reporte de Consumo de Insumos',
      subtitle: filtroCategoria !== 'todas' ? `Categoría: ${filtroCategoria}` : undefined,
      headers,
      data: rows,
      orientation: 'landscape',
    })
    PDFExporter.downloadPDF(doc, `reporte_insumos_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5 text-purple-500" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs">Categoría</Label>
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleBuscar} className="w-full bg-purple-600 hover:bg-purple-700">
                <RefreshCw className="w-4 h-4 mr-2" />
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500 mb-1">Total Insumos</p>
              <p className="text-2xl font-bold text-stone-800">{resumen.totalInsumos}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500 mb-1 flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3 text-red-500" /> Alertas
              </p>
              <p className={`text-2xl font-bold ${resumen.alertas > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {resumen.alertas}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500 mb-1">Valor Total Stock</p>
              <p className="text-2xl font-bold text-stone-800">{formatCurrency(resumen.valorTotal)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-500" />
            Estado de Insumos
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
              <RefreshCw className="w-8 h-8 animate-spin text-purple-500 mx-auto" />
              <p className="mt-2 text-stone-500">Cargando datos...</p>
            </div>
          ) : datos.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay datos de insumos</p>
            </div>
          ) : (
            <>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-stone-50">
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-right">Stock Actual</TableHead>
                      <TableHead className="text-right">Stock Mín.</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead className="text-right">Precio Unit.</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((d) => (
                      <TableRow key={d.id} className={`hover:bg-stone-50 ${d.alerta ? 'bg-red-50/50' : ''}`}>
                        <TableCell className="font-mono text-xs">{d.codigo}</TableCell>
                        <TableCell className="text-xs font-medium">{d.nombre}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{d.categoria}</Badge>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${d.alerta ? 'text-red-600' : ''}`}>
                          {formatNumber(d.stockActual)}
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(d.stockMinimo)}</TableCell>
                        <TableCell className="text-xs">{d.unidadMedida}</TableCell>
                        <TableCell className="text-right text-xs">
                          {d.precioUnitario ? formatCurrency(d.precioUnitario) : '-'}
                        </TableCell>
                        <TableCell>
                          {d.alerta ? (
                            <Badge className="bg-red-100 text-red-700 text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Bajo mín.
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 text-xs">Normal</Badge>
                          )}
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

export default ReporteInsumos
