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
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { 
  Download, DollarSign, Filter, Printer, Calendar, 
  TrendingUp, TrendingDown, RefreshCw, FileSpreadsheet,
  AlertTriangle, BarChart3, Package
} from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface CostoCentro {
  centroId: string
  centroNombre: string
  tipoCentro: string
  costoTotal: number
  cantidadProducida: number
  costoKg: number
  costoCabeza: number
  presupuesto: number
  desviacion: number
  porcentajeEjecucion: number
}

interface CostoInsumo {
  insumoId: string
  insumoNombre: string
  categoria: string
  cantidadConsumida: number
  unidad: string
  costoUnitario: number
  costoTotal: number
  porcentajeTotal: number
}

interface CostoComparativo {
  periodo: string
  costoReal: number
  costoEstandar: number
  desviacion: number
}

interface ReporteCostosProps {
  operador: Operador
}

const chartConfig = {
  costoReal: {
    label: 'Costo Real',
    color: '#f59e0b',
  },
  costoEstandar: {
    label: 'Costo Estándar',
    color: '#10b981',
  },
} satisfies ChartConfig

export function ReporteCostos({ operador }: ReporteCostosProps) {
  const [loading, setLoading] = useState(false)
  const [costosCentro, setCostosCentro] = useState<CostoCentro[]>([])
  const [costosInsumo, setCostosInsumo] = useState<CostoInsumo[]>([])
  const [comparativo, setComparativo] = useState<CostoComparativo[]>([])
  const [resumen, setResumen] = useState({
    costoTotal: 0,
    costoKgPromedio: 0,
    costoCabezaPromedio: 0,
    totalProducido: 0,
    desviacionTotal: 0
  })
  
  // Filtros
  const [mes, setMes] = useState<string>(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [filtroCentro, setFiltroCentro] = useState<string>('todos')
  
  useEffect(() => {
    fetchDatos()
  }, [])
  
  const fetchDatos = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('mes', mes)
      if (filtroCentro !== 'todos') params.append('centro', filtroCentro)
      
      const res = await fetch(`/api/reportes/costos?${params.toString()}`)
      const result = await res.json()
      
      if (result.success) {
        setCostosCentro(result.data.costosCentro || [])
        setCostosInsumo(result.data.costosInsumo || [])
        setComparativo(result.data.comparativo || [])
        setResumen(result.data.resumen || {
          costoTotal: 0,
          costoKgPromedio: 0,
          costoCabezaPromedio: 0,
          totalProducido: 0,
          desviacionTotal: 0
        })
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
    if (costosCentro.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }
    
    let csv = 'Centro,Tipo,Costo Total,Kg Producidos,Costo/Kg,Costo/Cabeza,Presupuesto,Desviación %\n'
    
    costosCentro.forEach(c => {
      csv += `"${c.centroNombre}",${c.tipoCentro},${c.costoTotal},${c.cantidadProducida},${c.costoKg.toFixed(2)},${c.costoCabeza.toFixed(2)},${c.presupuesto},${c.desviacion.toFixed(1)}\n`
    })
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `reporte_costos_${mes}.csv`
    link.click()
    toast.success('CSV descargado')
  }
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }
  
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-AR').format(num)
  }
  
  const getDesviacionColor = (desv: number) => {
    if (desv <= 0) return 'text-green-600' // Bajo presupuesto = verde
    if (desv <= 10) return 'text-amber-600' // Hasta 10% sobre = amarillo
    return 'text-red-600' // Más de 10% sobre = rojo
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
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-48">
              <Label className="text-xs">Período</Label>
              <Input 
                type="month" 
                value={mes} 
                onChange={(e) => setMes(e.target.value)} 
              />
            </div>
            <div className="w-full md:w-64">
              <Label className="text-xs">Centro de Costo</Label>
              <Select value={filtroCentro} onValueChange={setFiltroCentro}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los centros</SelectItem>
                  <SelectItem value="produccion">Producción</SelectItem>
                  <SelectItem value="faena">Faena</SelectItem>
                  <SelectItem value="logistica">Logística</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleBuscar} className="bg-amber-500 hover:bg-amber-600">
              <RefreshCw className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <p className="text-xs text-stone-500 mb-1">Costo Total</p>
            <p className="text-xl font-bold text-stone-800">{formatCurrency(resumen.costoTotal)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <p className="text-xs text-stone-500 mb-1">Costo/Kg</p>
            <p className="text-xl font-bold text-stone-800">{formatCurrency(resumen.costoKgPromedio)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <p className="text-xs text-stone-500 mb-1">Costo/Cabeza</p>
            <p className="text-xl font-bold text-stone-800">{formatCurrency(resumen.costoCabezaPromedio)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <p className="text-xs text-stone-500 mb-1">Total Producido</p>
            <p className="text-xl font-bold text-stone-800">{formatNumber(resumen.totalProducido)} kg</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <p className="text-xs text-stone-500 mb-1">Desviación Total</p>
            <p className={`text-xl font-bold ${getDesviacionColor(resumen.desviacionTotal)}`}>
              {resumen.desviacionTotal > 0 ? '+' : ''}{resumen.desviacionTotal.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs de reportes */}
      <Tabs defaultValue="centros" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="centros">
            <BarChart3 className="w-4 h-4 mr-2" />
            Por Centro
          </TabsTrigger>
          <TabsTrigger value="insumos">
            <Package className="w-4 h-4 mr-2" />
            Por Insumo
          </TabsTrigger>
          <TabsTrigger value="comparativo">
            <TrendingUp className="w-4 h-4 mr-2" />
            Comparativo
          </TabsTrigger>
        </TabsList>
        
        {/* Tab: Por Centro */}
        <TabsContent value="centros">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Costos por Centro de Producción</CardTitle>
              <Button variant="outline" size="sm" onClick={exportarCSV}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
                </div>
              ) : costosCentro.length === 0 ? (
                <div className="p-8 text-center text-stone-400">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay datos de costos</p>
                </div>
              ) : (
                <ScrollArea className="h-80">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-stone-50">
                        <TableHead>Centro</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Costo Total</TableHead>
                        <TableHead className="text-right">Kg Prod.</TableHead>
                        <TableHead className="text-right">$/Kg</TableHead>
                        <TableHead className="text-right">$/Cabeza</TableHead>
                        <TableHead>Presupuesto</TableHead>
                        <TableHead className="text-right">Desv.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {costosCentro.map((c, i) => (
                        <TableRow key={i} className="hover:bg-stone-50">
                          <TableCell className="font-medium">{c.centroNombre}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{c.tipoCentro}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(c.costoTotal)}</TableCell>
                          <TableCell className="text-right">{formatNumber(c.cantidadProducida)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(c.costoKg)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(c.costoCabeza)}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>{formatCurrency(c.presupuesto)}</span>
                                <span>{c.porcentajeEjecucion.toFixed(0)}%</span>
                              </div>
                              <Progress 
                                value={Math.min(c.porcentajeEjecucion, 100)} 
                                className={`h-2 ${c.porcentajeEjecucion > 100 ? 'bg-red-100' : ''}`}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`font-medium ${getDesviacionColor(c.desviacion)}`}>
                              {c.desviacion > 0 ? '+' : ''}{c.desviacion.toFixed(1)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab: Por Insumo */}
        <TabsContent value="insumos">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg">
              <CardTitle className="text-lg">Consumo de Insumos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
                </div>
              ) : costosInsumo.length === 0 ? (
                <div className="p-8 text-center text-stone-400">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay datos de insumos</p>
                </div>
              ) : (
                <ScrollArea className="h-80">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-stone-50">
                        <TableHead>Insumo</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">Costo Unit.</TableHead>
                        <TableHead className="text-right">Costo Total</TableHead>
                        <TableHead className="text-right">% Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {costosInsumo.slice(0, 20).map((c, i) => (
                        <TableRow key={i} className="hover:bg-stone-50">
                          <TableCell className="font-medium">{c.insumoNombre}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{c.categoria}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(c.cantidadConsumida)} {c.unidad}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(c.costoUnitario)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(c.costoTotal)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Progress value={c.porcentajeTotal} className="w-16 h-2" />
                              <span className="text-xs w-12 text-right">{c.porcentajeTotal.toFixed(1)}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab: Comparativo */}
        <TabsContent value="comparativo">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg">
              <CardTitle className="text-lg">Costo Real vs Estándar</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {loading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
                </div>
              ) : comparativo.length === 0 ? (
                <div className="p-8 text-center text-stone-400">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay datos comparativos</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <ChartContainer config={chartConfig} className="h-64 w-full">
                    <BarChart data={comparativo} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-stone-200" />
                      <XAxis dataKey="periodo" className="text-xs" />
                      <YAxis className="text-xs" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="costoReal" fill="#f59e0b" name="Costo Real" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="costoEstandar" fill="#10b981" name="Costo Estándar" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                  
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-xs text-stone-500">Promedio Real</p>
                      <p className="text-lg font-bold text-amber-600">
                        {formatCurrency(comparativo.reduce((a, b) => a + b.costoReal, 0) / comparativo.length)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-stone-500">Promedio Estándar</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(comparativo.reduce((a, b) => a + b.costoEstandar, 0) / comparativo.length)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-stone-500">Desviación Promedio</p>
                      <p className={`text-lg font-bold ${
                        comparativo.reduce((a, b) => a + b.desviacion, 0) / comparativo.length > 0 
                          ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {(comparativo.reduce((a, b) => a + b.desviacion, 0) / comparativo.length).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ReporteCostos
