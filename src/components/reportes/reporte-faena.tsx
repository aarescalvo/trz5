'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Calendar, Download, Beef, Loader2, FileSpreadsheet } from 'lucide-react'
import { exportReport } from '@/lib/reportes-api'

interface FaenaData {
  fecha: string
  garron: number
  tropa: string
  numeroAnimal: number
  especie: string
  tipoAnimal: string
  pesoVivo: number | null
  pesoMediaIzq: number | null
  pesoMediaDer: number | null
  pesoTotal: number | null
  rinde: number | null
  tipificacion: string | null
  tipificador: string | null
}

export function ReporteFaena() {
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [especie, setEspecie] = useState<string>('todas')
  const [datos, setDatos] = useState<FaenaData[]>([])
  const [resumen, setResumen] = useState({
    totalAnimales: 0,
    totalPesoVivo: 0,
    totalPesoFaena: 0,
    rindePromedio: 0,
    bovinos: 0,
    equinos: 0
  })

  useEffect(() => {
    // Set default dates
    const today = new Date()
    const monthAgo = new Date(today)
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    
    setFechaHasta(today.toISOString().split('T')[0])
    setFechaDesde(monthAgo.toISOString().split('T')[0])
  }, [])

  const handleBuscar = async () => {
    if (!fechaDesde || !fechaHasta) {
      toast.error('Seleccione un rango de fechas')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/reportes/faena?desde=${fechaDesde}&hasta=${fechaHasta}&especie=${especie}`)
      const data = await res.json()
      
      if (data.success) {
        setDatos(data.data)
        setResumen(data.resumen)
      } else {
        toast.error(data.error || 'Error al obtener datos')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleExportar = async () => {
    if (datos.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }

    setExporting(true)
    try {
      const archivo = await exportReport({
        tipo: 'faena',
        datos,
        resumen,
        fechaDesde,
        fechaHasta
      })

      window.open(archivo, '_blank')
      toast.success('Reporte exportado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al exportar')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Fecha Desde</Label>
              <Input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha Hasta</Label>
              <Input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Especie</Label>
              <Select value={especie} onValueChange={setEspecie}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="BOVINO">Bovino</SelectItem>
                  <SelectItem value="EQUINO">Equino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleBuscar} disabled={loading} className="bg-amber-500 hover:bg-amber-600">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Beef className="w-4 h-4" />}
                <span className="ml-2">Buscar</span>
              </Button>
              <Button variant="outline" onClick={handleExportar} disabled={exporting || datos.length === 0}>
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                <span className="ml-2">Excel</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      {datos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500">Total Animales</p>
              <p className="text-2xl font-bold text-stone-800">{resumen.totalAnimales}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500">Bovinos</p>
              <p className="text-2xl font-bold text-amber-600">{resumen.bovinos}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500">Equinos</p>
              <p className="text-2xl font-bold text-emerald-600">{resumen.equinos}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500">Peso Vivo Total</p>
              <p className="text-2xl font-bold text-stone-800">{resumen.totalPesoVivo.toLocaleString()} kg</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500">Peso Faena Total</p>
              <p className="text-2xl font-bold text-stone-800">{resumen.totalPesoFaena.toLocaleString()} kg</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500">Rinde Promedio</p>
              <p className="text-2xl font-bold text-blue-600">{resumen.rindePromedio.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla de datos */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg">
          <CardTitle className="text-lg">Detalle de Faena</CardTitle>
          <CardDescription>
            {datos.length > 0 ? `${datos.length} registros encontrados` : 'Realice una búsqueda para ver datos'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {datos.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              <Beef className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Seleccione un rango de fechas y presione Buscar</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Garrón</TableHead>
                    <TableHead>Tropa</TableHead>
                    <TableHead>Nº Animal</TableHead>
                    <TableHead>Especie</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">P. Vivo</TableHead>
                    <TableHead className="text-right">M. Izq</TableHead>
                    <TableHead className="text-right">M. Der</TableHead>
                    <TableHead className="text-right">P. Total</TableHead>
                    <TableHead className="text-right">Rinde %</TableHead>
                    <TableHead>Tipif.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datos.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{row.fecha}</TableCell>
                      <TableCell className="font-mono">{row.garron}</TableCell>
                      <TableCell className="font-mono">{row.tropa}</TableCell>
                      <TableCell>{row.numeroAnimal}</TableCell>
                      <TableCell>
                        <Badge variant={row.especie === 'BOVINO' ? 'default' : 'secondary'}>
                          {row.especie === 'BOVINO' ? 'B' : 'E'}
                        </Badge>
                      </TableCell>
                      <TableCell>{row.tipoAnimal}</TableCell>
                      <TableCell className="text-right">{row.pesoVivo?.toFixed(1) || '-'}</TableCell>
                      <TableCell className="text-right">{row.pesoMediaIzq?.toFixed(1) || '-'}</TableCell>
                      <TableCell className="text-right">{row.pesoMediaDer?.toFixed(1) || '-'}</TableCell>
                      <TableCell className="text-right font-medium">{row.pesoTotal?.toFixed(1) || '-'}</TableCell>
                      <TableCell className="text-right">
                        {row.rinde ? (
                          <span className={row.rinde >= 50 ? 'text-green-600 font-medium' : ''}>
                            {row.rinde.toFixed(1)}%
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{row.tipificacion || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ReporteFaena
