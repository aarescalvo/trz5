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
  CreditCard, Filter, RefreshCw, FileText, Package, Scale,
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

interface CajaDetalle {
  id: string
  numero: string
  fecha: string
  tropaCodigo: string
  producto: string
  pesoNeto: number
  pesoBruto: number
  tara: number
  piezas: number
  propietario: string
  estado: string
  destino: string
}

interface ResumenCajas {
  totalCajas: number
  totalKg: number
  avgKgPorCaja: number
}

interface ReporteCajasProps {
  operador: Operador
}

export function ReporteCajas({ operador }: ReporteCajasProps) {
  const [loading, setLoading] = useState(false)
  const [datos, setDatos] = useState<CajaDetalle[]>([])
  const [resumen, setResumen] = useState<ResumenCajas | null>(null)

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

      const res = await fetch(`/api/reportes/cajas-producidas?${params.toString()}`)
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

  const handleExportarExcel = () => {
    if (datos.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }

    const headers = ['Fecha', 'N° Caja', 'Tropa', 'Producto', 'Peso Neto (kg)', 'Piezas', 'Destino', 'Estado']
    const rows = datos.map(d => [
      d.fecha, d.numero, d.tropaCodigo, d.producto,
      d.pesoNeto.toFixed(2), d.piezas, d.destino, d.estado,
    ])

    ExcelExporter.exportToExcel({
      filename: `reporte_cajas_${fechaDesde}_${fechaHasta}`,
      sheets: [{ name: 'Cajas', headers, data: rows }],
      title: 'Reporte de Cajas Producidas - Solemar Alimentaria',
    })
  }

  const handleExportarPDF = () => {
    if (datos.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }

    const headers = ['Fecha', 'N° Caja', 'Tropa', 'Producto', 'Kg Neto', 'Piezas', 'Destino']
    const rows = datos.map(d => [
      new Date(d.fecha).toLocaleDateString('es-AR'), d.numero, d.tropaCodigo,
      d.producto, d.pesoNeto.toFixed(2), d.piezas, d.destino,
    ])

    const doc = PDFExporter.generateReport({
      title: 'Reporte de Cajas Producidas',
      subtitle: `Período: ${fechaDesde} al ${fechaHasta}`,
      headers,
      data: rows,
      orientation: 'landscape',
    })
    PDFExporter.downloadPDF(doc, `reporte_cajas_${fechaDesde}_${fechaHasta}.pdf`)
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'ARMADA':
        return <Badge className="bg-stone-100 text-stone-700 text-xs">Armada</Badge>
      case 'EN_PALLET':
        return <Badge className="bg-blue-100 text-blue-700 text-xs">En pallet</Badge>
      case 'EN_CAMARA':
        return <Badge className="bg-cyan-100 text-cyan-700 text-xs">En cámara</Badge>
      case 'DESPACHADA':
        return <Badge className="bg-green-100 text-green-700 text-xs">Despachada</Badge>
      default:
        return <Badge variant="outline" className="text-xs">{estado}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5 text-rose-500" />
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
            <div className="flex items-end">
              <Button onClick={handleBuscar} className="w-full bg-rose-600 hover:bg-rose-700">
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
              <p className="text-xs text-stone-500 mb-1">Total Cajas</p>
              <p className="text-2xl font-bold text-stone-800">{resumen.totalCajas}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500 mb-1">Total Kg</p>
              <p className="text-2xl font-bold text-stone-800">{formatNumber(resumen.totalKg)}</p>
              <p className="text-xs text-stone-400">kilos netos</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500 mb-1 flex items-center justify-center gap-1">
                <Scale className="w-3 h-3 text-rose-500" /> Promedio Kg/Caja
              </p>
              <p className="text-2xl font-bold text-stone-800">{resumen.avgKgPorCaja.toFixed(1)}</p>
              <p className="text-xs text-stone-400">kg netos promedio</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-rose-500" />
            Cajas Producidas
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
              <RefreshCw className="w-8 h-8 animate-spin text-rose-500 mx-auto" />
              <p className="mt-2 text-stone-500">Cargando datos...</p>
            </div>
          ) : datos.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay datos de cajas para el período seleccionado</p>
            </div>
          ) : (
            <>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-stone-50">
                      <TableHead>Fecha</TableHead>
                      <TableHead>N° Caja</TableHead>
                      <TableHead>Tropa</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Peso Neto (kg)</TableHead>
                      <TableHead className="text-right">Piezas</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((d) => (
                      <TableRow key={d.id} className="hover:bg-stone-50">
                        <TableCell className="text-xs">
                          {new Date(d.fecha).toLocaleDateString('es-AR')}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{d.numero}</TableCell>
                        <TableCell className="font-mono text-xs">{d.tropaCodigo}</TableCell>
                        <TableCell className="text-xs max-w-40 truncate">{d.producto}</TableCell>
                        <TableCell className="text-right font-medium">{d.pesoNeto.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{d.piezas}</TableCell>
                        <TableCell className="text-xs">{d.destino}</TableCell>
                        <TableCell>{getEstadoBadge(d.estado)}</TableCell>
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

export default ReporteCajas
