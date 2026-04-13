'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { NuevaOrden } from './nueva-orden'
import { DetalleOrden } from './detalle-orden'
import { RecepcionOrden } from './recepcion'
import { SeguimientoOrdenes } from './seguimiento'
import { 
  ShoppingCart, Plus, Search, Filter, Eye, FileText, Truck, 
  Clock, CheckCircle, AlertTriangle, XCircle, Package, Loader2,
  TrendingUp, Calendar, Building2
} from 'lucide-react'

// Types
interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Proveedor {
  id: string
  nombre: string
  cuit: string | null
  telefono: string | null
  email: string | null
  contacto: string | null
}

interface Insumo {
  id: string
  codigo: string
  nombre: string
  unidadMedida: string
  precioUnitario: number | null
  proveedorId: string | null
}

interface DetalleOrden {
  id: string
  insumoId: string
  insumo: Insumo
  cantidadPedida: number
  cantidadRecibida: number
  precioUnitario: number
  subtotal: number
}

interface Recepcion {
  id: string
  numeroRemito: string | null
  fechaRecepcion: string
  estado: string
  observaciones: string | null
}

interface OrdenCompra {
  id: string
  numero: number
  proveedorId: string | null
  proveedor: Proveedor | null
  fechaEmision: string
  fechaEntrega: string | null
  fechaRecepcion: string | null
  estado: string
  subtotal: number
  iva: number
  total: number
  observaciones: string | null
  detalles: DetalleOrden[]
  recepciones: Recepcion[]
}

type EstadoOrden = 'PENDIENTE' | 'APROBADA' | 'ENVIADA' | 'PARCIAL' | 'COMPLETADA' | 'ANULADA'

const ESTADOS_ORDEN: { value: EstadoOrden; label: string; color: string }[] = [
  { value: 'PENDIENTE', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'APROBADA', label: 'Aprobada', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'ENVIADA', label: 'Enviada', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { value: 'PARCIAL', label: 'Parcial', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { value: 'COMPLETADA', label: 'Completada', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'ANULADA', label: 'Anulada', color: 'bg-red-100 text-red-800 border-red-300' },
]

export function OrdenesCompraModule({ operador }: { operador: Operador }) {
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [filtroProveedor, setFiltroProveedor] = useState<string>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [showNuevaOrden, setShowNuevaOrden] = useState(false)
  const [selectedOrden, setSelectedOrden] = useState<OrdenCompra | null>(null)
  const [showDetalle, setShowDetalle] = useState(false)
  const [showRecepcion, setShowRecepcion] = useState(false)
  const [activeTab, setActiveTab] = useState('lista')

  // Stats
  const [stats, setStats] = useState({
    pendientes: 0,
    enTransito: 0,
    completadas: 0,
    totalMonto: 0
  })

  useEffect(() => {
    fetchOrdenes()
    fetchProveedores()
  }, [])

  const fetchOrdenes = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/ordenes-compra')
      const data = await res.json()
      setOrdenes(Array.isArray(data) ? data : [])
      calcularStats(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error al obtener órdenes:', error)
      toast.error('Error al cargar las órdenes de compra')
    } finally {
      setLoading(false)
    }
  }

  const fetchProveedores = async () => {
    try {
      const res = await fetch('/api/proveedores?activos=true')
      const data = await res.json()
      setProveedores(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error al obtener proveedores:', error)
    }
  }

  const calcularStats = (ordenesList: OrdenCompra[]) => {
    const pendientes = ordenesList.filter(o => o.estado === 'PENDIENTE' || o.estado === 'APROBADA').length
    const enTransito = ordenesList.filter(o => o.estado === 'ENVIADA' || o.estado === 'PARCIAL').length
    const completadas = ordenesList.filter(o => o.estado === 'COMPLETADA').length
    const totalMonto = ordenesList
      .filter(o => o.estado !== 'ANULADA')
      .reduce((acc, o) => acc + (o.total || 0), 0)
    
    setStats({ pendientes, enTransito, completadas, totalMonto })
  }

  // Filtrar órdenes
  const ordenesFiltradas = ordenes.filter(orden => {
    if (filtroEstado !== 'todos' && orden.estado !== filtroEstado) return false
    if (filtroProveedor !== 'todos' && orden.proveedorId !== filtroProveedor) return false
    if (busqueda && !orden.numero.toString().includes(busqueda)) return false
    return true
  })

  const getEstadoBadge = (estado: string) => {
    const estadoConfig = ESTADOS_ORDEN.find(e => e.value === estado)
    if (!estadoConfig) return <Badge variant="outline">{estado}</Badge>
    
    return (
      <Badge className={`${estadoConfig.color} border`}>
        {estadoConfig.label}
      </Badge>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(value || 0)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const handleOrdenCreada = () => {
    setShowNuevaOrden(false)
    fetchOrdenes()
    toast.success('Orden de compra creada exitosamente')
  }

  const handleVerDetalle = (orden: OrdenCompra) => {
    setSelectedOrden(orden)
    setShowDetalle(true)
  }

  const handleRegistrarRecepcion = (orden: OrdenCompra) => {
    setSelectedOrden(orden)
    setShowRecepcion(true)
  }

  const handleRecepcionCompletada = () => {
    setShowRecepcion(false)
    setSelectedOrden(null)
    fetchOrdenes()
    toast.success('Recepción registrada exitosamente')
  }

  const handleAnularOrden = async (orden: OrdenCompra) => {
    if (!confirm('¿Está seguro de anular esta orden de compra?')) return
    
    try {
      const res = await fetch('/api/ordenes-compra', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orden.id,
          estado: 'ANULADA',
          operadorId: operador.id
        })
      })
      
      if (res.ok) {
        toast.success('Orden anulada exitosamente')
        fetchOrdenes()
      } else {
        toast.error('Error al anular la orden')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al anular la orden')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <ShoppingCart className="w-8 h-8 text-amber-600" />
              Órdenes de Compra
            </h1>
            <p className="text-stone-500 mt-1">Gestión de pedidos a proveedores</p>
          </div>
          <Button 
            onClick={() => setShowNuevaOrden(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Orden de Compra
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-500 p-2 rounded-lg">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Pendientes</p>
                  <p className="text-xl font-bold">{stats.pendientes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500 p-2 rounded-lg">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">En Tránsito</p>
                  <p className="text-xl font-bold">{stats.enTransito}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-500 p-2 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Completadas</p>
                  <p className="text-xl font-bold">{stats.completadas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500 p-2 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Monto Total</p>
                  <p className="text-lg font-bold">{formatCurrency(stats.totalMonto)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap w-full gap-1 h-auto bg-stone-100">
            <TabsTrigger value="lista" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-3">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Lista de Órdenes</span>
              <span className="sm:hidden">Lista</span>
            </TabsTrigger>
            <TabsTrigger value="seguimiento" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-3">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Seguimiento</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lista" className="space-y-4">
            {/* Filtros */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-stone-500">Buscar por número</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <Input
                        placeholder="Ej: 123"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs text-stone-500">Estado</Label>
                    <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los estados</SelectItem>
                        {ESTADOS_ORDEN.map(estado => (
                          <SelectItem key={estado.value} value={estado.value}>
                            {estado.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs text-stone-500">Proveedor</Label>
                    <Select value={filtroProveedor} onValueChange={setFiltroProveedor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los proveedores" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los proveedores</SelectItem>
                        {proveedores.map(prov => (
                          <SelectItem key={prov.id} value={prov.id}>
                            {prov.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setFiltroEstado('todos')
                        setFiltroProveedor('todos')
                        setBusqueda('')
                      }}
                      className="w-full"
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Limpiar filtros
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de órdenes */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
                    <p className="mt-2 text-stone-500">Cargando órdenes...</p>
                  </div>
                ) : ordenesFiltradas.length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No se encontraron órdenes de compra</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-stone-50 border-b">
                        <tr>
                          <th className="text-left p-4 text-sm font-medium text-stone-600">N° Orden</th>
                          <th className="text-left p-4 text-sm font-medium text-stone-600">Proveedor</th>
                          <th className="text-left p-4 text-sm font-medium text-stone-600 hidden md:table-cell">Fecha Emisión</th>
                          <th className="text-left p-4 text-sm font-medium text-stone-600 hidden lg:table-cell">Fecha Entrega</th>
                          <th className="text-left p-4 text-sm font-medium text-stone-600">Estado</th>
                          <th className="text-right p-4 text-sm font-medium text-stone-600">Total</th>
                          <th className="text-center p-4 text-sm font-medium text-stone-600">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {ordenesFiltradas.map((orden) => (
                          <tr key={orden.id} className="hover:bg-stone-50 transition-colors">
                            <td className="p-4">
                              <span className="font-mono font-bold text-stone-800">
                                #{orden.numero.toString().padStart(6, '0')}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-stone-400" />
                                <span>{orden.proveedor?.nombre || 'Sin proveedor'}</span>
                              </div>
                            </td>
                            <td className="p-4 hidden md:table-cell">
                              <div className="flex items-center gap-2 text-stone-600">
                                <Calendar className="w-4 h-4" />
                                {formatDate(orden.fechaEmision)}
                              </div>
                            </td>
                            <td className="p-4 hidden lg:table-cell text-stone-600">
                              {formatDate(orden.fechaEntrega)}
                            </td>
                            <td className="p-4">
                              {getEstadoBadge(orden.estado)}
                            </td>
                            <td className="p-4 text-right font-semibold">
                              {formatCurrency(orden.total)}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleVerDetalle(orden)}
                                  title="Ver detalle"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {(orden.estado === 'ENVIADA' || orden.estado === 'PARCIAL' || orden.estado === 'APROBADA') && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRegistrarRecepcion(orden)}
                                    title="Registrar recepción"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    <Package className="w-4 h-4" />
                                  </Button>
                                )}
                                {orden.estado === 'PENDIENTE' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleAnularOrden(orden)}
                                    title="Anular orden"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seguimiento">
            <SeguimientoOrdenes ordenes={ordenes} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog Nueva Orden */}
      <Dialog open={showNuevaOrden} onOpenChange={setShowNuevaOrden}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Nueva Orden de Compra
            </DialogTitle>
          </DialogHeader>
          <NuevaOrden
            operador={operador}
            proveedores={proveedores}
            onGuardar={handleOrdenCreada}
            onCancelar={() => setShowNuevaOrden(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog Detalle Orden */}
      <Dialog open={showDetalle} onOpenChange={setShowDetalle}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detalle de Orden #{selectedOrden?.numero.toString().padStart(6, '0')}
            </DialogTitle>
          </DialogHeader>
          {selectedOrden && (
            <DetalleOrden
              orden={selectedOrden}
              operador={operador}
              onCerrar={() => setShowDetalle(false)}
              onActualizar={fetchOrdenes}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Recepción */}
      <Dialog open={showRecepcion} onOpenChange={setShowRecepcion}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Registrar Recepción - Orden #{selectedOrden?.numero.toString().padStart(6, '0')}
            </DialogTitle>
          </DialogHeader>
          {selectedOrden && (
            <RecepcionOrden
              orden={selectedOrden}
              operador={operador}
              onCompletar={handleRecepcionCompletada}
              onCancelar={() => setShowRecepcion(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default OrdenesCompraModule
