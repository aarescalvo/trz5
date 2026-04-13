'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { 
  Download, FileText, Filter, Printer, Calendar, 
  Beef, TrendingUp, BarChart3, RefreshCw, FileSpreadsheet
} from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface DatosFaena {
  id: string
  fecha: string
  tropaCodigo: string
  especie: string
  tipoAnimal: string
  cantidad: number
  pesoVivo: number
  pesoMedia: number
  rinde: number
  productor: string
  usuarioFaena: string
}

interface TotalesFaena {
  totalAnimales: number
  totalPesoVivo: number
  totalPesoMedia: number
  rindePromedio: number
  totalTropas: number
}

interface ReporteFaenaProps {
  operador: Operador
}

export function ReporteFaena({ operador }: ReporteFaenaProps) {
  const [loading, setLoading] = useState(false)
  const [datos, setDatos] = useState<DatosFaena[]>([])
  const [totales, setTotales] = useState<TotalesFaena | null>(null)
  
  // Filtros
  const [fechaDesde, setFechaDesde] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [fechaHasta, setFechaHasta] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [filtroTropa, setFiltroTropa] = useState<string>('')
  const [filtroEspecie, setFiltroEspecie] = useState<string>('todas')
  const [filtroTipoAnimal, setFiltroTipoAnimal] = useState<string>('todos')
  
  useEffect(() => {
    fetchDatos()
  }, [])
  
  const fetchDatos = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('fechaDesde', fechaDesde)
      params.append('fechaHasta', fechaHasta)
      if (filtroTropa) params.append('tropa', filtroTropa)
      if (filtroEspecie !== 'todas') params.append('especie', filtroEspecie)
      if (filtroTipoAnimal !== 'todos') params.append('tipoAnimal', filtroTipoAnimal)
      
      const res = await fetch(`/api/reportes/faena?${params.toString()}`)
      const result = await res.json()
      
      if (result.success) {
        setDatos(result.data.detalles || [])
        setTotales(result.data.totales || null)
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
  
  const handleBuscar = () => {
    fetchDatos()
  }
  
  const exportarCSV = () => {
    if (datos.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }
    
    let csv = 'Fecha,Tropa,Especie,Tipo Animal,Cantidad,Peso Vivo (kg),Peso Media (kg),Rinde %,Productor,Usuario Faena\n'
    
    datos.forEach(d => {
      csv += `${d.fecha},${d.tropaCodigo},${d.especie},${d.tipoAnimal},${d.cantidad},${d.pesoVivo},${d.pesoMedia},${d.rinde.toFixed(1)},"${d.productor}","${d.usuarioFaena}"\n`
    })
    
    // Agregar totales
    if (totales) {
      csv += '\nTOTALES,,,,'
      csv += `${totales.totalAnimales},${totales.totalPesoVivo},${totales.totalPesoMedia},${totales.rindePromedio.toFixed(1)},,`
      csv += `\nTotal Tropas: ${totales.totalTropas}`
    }
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `reporte_faena_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    toast.success('CSV descargado')
  }
  
  const imprimirReporte = () => {
    window.print()
  }
  
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-AR').format(num)
  }
  
  const getRindeColor = (rinde: number) => {
    if (rinde >= 55) return 'bg-green-100 text-green-700'
    if (rinde >= 50) return 'bg-amber-100 text-amber-700'
    return 'bg-red-100 text-red-700'
  }
  
  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5 text-amber-500" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label className="text-xs">Fecha Desde</Label>
              <Input 
                type="date" 
                value={fechaDesde} 
                onChange={(e) => setFechaDesde(e.target.value)} 
              />
            </div>
            <div>
              <Label className="text-xs">Fecha Hasta</Label>
              <Input 
                type="date" 
                value={fechaHasta} 
                onChange={(e) => setFechaHasta(e.target.value)} 
              />
            </div>
            <div>
              <Label className="text-xs">Tropa</Label>
              <Input 
                placeholder="Código tropa"
                value={filtroTropa}
                onChange={(e) => setFiltroTropa(e.target.value)}
              />
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
            <div>
              <Label className="text-xs">Tipo Animal</Label>
              <Select value={filtroTipoAnimal} onValueChange={setFiltroTipoAnimal}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="TO">Toro</SelectItem>
                  <SelectItem value="VA">Vaca</SelectItem>
                  <SelectItem value="VQ">Vaquillona</SelectItem>
                  <SelectItem value="NO">Novillo</SelectItem>
                  <SelectItem value="NT">Novillito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleBuscar} className="w-full bg-amber-500 hover:bg-amber-600">
                <RefreshCw className="w-4 h-4 mr-2" />
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Resumen / Totales */}
      {totales && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500 mb-1">Total Animales</p>
              <p className="text-2xl font-bold text-stone-800">{formatNumber(totales.totalAnimales)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500 mb-1">Total Peso Vivo</p>
              <p className="text-2xl font-bold text-stone-800">{formatNumber(totales.totalPesoVivo)}</p>
              <p className="text-xs text-stone-400">kg</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500 mb-1">Total Peso Media</p>
              <p className="text-2xl font-bold text-stone-800">{formatNumber(totales.totalPesoMedia)}</p>
              <p className="text-xs text-stone-400">kg</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500 mb-1">Rinde Promedio</p>
              <p className={`text-2xl font-bold ${totales.rindePromedio >= 55 ? 'text-green-600' : totales.rindePromedio >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                {totales.rindePromedio.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-stone-500 mb-1">Total Tropas</p>
              <p className="text-2xl font-bold text-stone-800">{totales.totalTropas}</p>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Tabla de datos */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Beef className="w-5 h-5 text-amber-500" />
            Detalle de Faena
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportarCSV} disabled={datos.length === 0}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={imprimirReporte} disabled={datos.length === 0}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
              <p className="mt-2 text-stone-500">Cargando datos...</p>
            </div>
          ) : datos.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay datos para el período seleccionado</p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <Table>
                <TableHeader>
                  <TableRow className="bg-stone-50">
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tropa</TableHead>
                    <TableHead>Especie</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Cant.</TableHead>
                    <TableHead className="text-right">P. Vivo</TableHead>
                    <TableHead className="text-right">P. Media</TableHead>
                    <TableHead className="text-right">Rinde</TableHead>
                    <TableHead>Productor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datos.map((d, i) => (
                    <TableRow key={i} className="hover:bg-stone-50">
                      <TableCell className="text-xs">{new Date(d.fecha).toLocaleDateString('es-AR')}</TableCell>
                      <TableCell className="font-mono text-xs">{d.tropaCodigo}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{d.especie}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{d.tipoAnimal}</TableCell>
                      <TableCell className="text-right font-medium">{d.cantidad}</TableCell>
                      <TableCell className="text-right">{formatNumber(d.pesoVivo)}</TableCell>
                      <TableCell className="text-right">{formatNumber(d.pesoMedia)}</TableCell>
                      <TableCell className="text-right">
                        <Badge className={`text-xs ${getRindeColor(d.rinde)}`}>
                          {d.rinde.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-32 truncate">{d.productor}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ReporteFaena
