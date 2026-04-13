'use client'

import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, TrendingDown, Calendar, Filter, BarChart3, LineChart, ArrowUpDown, Download } from 'lucide-react'
import { ExportButton } from '@/components/ui/export-button'
import { PDFExporter } from '@/lib/export-pdf'
import { ExcelExporter } from '@/lib/export-excel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  type ChartConfig 
} from '@/components/ui/chart'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  ComposedChart,
  Legend
} from 'recharts'
import { toast } from 'sonner'

interface RendimientoHistorico {
  id: string
  fecha: string
  periodo: string
  cantidadAnimales: number
  pesoVivoTotal: number
  pesoFrioTotal: number
  rindePromedio: number
  rindeMaximo: number
  rindeMinimo: number
  tipoAnimal?: string
  productorId?: string
  productor?: { nombre: string }
}

interface Operador {
  id: string
  nombre: string
  nivel: string
}

const chartConfig = {
  rindePromedio: {
    label: 'Rinde Promedio',
    color: '#f59e0b',
  },
  rindeMaximo: {
    label: 'Rinde Máximo',
    color: '#22c55e',
  },
  rindeMinimo: {
    label: 'Rinde Mínimo',
    color: '#ef4444',
  },
  cantidadAnimales: {
    label: 'Cantidad',
    color: '#6366f1',
  },
} satisfies ChartConfig

export function RendimientosHistorico({ operador }: { operador: Operador }) {
  const [rendimientos, setRendimientos] = useState<RendimientoHistorico[]>([])
  const [loading, setLoading] = useState(true)
  const [periodoFiltro, setPeriodoFiltro] = useState('todos')
  const [tipoAnimalFiltro, setTipoAnimalFiltro] = useState('todos')
  const [chartType, setChartType] = useState<'area' | 'bar' | 'composed'>('area')

  // Funciones de exportación
  const handleExportPDF = () => {
    const data = datosFiltrados.map(r => ({
      fecha: r.fecha,
      periodo: r.periodo,
      tipoAnimal: r.tipoAnimal,
      cantidadAnimales: r.cantidadAnimales,
      pesoVivoTotal: r.pesoVivoTotal,
      pesoFrioTotal: r.pesoFrioTotal,
      rindePromedio: r.rindePromedio,
      rindeMaximo: r.rindeMaximo,
      rindeMinimo: r.rindeMinimo,
    }))
    const doc = PDFExporter.generateRendimientoReport(data)
    PDFExporter.downloadPDF(doc, `reporte_rendimientos_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const handleExportExcel = () => {
    const data = datosFiltrados.map(r => ({
      fecha: r.fecha,
      periodo: r.periodo,
      tipoAnimal: r.tipoAnimal,
      cantidadAnimales: r.cantidadAnimales,
      pesoVivoTotal: r.pesoVivoTotal,
      pesoFrioTotal: r.pesoFrioTotal,
      rindePromedio: r.rindePromedio,
      rindeMaximo: r.rindeMaximo,
      rindeMinimo: r.rindeMinimo,
    }))
    ExcelExporter.exportRendimientoReport(data, `reporte_rendimientos_${new Date().toISOString().split('T')[0]}`)
  }

  useEffect(() => {
    fetchRendimientos()
  }, [])

  const fetchRendimientos = async () => {
    try {
      const res = await fetch('/api/rendimientos-historico')
      const data = await res.json()
      if (data.success) {
        setRendimientos(data.data)
      }
    } catch (error) {
      console.error('Error fetching rendimientos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar datos
  const datosFiltrados = useMemo(() => {
    let datos = [...rendimientos]
    
    if (periodoFiltro !== 'todos') {
      const hoy = new Date()
      const fechaLimite = new Date()
      
      switch (periodoFiltro) {
        case 'mes':
          fechaLimite.setMonth(hoy.getMonth() - 1)
          break
        case 'trimestre':
          fechaLimite.setMonth(hoy.getMonth() - 3)
          break
        case 'semestre':
          fechaLimite.setMonth(hoy.getMonth() - 6)
          break
        case 'año':
          fechaLimite.setFullYear(hoy.getFullYear() - 1)
          break
      }
      
      datos = datos.filter(r => new Date(r.fecha) >= fechaLimite)
    }
    
    if (tipoAnimalFiltro !== 'todos') {
      datos = datos.filter(r => r.tipoAnimal === tipoAnimalFiltro)
    }
    
    return datos.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
  }, [rendimientos, periodoFiltro, tipoAnimalFiltro])

  // Preparar datos para el gráfico
  const chartData = useMemo(() => {
    return datosFiltrados.map(r => ({
      fecha: new Date(r.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
      periodo: r.periodo,
      rindePromedio: r.rindePromedio,
      rindeMaximo: r.rindeMaximo,
      rindeMinimo: r.rindeMinimo,
      cantidadAnimales: r.cantidadAnimales,
      rindeObjetivo: 52 // Línea de objetivo
    }))
  }, [datosFiltrados])

  // Estadísticas
  const estadisticas = useMemo(() => {
    if (datosFiltrados.length === 0) {
      return {
        totalAnimales: 0,
        rindePromedioGeneral: 0,
        mejorRinde: 0,
        peorRinde: 0,
        tendencia: 'estable'
      }
    }
    
    const totalAnimales = datosFiltrados.reduce((acc, r) => acc + r.cantidadAnimales, 0)
    const rindePromedioGeneral = datosFiltrados.reduce((acc, r) => acc + r.rindePromedio, 0) / datosFiltrados.length
    const mejorRinde = Math.max(...datosFiltrados.map(r => r.rindePromedio))
    const peorRinde = Math.min(...datosFiltrados.map(r => r.rindePromedio))
    
    // Calcular tendencia (comparar primera y segunda mitad)
    const mitad = Math.floor(datosFiltrados.length / 2)
    const primeraMitad = datosFiltrados.slice(0, mitad)
    const segundaMitad = datosFiltrados.slice(mitad)
    
    const promPrimera = primeraMitad.reduce((acc, r) => acc + r.rindePromedio, 0) / primeraMitad.length
    const promSegunda = segundaMitad.reduce((acc, r) => acc + r.rindePromedio, 0) / segundaMitad.length
    
    let tendencia = 'estable'
    if (promSegunda > promPrimera + 0.5) tendencia = 'subiendo'
    else if (promSegunda < promPrimera - 0.5) tendencia = 'bajando'
    
    return {
      totalAnimales,
      rindePromedioGeneral,
      mejorRinde,
      peorRinde,
      tendencia
    }
  }, [datosFiltrados])

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg pb-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-5 h-5 text-amber-600" />
                Filtros
              </CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Período:</Label>
                <Select value={periodoFiltro} onValueChange={setPeriodoFiltro}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="mes">Último mes</SelectItem>
                    <SelectItem value="trimestre">Último trimestre</SelectItem>
                    <SelectItem value="semestre">Último semestre</SelectItem>
                    <SelectItem value="año">Último año</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Tipo:</Label>
                <Select value={tipoAnimalFiltro} onValueChange={setTipoAnimalFiltro}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="NOVILLO">Novillo</SelectItem>
                    <SelectItem value="VACA">Vaca</SelectItem>
                    <SelectItem value="VAQUILLONA">Vaquillona</SelectItem>
                    <SelectItem value="TERNERO">Ternero</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1 border-l pl-3">
                <Button 
                  variant={chartType === 'area' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setChartType('area')}
                  className={chartType === 'area' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                >
                  <LineChart className="w-4 h-4" />
                </Button>
                <Button 
                  variant={chartType === 'bar' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setChartType('bar')}
                  className={chartType === 'bar' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Total Animales</p>
                <p className="text-2xl font-bold text-stone-800">{estadisticas.totalAnimales.toLocaleString()}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Rinde Promedio</p>
                <p className="text-2xl font-bold text-amber-600">{estadisticas.rindePromedioGeneral.toFixed(2)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Mejor Rinde</p>
                <p className="text-2xl font-bold text-green-600">{estadisticas.mejorRinde.toFixed(2)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Peor Rinde</p>
                <p className="text-2xl font-bold text-red-600">{estadisticas.peorRinde.toFixed(2)}%</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Tendencia</p>
                <Badge className={`mt-1 ${
                  estadisticas.tendencia === 'subiendo' ? 'bg-green-100 text-green-700' :
                  estadisticas.tendencia === 'bajando' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {estadisticas.tendencia === 'subiendo' && <TrendingUp className="w-3 h-3 mr-1" />}
                  {estadisticas.tendencia === 'bajando' && <TrendingDown className="w-3 h-3 mr-1" />}
                  {estadisticas.tendencia === 'estable' && <ArrowUpDown className="w-3 h-3 mr-1" />}
                  {estadisticas.tendencia.charAt(0).toUpperCase() + estadisticas.tendencia.slice(1)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg">
          <CardTitle className="text-lg flex items-center gap-2">
            <LineChart className="w-5 h-5 text-amber-600" />
            Evolución de Rendimientos
          </CardTitle>
          <CardDescription>
            Histórico de rindes promedio, máximos y mínimos
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <LineChart className="w-8 h-8 animate-pulse text-amber-500" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-80 flex flex-col items-center justify-center text-stone-400">
              <BarChart3 className="w-12 h-12 mb-3 opacity-50" />
              <p>No hay datos para mostrar</p>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-80">
              {chartType === 'area' ? (
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-stone-200" />
                  <XAxis dataKey="fecha" className="text-xs" />
                  <YAxis domain={[45, 60]} className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="rindeMaximo" 
                    stackId="1" 
                    stroke="#22c55e" 
                    fill="#22c55e" 
                    fillOpacity={0.1} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="rindePromedio" 
                    stackId="2" 
                    stroke="#f59e0b" 
                    fill="#f59e0b" 
                    fillOpacity={0.3} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="rindeMinimo" 
                    stackId="3" 
                    stroke="#ef4444" 
                    fill="#ef4444" 
                    fillOpacity={0.1} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rindeObjetivo" 
                    stroke="#6366f1" 
                    strokeDasharray="5 5" 
                    dot={false} 
                  />
                </AreaChart>
              ) : chartType === 'bar' ? (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-stone-200" />
                  <XAxis dataKey="fecha" className="text-xs" />
                  <YAxis domain={[45, 60]} className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="rindePromedio" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="rindeObjetivo" stroke="#6366f1" strokeDasharray="5 5" dot={false} />
                </BarChart>
              ) : (
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-stone-200" />
                  <XAxis dataKey="fecha" className="text-xs" />
                  <YAxis yAxisId="left" domain={[45, 60]} className="text-xs" />
                  <YAxis yAxisId="right" orientation="right" className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar yAxisId="right" dataKey="cantidadAnimales" fill="#6366f1" fillOpacity={0.3} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="left" type="monotone" dataKey="rindePromedio" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
                  <Line yAxisId="left" type="monotone" dataKey="rindeObjetivo" stroke="#22c55e" strokeDasharray="5 5" dot={false} />
                </ComposedChart>
              )}
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Tabla de datos */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            Detalle por Período
          </CardTitle>
          <CardDescription>
            Registro detallado de rendimientos históricos
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <Calendar className="w-8 h-8 animate-pulse mx-auto text-amber-500" />
            </div>
          ) : datosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay datos registrados</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Animales</TableHead>
                    <TableHead className="text-right">Peso Vivo</TableHead>
                    <TableHead className="text-right">Peso Frío</TableHead>
                    <TableHead className="text-right">Rinde Prom.</TableHead>
                    <TableHead className="text-right">Rinde Máx.</TableHead>
                    <TableHead className="text-right">Rinde Mín.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datosFiltrados.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.periodo}</TableCell>
                      <TableCell>
                        {new Date(r.fecha).toLocaleDateString('es-AR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{r.tipoAnimal || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {r.cantidadAnimales.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {r.pesoVivoTotal.toLocaleString('es-AR')} kg
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {r.pesoFrioTotal.toLocaleString('es-AR')} kg
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={`${
                          r.rindePromedio >= 55 ? 'bg-green-100 text-green-700' :
                          r.rindePromedio >= 50 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {r.rindePromedio.toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-600">
                        {r.rindeMaximo.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        {r.rindeMinimo.toFixed(2)}%
                      </TableCell>
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

export default RendimientosHistorico
