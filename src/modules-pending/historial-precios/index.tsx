'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, Plus, Edit, 
  History, Filter, Download, Search, ArrowUpRight, ArrowDownRight,
  RefreshCw, LineChart, BarChart3, Clock
} from 'lucide-react'

// Tipos
interface PrecioHistorial {
  id: string
  tipo: 'PRODUCTO' | 'SERVICIO' | 'INSUMO' | 'CLIENTE_ESPECIAL'
  entidadId: string
  entidadNombre: string
  precioAnterior: number
  precioNuevo: number
  variacionPorcentaje: number
  moneda: string
  fecha: string
  operadorId?: string
  operador?: { nombre: string }
  observaciones?: string
}

interface PrecioActual {
  entidadId: string
  entidadNombre: string
  tipo: string
  precioActual: number
  precioAnterior?: number
  ultimaActualizacion: string
  variacion?: number
  tendencia: 'SUBIENDO' | 'BAJANDO' | 'ESTABLE'
}

interface Props {
  operador?: {
    id: string
    nombre: string
    rol: string
  }
}

// Monedas disponibles
const MONEDAS = [
  { id: 'ARS', nombre: 'Pesos Argentinos', simbolo: '$' },
  { id: 'USD', nombre: 'Dólares', simbolo: 'U$S' },
]

// Tipos de entidades con precio
const TIPOS_ENTIDAD = [
  { id: 'PRODUCTO', nombre: 'Productos' },
  { id: 'SERVICIO', nombre: 'Servicios' },
  { id: 'INSUMO', nombre: 'Insumos' },
  { id: 'CLIENTE_ESPECIAL', nombre: 'Precios Especiales (Cliente)' },
]

export function HistorialPreciosModule({ operador }: Props) {
  const [historial, setHistorial] = useState<PrecioHistorial[]>([])
  const [preciosActuales, setPreciosActuales] = useState<PrecioActual[]>([])
  const [loading, setLoading] = useState(true)
  const [tabActivo, setTabActivo] = useState<'historial' | 'actuales' | 'actualizar'>('actuales')
  
  // Filtros
  const [filtros, setFiltros] = useState({
    tipo: '',
    entidad: '',
    fechaDesde: '',
    fechaHasta: '',
    busqueda: ''
  })

  // Formulario de actualización
  const [nuevoPrecio, setNuevoPrecio] = useState({
    tipo: 'PRODUCTO',
    entidadId: '',
    precio: 0,
    moneda: 'ARS',
    observaciones: ''
  })

  useEffect(() => {
    fetchDatos()
  }, [filtros])

  const fetchDatos = async () => {
    setLoading(true)
    try {
      // Fetch historial
      const paramsHistorial = new URLSearchParams()
      if (filtros.tipo) paramsHistorial.append('tipo', filtros.tipo)
      if (filtros.fechaDesde) paramsHistorial.append('fechaDesde', filtros.fechaDesde)
      if (filtros.fechaHasta) paramsHistorial.append('fechaHasta', filtros.fechaHasta)
      if (filtros.busqueda) paramsHistorial.append('busqueda', filtros.busqueda)

      const resHistorial = await fetch(`/api/historial-precios?${paramsHistorial}`)
      const dataHistorial = await resHistorial.json()
      if (dataHistorial.success) {
        setHistorial(dataHistorial.data)
      }

      // Fetch precios actuales
      const resActuales = await fetch('/api/historial-precios/actuales')
      const dataActuales = await resActuales.json()
      if (dataActuales.success) {
        setPreciosActuales(dataActuales.data)
      }
    } catch (error) {
      console.error('Error fetching datos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Actualizar precio
  const handleActualizarPrecio = async () => {
    if (!nuevoPrecio.entidadId || nuevoPrecio.precio <= 0) {
      toast.error('Complete todos los campos')
      return
    }

    try {
      const res = await fetch('/api/historial-precios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nuevoPrecio,
          operadorId: operador?.id
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Precio actualizado correctamente')
        fetchDatos()
        setNuevoPrecio({
          tipo: 'PRODUCTO',
          entidadId: '',
          precio: 0,
          moneda: 'ARS',
          observaciones: ''
        })
      } else {
        toast.error(data.error || 'Error al actualizar precio')
      }
    } catch (error) {
      toast.error('Error de conexión')
    }
  }

  // Exportar
  const handleExportar = async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
      params.append('formato', 'csv')

      const res = await fetch(`/api/historial-precios/exportar?${params}`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `historial_precios_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      toast.success('Exportado correctamente')
    } catch (error) {
      toast.error('Error al exportar')
    }
  }

  // Formatear moneda
  const formatearMoneda = (valor: number, moneda: string = 'ARS') => {
    const simbolo = MONEDAS.find(m => m.id === moneda)?.simbolo || '$'
    return `${simbolo} ${valor.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
  }

  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Panel de precios actuales
  const PanelPreciosActuales = () => (
    <Card className="border-0 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Precios Actuales
        </CardTitle>
        <Button variant="outline" size="sm" onClick={fetchDatos}>
          <RefreshCw className="w-4 h-4 mr-1" /> Actualizar
        </Button>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <Select 
            value={filtros.tipo} 
            onValueChange={(v) => setFiltros(prev => ({ ...prev, tipo: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {TIPOS_ENTIDAD.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative col-span-2 md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              className="pl-10"
              placeholder="Buscar..."
              value={filtros.busqueda}
              onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
            />
          </div>
        </div>

        {/* Tabla de precios */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-stone-50">
                <TableHead>Entidad</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Precio Actual</TableHead>
                <TableHead className="text-right">Anterior</TableHead>
                <TableHead className="text-right">Variación</TableHead>
                <TableHead>Actualización</TableHead>
                <TableHead>Tendencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preciosActuales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-stone-400">
                    No hay precios registrados
                  </TableCell>
                </TableRow>
              ) : (
                preciosActuales.map(precio => (
                  <TableRow key={precio.entidadId} className="hover:bg-stone-50">
                    <TableCell className="font-medium">{precio.entidadNombre}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{precio.tipo}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatearMoneda(precio.precioActual)}
                    </TableCell>
                    <TableCell className="text-right text-stone-500">
                      {precio.precioAnterior ? formatearMoneda(precio.precioAnterior) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {precio.variacion !== undefined && (
                        <span className={`flex items-center justify-end gap-1 ${
                          precio.variacion > 0 ? 'text-green-600' : 
                          precio.variacion < 0 ? 'text-red-600' : 'text-stone-500'
                        }`}>
                          {precio.variacion > 0 ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : precio.variacion < 0 ? (
                            <ArrowDownRight className="w-4 h-4" />
                          ) : null}
                          {precio.variacion > 0 ? '+' : ''}{precio.variacion.toFixed(1)}%
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-stone-500 text-sm">
                      {formatearFecha(precio.ultimaActualizacion)}
                    </TableCell>
                    <TableCell>
                      {precio.tendencia === 'SUBIENDO' && (
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      )}
                      {precio.tendencia === 'BAJANDO' && (
                        <TrendingDown className="w-5 h-5 text-red-500" />
                      )}
                      {precio.tendencia === 'ESTABLE' && (
                        <span className="text-stone-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )

  // Panel de historial
  const PanelHistorial = () => (
    <Card className="border-0 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Historial de Cambios
        </CardTitle>
        <Button variant="outline" size="sm" onClick={handleExportar}>
          <Download className="w-4 h-4 mr-1" /> Exportar
        </Button>
      </CardHeader>
      <CardContent>
        {/* Filtros de fecha */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Input
            type="date"
            value={filtros.fechaDesde}
            onChange={(e) => setFiltros(prev => ({ ...prev, fechaDesde: e.target.value }))}
            placeholder="Desde"
          />
          <Input
            type="date"
            value={filtros.fechaHasta}
            onChange={(e) => setFiltros(prev => ({ ...prev, fechaHasta: e.target.value }))}
            placeholder="Hasta"
          />
        </div>

        {/* Lista de cambios */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {historial.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay cambios registrados</p>
            </div>
          ) : (
            historial.map(item => (
              <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className={`p-2 rounded-lg ${
                  item.variacionPorcentaje > 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {item.variacionPorcentaje > 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.entidadNombre}</p>
                  <p className="text-sm text-stone-500">
                    {formatearMoneda(item.precioAnterior, item.moneda)} → {formatearMoneda(item.precioNuevo, item.moneda)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    item.variacionPorcentaje > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {item.variacionPorcentaje > 0 ? '+' : ''}{item.variacionPorcentaje.toFixed(1)}%
                  </p>
                  <p className="text-xs text-stone-500">{formatearFecha(item.fecha)}</p>
                </div>
                <Badge variant="outline">{item.tipo}</Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )

  // Panel de actualización
  const PanelActualizar = () => (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Actualizar Precio
        </CardTitle>
        <CardDescription>
          Registre un nuevo precio para el historial
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Entidad</Label>
            <Select 
              value={nuevoPrecio.tipo}
              onValueChange={(v) => setNuevoPrecio(prev => ({ ...prev, tipo: v, entidadId: '' }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_ENTIDAD.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Entidad</Label>
            <Select 
              value={nuevoPrecio.entidadId}
              onValueChange={(v) => setNuevoPrecio(prev => ({ ...prev, entidadId: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {/* Se cargarían dinámicamente según el tipo */}
                <SelectItem value="placeholder">Seleccionar entidad...</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nuevo Precio</Label>
            <Input
              type="number"
              step="0.01"
              value={nuevoPrecio.precio || ''}
              onChange={(e) => setNuevoPrecio(prev => ({ ...prev, precio: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label>Moneda</Label>
            <Select 
              value={nuevoPrecio.moneda}
              onValueChange={(v) => setNuevoPrecio(prev => ({ ...prev, moneda: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONEDAS.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Observaciones</Label>
            <Input
              value={nuevoPrecio.observaciones}
              onChange={(e) => setNuevoPrecio(prev => ({ ...prev, observaciones: e.target.value }))}
              placeholder="Razón del cambio de precio..."
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button className="bg-amber-500 hover:bg-amber-600" onClick={handleActualizarPrecio}>
            <DollarSign className="w-4 h-4 mr-1" /> Registrar Precio
          </Button>
          <Button variant="outline" onClick={() => setNuevoPrecio({
            tipo: 'PRODUCTO',
            entidadId: '',
            precio: 0,
            moneda: 'ARS',
            observaciones: ''
          })}>
            Limpiar
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">
              Historial de Precios
            </h1>
            <p className="text-stone-500 mt-1">
              Gestión y seguimiento de precios de productos, servicios e insumos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-100 text-amber-700">
              <Clock className="w-3 h-3 mr-1" />
              {historial.length} cambios registrados
            </Badge>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={tabActivo} onValueChange={(v) => setTabActivo(v as 'historial' | 'actuales' | 'actualizar')}>
          <TabsList className="mb-6">
            <TabsTrigger value="actuales" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Precios Actuales
            </TabsTrigger>
            <TabsTrigger value="historial" className="flex items-center gap-2">
              <History className="w-4 h-4" /> Historial
            </TabsTrigger>
            <TabsTrigger value="actualizar" className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Actualizar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="actuales">
            <PanelPreciosActuales />
          </TabsContent>

          <TabsContent value="historial">
            <PanelHistorial />
          </TabsContent>

          <TabsContent value="actualizar">
            <PanelActualizar />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default HistorialPreciosModule
