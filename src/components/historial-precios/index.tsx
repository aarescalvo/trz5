'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  History,
  Package,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Search
} from 'lucide-react'
import { toast } from 'sonner'

interface Producto {
  id: string
  codigo: string
  nombre: string
  categoria: string
  unidadMedida: string
  precioActual: number
  precioAnterior: number
  variacion: number
  variacionPorcentaje: string
  totalCambios: number
}

interface HistorialItem {
  id: string
  productoVendibleId: string
  precioAnterior: number | null
  precioNuevo: number
  moneda: string
  motivo: string | null
  fechaVigencia: string
  createdAt: string
  productoVendible: {
    id: string
    codigo: string
    nombre: string
    categoria: string
    unidadMedida: string
  }
}

interface Resumen {
  totalProductos: number
  productosConCambios: number
  productosSinCambios: number
  variacionPromedio: string
}

const CATEGORIAS_LABELS: Record<string, string> = {
  'PRODUCTO_CARNICO': 'Producto Cárnico',
  'MENUDENCIA': 'Menudencia',
  'SERVICIO_FAENA': 'Servicio Faena',
  'SERVICIO_ALMACENAMIENTO': 'Almacenamiento',
  'SERVICIO_PROCESO': 'Proceso',
  'TRANSPORTE': 'Transporte',
  'SUBPRODUCTO': 'Subproducto',
  'OTRO': 'Otro'
}

export function HistorialPreciosModule() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [historial, setHistorial] = useState<HistorialItem[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [modalHistorial, setModalHistorial] = useState(false)
  const [modalNuevoPrecio, setModalNuevoPrecio] = useState(false)
  const [nuevoPrecio, setNuevoPrecio] = useState('')
  const [motivoCambio, setMotivoCambio] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [historialProducto, setHistorialProducto] = useState<HistorialItem[]>([])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/historial-precios')
      const result = await res.json()
      
      if (result.success) {
        setProductos(result.productos || [])
        setHistorial(result.data || [])
        setResumen(result.resumen)
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const verHistorialProducto = async (producto: Producto) => {
    setProductoSeleccionado(producto)
    try {
      const res = await fetch(`/api/historial-precios?productoId=${producto.id}`)
      const result = await res.json()
      if (result.success) {
        setHistorialProducto(result.data)
      }
    } catch (error) {
      console.error('Error al cargar historial:', error)
    }
    setModalHistorial(true)
  }

  const abrirNuevoPrecio = (producto: Producto) => {
    setProductoSeleccionado(producto)
    setNuevoPrecio(producto.precioActual.toString())
    setMotivoCambio('')
    setModalNuevoPrecio(true)
  }

  const guardarNuevoPrecio = async () => {
    if (!productoSeleccionado || !nuevoPrecio) return
    
    const precio = parseFloat(nuevoPrecio)
    if (isNaN(precio) || precio < 0) {
      toast.error('Ingrese un precio válido')
      return
    }

    setGuardando(true)
    try {
      const res = await fetch('/api/historial-precios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productoVendibleId: productoSeleccionado.id,
          precioNuevo: precio,
          motivo: motivoCambio || 'Actualización de precio'
        })
      })

      const result = await res.json()
      if (result.success) {
        toast.success(result.message)
        setModalNuevoPrecio(false)
        cargarDatos()
      } else {
        toast.error(result.error || 'Error al actualizar precio')
      }
    } catch (error) {
      toast.error('Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const productosFiltrados = productos.filter(p => {
    const matchBusqueda = !busqueda || 
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo.toLowerCase().includes(busqueda.toLowerCase())
    const matchCategoria = !filtroCategoria || p.categoria === filtroCategoria
    return matchBusqueda && matchCategoria
  })

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(monto)
  }

  const getVariacionIcon = (porcentaje: string) => {
    const valor = parseFloat(porcentaje)
    if (valor > 0) return <ArrowUpRight className="h-4 w-4 text-red-500" />
    if (valor < 0) return <ArrowDownRight className="h-4 w-4 text-green-500" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const getVariacionColor = (porcentaje: string) => {
    const valor = parseFloat(porcentaje)
    if (valor > 0) return 'text-red-600 bg-red-50'
    if (valor < 0) return 'text-green-600 bg-green-50'
    return 'text-gray-600 bg-gray-50'
  }

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Historial de Precios</h2>
          <p className="text-muted-foreground">Seguimiento de cambios de precios en servicios y productos</p>
        </div>
        <Button variant="outline" size="sm" onClick={cargarDatos}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Resumen */}
      {resumen && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Productos</p>
                  <p className="text-2xl font-bold">{resumen.totalProductos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <History className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-blue-600">Con Cambios</p>
                  <p className="text-2xl font-bold text-blue-700">{resumen.productosConCambios}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Sin Cambios</p>
                  <p className="text-2xl font-bold">{resumen.productosSinCambios}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={parseFloat(resumen.variacionPromedio) >= 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {parseFloat(resumen.variacionPromedio) >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-red-500" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-green-500" />
                )}
                <div>
                  <p className="text-sm text-gray-600">Variación Promedio</p>
                  <p className={`text-2xl font-bold ${parseFloat(resumen.variacionPromedio) >= 0 ? 'text-red-700' : 'text-green-700'}`}>
                    {parseFloat(resumen.variacionPromedio) >= 0 ? '+' : ''}{resumen.variacionPromedio}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre o código..."
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="">Todas las categorías</option>
              {Object.entries(CATEGORIAS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de productos */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card className="flex-1 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[calc(100vh-400px)]">
              <table className="w-full">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Código</th>
                    <th className="text-left p-3 font-medium">Producto</th>
                    <th className="text-left p-3 font-medium">Categoría</th>
                    <th className="text-right p-3 font-medium">Precio Actual</th>
                    <th className="text-right p-3 font-medium">Anterior</th>
                    <th className="text-center p-3 font-medium">Variación</th>
                    <th className="text-center p-3 font-medium">Cambios</th>
                    <th className="text-center p-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center p-8 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No se encontraron productos</p>
                      </td>
                    </tr>
                  ) : (
                    productosFiltrados.map((producto) => (
                      <tr key={producto.id} className="border-t hover:bg-muted/50">
                        <td className="p-3 font-mono text-sm">{producto.codigo}</td>
                        <td className="p-3">
                          <p className="font-medium">{producto.nombre}</p>
                          <p className="text-xs text-muted-foreground">{producto.unidadMedida}</p>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">
                            {CATEGORIAS_LABELS[producto.categoria] || producto.categoria}
                          </Badge>
                        </td>
                        <td className="p-3 text-right font-bold">
                          {formatMonto(producto.precioActual)}
                        </td>
                        <td className="p-3 text-right text-muted-foreground">
                          {producto.precioAnterior ? formatMonto(producto.precioAnterior) : '-'}
                        </td>
                        <td className="p-3 text-center">
                          <Badge className={getVariacionColor(producto.variacionPorcentaje)}>
                            <span className="flex items-center gap-1">
                              {getVariacionIcon(producto.variacionPorcentaje)}
                              {parseFloat(producto.variacionPorcentaje) >= 0 ? '+' : ''}{producto.variacionPorcentaje}%
                            </span>
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="secondary">{producto.totalCambios}</Badge>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => verHistorialProducto(producto)}
                              title="Ver historial"
                            >
                              <History className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => abrirNuevoPrecio(producto)}
                              title="Actualizar precio"
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Historial */}
      <Dialog open={modalHistorial} onOpenChange={setModalHistorial}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historial de {productoSeleccionado?.nombre}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {historialProducto.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay historial de cambios
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2 text-sm">Fecha</th>
                    <th className="text-right p-2 text-sm">Anterior</th>
                    <th className="text-right p-2 text-sm">Nuevo</th>
                    <th className="text-right p-2 text-sm">Variación</th>
                    <th className="text-left p-2 text-sm">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {historialProducto.map((item, idx) => {
                    const anterior = item.precioAnterior || 0
                    const nuevo = item.precioNuevo
                    const variacion = anterior > 0 ? ((nuevo - anterior) / anterior * 100).toFixed(2) : '0.00'
                    
                    return (
                      <tr key={item.id} className="border-t">
                        <td className="p-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatFecha(item.fechaVigencia)}
                          </div>
                        </td>
                        <td className="p-2 text-right text-sm text-muted-foreground">
                          {anterior ? formatMonto(anterior) : '-'}
                        </td>
                        <td className="p-2 text-right text-sm font-bold">
                          {formatMonto(nuevo)}
                        </td>
                        <td className="p-2 text-right">
                          <Badge className={getVariacionColor(variacion)}>
                            {parseFloat(variacion) >= 0 ? '+' : ''}{variacion}%
                          </Badge>
                        </td>
                        <td className="p-2 text-sm text-muted-foreground">
                          {item.motivo || '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Nuevo Precio */}
      <Dialog open={modalNuevoPrecio} onOpenChange={setModalNuevoPrecio}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar Precio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Producto</Label>
              <p className="font-medium">{productoSeleccionado?.nombre}</p>
              <p className="text-sm text-muted-foreground">Código: {productoSeleccionado?.codigo}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Precio Actual</Label>
                <p className="text-lg font-bold">{formatMonto(productoSeleccionado?.precioActual || 0)}</p>
              </div>
              <div>
                <Label>Nuevo Precio</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={nuevoPrecio}
                  onChange={(e) => setNuevoPrecio(e.target.value)}
                />
              </div>
            </div>
            {nuevoPrecio && productoSeleccionado && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  Variación: {' '}
                  <span className={getVariacionColor(
                    ((parseFloat(nuevoPrecio) - productoSeleccionado.precioActual) / productoSeleccionado.precioActual * 100).toFixed(2)
                  )}>
                    {((parseFloat(nuevoPrecio) - productoSeleccionado.precioActual) / productoSeleccionado.precioActual * 100).toFixed(2)}%
                  </span>
                </p>
              </div>
            )}
            <div>
              <Label>Motivo del cambio</Label>
              <Textarea
                value={motivoCambio}
                onChange={(e) => setMotivoCambio(e.target.value)}
                placeholder="Ej: Ajuste mensual, Aumento de costo, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalNuevoPrecio(false)}>
              Cancelar
            </Button>
            <Button onClick={guardarNuevoPrecio} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
