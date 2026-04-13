'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig 
} from '@/components/ui/chart'
import { 
  Area, AreaChart, 
  Bar, BarChart, 
  Line, LineChart, 
  Pie, PieChart, 
  Cell, 
  XAxis, YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Tooltip
} from 'recharts'
import { TrendingUp, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ProduccionData {
  produccion30Dias: { fecha: string; cantidad: number; peso: number }[]
  rindePorDia: { fecha: string; rinde: number; objetivo: number }[]
  produccionMensual: { mes: string; animales: number; peso: number }[]
  distribucionEspecie: { especie: string; cantidad: number; porcentaje: number; color: string }[]
}

interface GraficosProduccionProps {
  data: ProduccionData
  loading?: boolean
}

const chartConfig = {
  cantidad: {
    label: 'Cantidad',
    color: '#f59e0b',
  },
  peso: {
    label: 'Peso (kg)',
    color: '#3b82f6',
  },
  rinde: {
    label: 'Rinde %',
    color: '#10b981',
  },
  objetivo: {
    label: 'Objetivo %',
    color: '#ef4444',
  },
  animales: {
    label: 'Animales',
    color: '#f59e0b',
  },
  bovino: {
    label: 'Bovinos',
    color: '#f59e0b',
  },
  equino: {
    label: 'Equinos',
    color: '#3b82f6',
  },
} satisfies ChartConfig

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6']

export function GraficosProduccion({ data, loading }: GraficosProduccionProps) {
  if (loading) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Gráficos de Producción</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-stone-100 animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="bg-stone-50 rounded-t-lg">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-amber-500" />
          Gráficos de Producción
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <Tabs defaultValue="area" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="area" className="text-xs py-1.5">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Área</span>
            </TabsTrigger>
            <TabsTrigger value="bar" className="text-xs py-1.5">
              <BarChart3 className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Barras</span>
            </TabsTrigger>
            <TabsTrigger value="line" className="text-xs py-1.5">
              <LineChartIcon className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Líneas</span>
            </TabsTrigger>
            <TabsTrigger value="pie" className="text-xs py-1.5">
              <PieChartIcon className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Torta</span>
            </TabsTrigger>
          </TabsList>

          {/* Gráfico de Área - Animales faenados últimos 30 días */}
          <TabsContent value="area">
            <div className="space-y-2">
              <p className="text-sm text-stone-500">Animales faenados - Últimos 30 días</p>
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <AreaChart data={data.produccion30Dias} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-stone-200" />
                  <XAxis 
                    dataKey="fecha" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="cantidad" 
                    stackId="1"
                    stroke="#f59e0b" 
                    fill="#f59e0b" 
                    fillOpacity={0.6} 
                    name="Cantidad"
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </TabsContent>

          {/* Gráfico de Barras - Rinde por día */}
          <TabsContent value="bar">
            <div className="space-y-2">
              <p className="text-sm text-stone-500">Rinde promedio por día (%)</p>
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <BarChart data={data.rindePorDia} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-stone-200" />
                  <XAxis 
                    dataKey="fecha" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" domain={[40, 65]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="rinde" fill="#10b981" name="Rinde %" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="objetivo" fill="#ef4444" name="Objetivo %" radius={[4, 4, 0, 0]} opacity={0.3} />
                </BarChart>
              </ChartContainer>
            </div>
          </TabsContent>

          {/* Gráfico de Líneas - Tendencia mensual */}
          <TabsContent value="line">
            <div className="space-y-2">
              <p className="text-sm text-stone-500">Tendencia de producción mensual</p>
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <LineChart data={data.produccionMensual} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-stone-200" />
                  <XAxis dataKey="mes" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="animales" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', strokeWidth: 2 }}
                    name="Animales"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="peso" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                    name="Peso (kg)"
                  />
                </LineChart>
              </ChartContainer>
            </div>
          </TabsContent>

          {/* Gráfico de Torta - Distribución por especie */}
          <TabsContent value="pie">
            <div className="space-y-2">
              <p className="text-sm text-stone-500">Distribución por tipo de animal</p>
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <PieChart>
                  <Pie
                    data={data.distribucionEspecie}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="cantidad"
                    nameKey="especie"
                    label={({ especie, porcentaje }) => `${especie}: ${porcentaje.toFixed(1)}%`}
                    labelLine={false}
                  >
                    {data.distribucionEspecie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent nameKey="especie" />} />
                </PieChart>
              </ChartContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default GraficosProduccion
