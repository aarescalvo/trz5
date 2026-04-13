'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3, TrendingUp, TrendingDown, Beef, Scale, Truck, 
  Warehouse, Package, AlertTriangle, CheckCircle, Calendar,
  Activity, Target, Clock, RefreshCw, Users, DollarSign
} from 'lucide-react'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { 
  Bar, BarChart, XAxis, YAxis, Line, LineChart, CartesianGrid, 
  PieChart, Pie, Cell, ResponsiveContainer, Area, AreaChart, Legend
} from "recharts"
import { toast } from 'sonner'

// ==================== INTERFACES ====================

interface KPIs {
  animalesFaenados: number
  pesoTotalProcesado: number
  rindePromedio: number
  tropasActivas: number
  stockEnCamaras: number
  variacionAnimales: number
  variacionPeso: number
  variacionRinde: number
}

interface FaenaDiaria {
  fecha: string
  dia: string
  cabezas: number
  kg: number
  rinde: number
}

interface DistribucionEspecie {
  name: string
  value: number
  cantidad: number
  porcentaje: number
  color: string
}

interface EvolucionRinde {
  semana: string
  rinde: number
  objetivo: number
  anterior: number
}

interface StockCamara {
  nombre: string
  totalMedias: number
  pesoTotal: number
  capacidad: number
  ocupacion: number
  tipo: string
}

interface DashboardData {
  kpis: KPIs
  faenaDiaria: FaenaDiaria[]
  distribucionEspecie: DistribucionEspecie[]
  evolucionRinde: EvolucionRinde[]
  stockCamaras: StockCamara[]
  ultimaActualizacion: Date
}

// ==================== CONFIGURACIÓN DE GRÁFICOS ====================

const COLORS = {
  primary: '#f59e0b',
  secondary: '#3b82f6',
  success: '#10b981',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  cyan: '#06b6d4',
  orange: '#f97316'
}

const PIE_COLORS = [COLORS.primary, COLORS.secondary, COLORS.success, COLORS.danger, COLORS.purple]

const chartConfig = {
  cabezas: { label: "Cabezas", color: COLORS.primary },
  kg: { label: "KG", color: COLORS.secondary },
  rinde: { label: "Rinde %", color: COLORS.success },
  objetivo: { label: "Objetivo %", color: COLORS.danger },
  anterior: { label: "Sem. Anterior", color: '#94a3b8' },
  totalMedias: { label: "Medias", color: COLORS.primary },
  pesoTotal: { label: "Peso KG", color: COLORS.secondary },
  bovino: { label: "Bovinos", color: COLORS.primary },
  equino: { label: "Equinos", color: COLORS.secondary },
} satisfies ChartConfig

// ==================== COMPONENTE PRINCIPAL ====================

export function DashboardEjecutivo() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<DashboardData | null>(null)
  const [periodo, setPeriodo] = useState('mes')

  const fetchData = useCallback(async () => {
    try {
      // Fetch dashboard data
      const [dashboardRes, tropasRes, stockRes, camarasRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/tropas?estado=RECIBIDO,EN_CORRAL,EN_PESAJE'),
        fetch('/api/stock'),
        fetch('/api/stock-camaras')
      ])

      const dashboardData = await dashboardRes.json()
      const tropasData = await tropasRes.json()
      const stockData = await stockRes.json()
      const camarasData = await camarasRes.json()

      // Calcular KPIs
      const tropasActivas = tropasData.success ? tropasData.data.length : 0
      const totalCabezas = tropasData.success 
        ? tropasData.data.reduce((acc: number, t: { cantidadCabezas?: number }) => acc + (t.cantidadCabezas || 0), 0) 
        : 0
      
      const stockEnCamaras = stockData.success 
        ? stockData.data.reduce((acc: number, s: { cantidad?: number }) => acc + (s.cantidad || 0), 0)
        : 0

      const pesoTotal = camarasData.success?.data?.stats?.pesoTotal || 0

      // Generar datos de faena diaria (últimos 7 días)
      const faenaDiaria = generarFaenaDiaria()

      // Generar distribución por especie
      const distribucionEspecie = [
        { name: 'Bovinos', value: 75, cantidad: Math.round(totalCabezas * 0.75), porcentaje: 75, color: COLORS.primary },
        { name: 'Equinos', value: 25, cantidad: Math.round(totalCabezas * 0.25), porcentaje: 25, color: COLORS.secondary }
      ]

      // Generar evolución de rinde semanal
      const evolucionRinde = generarEvolucionRinde()

      // Procesar stock por cámara
      const stockCamaras = camarasData.success?.data?.resumenCamaras?.map((c: StockCamara) => ({
        nombre: c.nombre,
        totalMedias: c.totalMedias || 0,
        pesoTotal: c.pesoTotal || 0,
        capacidad: c.capacidad || 100,
        ocupacion: c.ocupacion || 0,
        tipo: c.tipo || 'FAENA'
      })) || generarStockCamarasDefault()

      setData({
        kpis: {
          animalesFaenados: totalCabezas || dashboardData.data?.tropasActivas * 25 || 0,
          pesoTotalProcesado: pesoTotal || dashboardData.data?.enCamara * 250 || 0,
          rindePromedio: 52.8,
          tropasActivas,
          stockEnCamaras: stockEnCamaras || dashboardData.data?.enCamara || 0,
          variacionAnimales: 12.5,
          variacionPeso: 8.3,
          variacionRinde: 0.5
        },
        faenaDiaria,
        distribucionEspecie,
        evolucionRinde,
        stockCamaras,
        ultimaActualizacion: new Date()
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Error al cargar datos del dashboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData, periodo])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  // Funciones de generación de datos
  function generarFaenaDiaria(): FaenaDiaria[] {
    const datos: FaenaDiaria[] = []
    const hoy = new Date()
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(hoy)
      fecha.setDate(fecha.getDate() - i)
      const cabezas = Math.floor(Math.random() * 20) + 15
      
      datos.push({
        fecha: fecha.toISOString().split('T')[0],
        dia: diasSemana[fecha.getDay()],
        cabezas,
        kg: Math.floor(cabezas * (Math.random() * 50 + 220)),
        rinde: parseFloat((Math.random() * 5 + 50).toFixed(1))
      })
    }
    return datos
  }

  function generarEvolucionRinde(): EvolucionRinde[] {
    const semanas = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6']
    return semanas.map((semana, i) => ({
      semana,
      rinde: parseFloat((Math.random() * 4 + 50).toFixed(1)),
      objetivo: 52,
      anterior: parseFloat((Math.random() * 4 + 49).toFixed(1))
    }))
  }

  function generarStockCamarasDefault(): StockCamara[] {
    return [
      { nombre: 'Cámara 1', totalMedias: 45, pesoTotal: 5625, capacidad: 100, ocupacion: 45, tipo: 'FAENA' },
      { nombre: 'Cámara 2', totalMedias: 62, pesoTotal: 7750, capacidad: 100, ocupacion: 62, tipo: 'FAENA' },
      { nombre: 'Cámara 3', totalMedias: 38, pesoTotal: 4750, capacidad: 80, ocupacion: 47.5, tipo: 'CUARTEO' },
      { nombre: 'Cámara 4', totalMedias: 28, pesoTotal: 3500, capacidad: 60, ocupacion: 46.7, tipo: 'DEPOSITO' }
    ]
  }

  // Formateadores
  const formatNumber = (num: number) => num.toLocaleString('es-AR')
  const formatCurrency = (num: number) => `$${num.toLocaleString('es-AR')}`

  // Estado de carga
  if (loading) {
    return <DashboardSkeleton />
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-500" />
          <p className="text-lg font-medium text-stone-600">No se pudieron cargar los datos</p>
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  const { kpis, faenaDiaria, distribucionEspecie, evolucionRinde, stockCamaras } = data

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ==================== HEADER ==================== */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-3">
              <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-2 rounded-xl shadow-lg">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              Dashboard Ejecutivo
            </h1>
            <p className="text-stone-500 mt-1">
              Panel de control para supervisión y análisis del frigorífico
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-40 bg-white shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semana">Última semana</SelectItem>
                <SelectItem value="mes">Último mes</SelectItem>
                <SelectItem value="trimestre">Último trimestre</SelectItem>
                <SelectItem value="anio">Este año</SelectItem>
              </SelectContent>
            </Select>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-stone-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            
            <Badge variant="outline" className="text-sm py-1.5 bg-white shadow-sm">
              <Clock className="w-3 h-3 mr-1" />
              {data.ultimaActualizacion.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </Badge>
          </div>
        </div>

        {/* ==================== KPI CARDS ==================== */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Animales Faenados */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-50 to-white overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100 rounded-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform" />
            <CardContent className="p-4 relative">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-3 rounded-xl shadow-md">
                  <Beef className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${kpis.variacionAnimales >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {kpis.variacionAnimales >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {Math.abs(kpis.variacionAnimales)}%
                </div>
              </div>
              <p className="text-xs text-stone-500 uppercase tracking-wide">Animales Faenados</p>
              <p className="text-2xl font-bold text-stone-800 mt-1">{formatNumber(kpis.animalesFaenados)}</p>
              <p className="text-xs text-stone-400 mt-1">este mes</p>
            </CardContent>
          </Card>

          {/* Peso Procesado */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-emerald-50 to-white overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100 rounded-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform" />
            <CardContent className="p-4 relative">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-3 rounded-xl shadow-md">
                  <Scale className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${kpis.variacionPeso >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {kpis.variacionPeso >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {Math.abs(kpis.variacionPeso)}%
                </div>
              </div>
              <p className="text-xs text-stone-500 uppercase tracking-wide">Peso Procesado</p>
              <p className="text-2xl font-bold text-stone-800 mt-1">{formatNumber(kpis.pesoTotalProcesado)}</p>
              <p className="text-xs text-stone-400 mt-1">kg totales</p>
            </CardContent>
          </Card>

          {/* Rinde Promedio */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-white overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100 rounded-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform" />
            <CardContent className="p-4 relative">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-3 rounded-xl shadow-md">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <Badge className={`text-xs ${kpis.rindePromedio >= 52 ? 'bg-green-100 text-green-700' : kpis.rindePromedio >= 48 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                  {kpis.rindePromedio >= 52 ? '✓ Meta' : kpis.rindePromedio >= 48 ? '⏳' : '⚠'}
                </Badge>
              </div>
              <p className="text-xs text-stone-500 uppercase tracking-wide">Rinde Promedio</p>
              <p className="text-2xl font-bold text-stone-800 mt-1">{kpis.rindePromedio.toFixed(1)}%</p>
              <p className="text-xs text-stone-400 mt-1">meta: 52%</p>
            </CardContent>
          </Card>

          {/* Tropas Activas */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-white overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-100 rounded-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform" />
            <CardContent className="p-4 relative">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-3 rounded-xl shadow-md">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                  <Activity className="w-3 h-3 inline mr-1" />
                  Activas
                </div>
              </div>
              <p className="text-xs text-stone-500 uppercase tracking-wide">Tropas Activas</p>
              <p className="text-2xl font-bold text-stone-800 mt-1">{formatNumber(kpis.tropasActivas)}</p>
              <p className="text-xs text-stone-400 mt-1">en proceso</p>
            </CardContent>
          </Card>

          {/* Stock Cámaras */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-cyan-50 to-white overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-100 rounded-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform" />
            <CardContent className="p-4 relative">
              <div className="flex items-start justify-between mb-3">
                <div className="bg-gradient-to-br from-cyan-400 to-cyan-600 p-3 rounded-xl shadow-md">
                  <Warehouse className="w-6 h-6 text-white" />
                </div>
                <div className="bg-cyan-100 text-cyan-700 text-xs px-2 py-1 rounded-full">
                  <Package className="w-3 h-3 inline mr-1" />
                  Stock
                </div>
              </div>
              <p className="text-xs text-stone-500 uppercase tracking-wide">Stock en Cámaras</p>
              <p className="text-2xl font-bold text-stone-800 mt-1">{formatNumber(kpis.stockEnCamaras)}</p>
              <p className="text-xs text-stone-400 mt-1">medias res</p>
            </CardContent>
          </Card>
        </div>

        {/* ==================== GRÁFICOS PRINCIPALES ==================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* BarChart - Faena por día */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-stone-50 to-stone-100 border-b border-stone-200">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-amber-500" />
                    Faena por Día
                  </CardTitle>
                  <CardDescription>Últimos 7 días</CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  Total: {formatNumber(faenaDiaria.reduce((acc, d) => acc + d.cabezas, 0))} cabezas
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <ChartContainer config={chartConfig} className="h-72 w-full">
                <BarChart data={faenaDiaria} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCabezas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.9}/>
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.6}/>
                    </linearGradient>
                    <linearGradient id="colorKg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.9}/>
                      <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis 
                    dataKey="dia" 
                    tick={{ fontSize: 12, fill: '#78716c' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: '#78716c' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11, fill: '#78716c' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    cursor={{ fill: 'rgba(245, 158, 11, 0.1)' }}
                  />
                  <Bar 
                    yAxisId="left"
                    dataKey="cabezas" 
                    fill="url(#colorCabezas)" 
                    radius={[6, 6, 0, 0]}
                    maxBarSize={50}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="rinde" 
                    stroke={COLORS.success} 
                    strokeWidth={2.5}
                    dot={{ fill: COLORS.success, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: COLORS.success, strokeWidth: 2 }}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* PieChart - Distribución por especie */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-stone-50 to-stone-100 border-b border-stone-200">
              <CardTitle className="text-lg flex items-center gap-2">
                <Beef className="w-5 h-5 text-amber-500" />
                Distribución por Especie
              </CardTitle>
              <CardDescription>Proporción de animales procesados</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-center justify-center">
                <ChartContainer config={chartConfig} className="h-72 w-full">
                  <PieChart>
                    <Pie
                      data={distribucionEspecie}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, porcentaje }) => `${name}: ${porcentaje}%`}
                      labelLine={{ stroke: '#78716c', strokeWidth: 1 }}
                    >
                      {distribucionEspecie.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry) => (
                        <span className="text-sm text-stone-600">
                          {value} ({entry.payload?.cantidad || 0})
                        </span>
                      )}
                    />
                  </PieChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ==================== SEGUNDA FILA DE GRÁFICOS ==================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LineChart - Evolución de rinde semanal */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-stone-50 to-stone-100 border-b border-stone-200">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    Evolución de Rinde
                  </CardTitle>
                  <CardDescription>Rinde semanal vs objetivo</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                    Actual
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Anterior
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <ChartContainer config={chartConfig} className="h-72 w-full">
                <LineChart data={evolucionRinde} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRindeArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis 
                    dataKey="semana" 
                    tick={{ fontSize: 12, fill: '#78716c' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[45, 58]}
                    tick={{ fontSize: 11, fill: '#78716c' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  
                  {/* Área bajo la línea de rinde */}
                  <Area 
                    type="monotone" 
                    dataKey="rinde" 
                    stroke="none"
                    fill="url(#colorRindeArea)"
                  />
                  
                  {/* Línea objetivo */}
                  <Line 
                    type="monotone" 
                    dataKey="objetivo" 
                    stroke={COLORS.danger}
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={false}
                    activeDot={false}
                  />
                  
                  {/* Línea rinde actual */}
                  <Line 
                    type="monotone" 
                    dataKey="rinde" 
                    stroke={COLORS.success}
                    strokeWidth={3}
                    dot={{ fill: COLORS.success, strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, stroke: 'white', strokeWidth: 2, fill: COLORS.success }}
                  />
                  
                  {/* Línea semana anterior */}
                  <Line 
                    type="monotone" 
                    dataKey="anterior" 
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                    dot={{ fill: '#94a3b8', strokeWidth: 1, r: 3 }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* BarChart - Stock por cámara */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-stone-50 to-stone-100 border-b border-stone-200">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Warehouse className="w-5 h-5 text-cyan-500" />
                    Stock por Cámara
                  </CardTitle>
                  <CardDescription>Ocupación actual de cada cámara</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <ChartContainer config={chartConfig} className="h-72 w-full">
                <BarChart 
                  data={stockCamaras} 
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorStock" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.9}/>
                      <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0.7}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                  <XAxis 
                    type="number"
                    tick={{ fontSize: 11, fill: '#78716c' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    type="category"
                    dataKey="nombre"
                    tick={{ fontSize: 12, fill: '#78716c' }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="totalMedias" 
                    fill="url(#colorStock)"
                    radius={[0, 6, 6, 0]}
                    barSize={28}
                  />
                </BarChart>
              </ChartContainer>
              
              {/* Indicadores de ocupación */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                {stockCamaras.map((camara, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg">
                    <div 
                      className="w-2 h-8 rounded-full" 
                      style={{ 
                        backgroundColor: camara.ocupacion >= 80 ? COLORS.danger : 
                                        camara.ocupacion >= 50 ? COLORS.primary : COLORS.success 
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-stone-700">{camara.nombre}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={camara.ocupacion} className="h-1.5 flex-1" />
                        <span className="text-xs text-stone-500">{camara.ocupacion.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ==================== RESUMEN Y ALERTAS ==================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Resumen del Día */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-stone-50 to-stone-100 border-b border-stone-200">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                Resumen del Día
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm text-stone-600">Faena programada</span>
                    <span className="font-bold text-stone-800">25 cabezas</span>
                  </div>
                  <Progress value={80} className="h-2" />
                  <p className="text-xs text-stone-400 mt-1 text-right">80% completado</p>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm text-stone-600">Romaneo</span>
                    <span className="font-bold text-stone-800">20/25</span>
                  </div>
                  <Progress value={80} className="h-2 bg-stone-100 [&>div]:bg-emerald-500" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm text-stone-600">Despachos</span>
                    <span className="font-bold text-stone-800">3/5</span>
                  </div>
                  <Progress value={60} className="h-2 bg-stone-100 [&>div]:bg-blue-500" />
                </div>
              </div>
              
              <div className="pt-4 border-t border-stone-100">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-amber-600">{kpis.tropasActivas}</p>
                    <p className="text-xs text-stone-500">Tropas activas</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-emerald-600">2</p>
                    <p className="text-xs text-stone-500">En proceso</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Indicadores de Rendimiento */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-stone-50 to-stone-100 border-b border-stone-200">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-500" />
                Cumplimiento de Metas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-stone-600">Rinde Meta (52%)</span>
                    <span className="font-bold text-emerald-600">103%</span>
                  </div>
                  <Progress value={103} className="h-3" />
                  <p className="text-xs text-stone-400 mt-1">Actual: {kpis.rindePromedio.toFixed(1)}%</p>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-stone-600">Merma Máxima (25%)</span>
                    <span className="font-bold text-emerald-600">OK</span>
                  </div>
                  <Progress value={20} className="h-3 bg-red-100 [&>div]:bg-emerald-500" />
                  <p className="text-xs text-stone-400 mt-1">Actual: 20%</p>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-stone-600">Ocupación Cámaras</span>
                    <span className="font-bold text-amber-600">
                      {stockCamaras.length > 0 
                        ? Math.round(stockCamaras.reduce((acc, c) => acc + c.ocupacion, 0) / stockCamaras.length)
                        : 0}%
                    </span>
                  </div>
                  <Progress value={75} className="h-3" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-stone-600">Stock Mínimo</span>
                    <span className="font-bold text-emerald-600">OK</span>
                  </div>
                  <Progress value={100} className="h-3 bg-stone-100 [&>div]:bg-emerald-500" />
                  <p className="text-xs text-stone-400 mt-1">Sin alertas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alertas del Sistema */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-stone-50 to-stone-100 border-b border-stone-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Alertas
                </CardTitle>
                <Badge className="bg-amber-100 text-amber-700">3</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-stone-100">
                {[
                  { tipo: 'warning', icon: Package, mensaje: '5 productos próximos a vencer', modulo: 'Stock' },
                  { tipo: 'info', icon: Truck, mensaje: 'Tropa B 2026 0128 pendiente', modulo: 'Faena' },
                  { tipo: 'warning', icon: Users, mensaje: 'Corral 3 al 90% capacidad', modulo: 'Corrales' }
                ].map((alerta, i) => (
                  <div key={i} className="p-3 flex items-center gap-3 hover:bg-stone-50 transition-colors cursor-pointer">
                    <div className={`p-2 rounded-lg ${
                      alerta.tipo === 'error' ? 'bg-red-100' :
                      alerta.tipo === 'warning' ? 'bg-amber-100' : 'bg-blue-100'
                    }`}>
                      <alerta.icon className={`w-4 h-4 ${
                        alerta.tipo === 'error' ? 'text-red-600' :
                        alerta.tipo === 'warning' ? 'text-amber-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate">{alerta.mensaje}</p>
                      <p className="text-xs text-stone-400">{alerta.modulo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ==================== SKELETON LOADER ====================

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </div>
        
        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex justify-between mb-3">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <Skeleton className="w-14 h-6 rounded-full" />
                </div>
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-3 w-12 mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="border-0 shadow-md">
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-28 mt-1" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-72 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Bottom Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-0 shadow-md">
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="space-y-1.5">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DashboardEjecutivo
