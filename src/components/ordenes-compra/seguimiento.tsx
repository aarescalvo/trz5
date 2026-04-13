'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Clock, Truck, CheckCircle, AlertTriangle, XCircle, 
  Package, TrendingUp, Calendar, Building2, Timer
} from 'lucide-react'

// Types
interface Proveedor {
  id: string
  nombre: string
}

interface Insumo {
  id: string
  codigo: string
  nombre: string
}

interface DetalleOrden {
  id: string
  insumoId: string
  insumo: Insumo
  cantidadPedida: number
  cantidadRecibida: number
}

interface Recepcion {
  id: string
  numeroRemito: string | null
  fechaRecepcion: string
  estado: string
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
  total: number
  detalles: DetalleOrden[]
  recepciones: Recepcion[]
}

interface SeguimientoOrdenesProps {
  ordenes: OrdenCompra[]
}

const ESTADOS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
  APROBADA: { label: 'Aprobada', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: CheckCircle },
  ENVIADA: { label: 'Enviada', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Truck },
  PARCIAL: { label: 'Parcial', color: 'bg-orange-100 text-orange-800 border-orange-300', icon: AlertTriangle },
  COMPLETADA: { label: 'Completada', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
  ANULADA: { label: 'Anulada', color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
}

export function SeguimientoOrdenes({ ordenes }: SeguimientoOrdenesProps) {
  // Calcular métricas
  const metricas = useMemo(() => {
    const ordenesActivas = ordenes.filter(o => o.estado !== 'ANULADA')
    
    // Órdenes atrasadas (fecha de entrega pasada y no completada)
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    
    const ordenesAtrasadas = ordenesActivas.filter(o => {
      if (!o.fechaEntrega || o.estado === 'COMPLETADA') return false
      const fechaEntrega = new Date(o.fechaEntrega)
      return fechaEntrega < hoy
    })

    // Tiempo promedio de entrega (para órdenes completadas)
    const ordenesCompletadas = ordenesActivas.filter(o => o.estado === 'COMPLETADA' && o.fechaRecepcion)
    let tiempoPromedioEntrega = 0
    if (ordenesCompletadas.length > 0) {
      const diasTotales = ordenesCompletadas.reduce((acc, o) => {
        const emision = new Date(o.fechaEmision)
        const recepcion = new Date(o.fechaRecepcion!)
        const dias = Math.ceil((recepcion.getTime() - emision.getTime()) / (1000 * 60 * 60 * 24))
        return acc + dias
      }, 0)
      tiempoPromedioEntrega = diasTotales / ordenesCompletadas.length
    }

    // Cumplimiento por proveedor
    const proveedoresStats: Record<string, { nombre: string; total: number; completadas: number; atrasadas: number }> = {}
    ordenesActivas.forEach(o => {
      const provId = o.proveedorId || 'sin-proveedor'
      const provNombre = o.proveedor?.nombre || 'Sin proveedor'
      
      if (!proveedoresStats[provId]) {
        proveedoresStats[provId] = { nombre: provNombre, total: 0, completadas: 0, atrasadas: 0 }
      }
      
      proveedoresStats[provId].total++
      if (o.estado === 'COMPLETADA') {
        proveedoresStats[provId].completadas++
      }
      if (ordenesAtrasadas.includes(o)) {
        proveedoresStats[provId].atrasadas++
      }
    })

    return {
      totalOrdenes: ordenesActivas.length,
      ordenesAtrasadas: ordenesAtrasadas.length,
      tiempoPromedioEntrega,
      proveedoresStats: Object.values(proveedoresStats).sort((a, b) => b.total - a.total)
    }
  }, [ordenes])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit'
    })
  }

  // Órdenes que requieren atención
  const ordenesAtencion = useMemo(() => {
    return ordenes.filter(o => {
      if (o.estado === 'ANULADA' || o.estado === 'COMPLETADA') return false
      
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      
      // Atrasadas
      if (o.fechaEntrega) {
        const fechaEntrega = new Date(o.fechaEntrega)
        if (fechaEntrega < hoy) return true
      }
      
      // Parciales
      if (o.estado === 'PARCIAL') return true
      
      return false
    }).sort((a, b) => {
      // Ordenar por fecha de entrega más próxima primero
      if (!a.fechaEntrega) return 1
      if (!b.fechaEntrega) return -1
      return new Date(a.fechaEntrega).getTime() - new Date(b.fechaEntrega).getTime()
    })
  }, [ordenes])

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Total Activas</p>
                <p className="text-xl font-bold">{metricas.totalOrdenes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-500 p-2 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Atrasadas</p>
                <p className="text-xl font-bold text-red-600">{metricas.ordenesAtrasadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 p-2 rounded-lg">
                <Timer className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Tiempo Promedio</p>
                <p className="text-xl font-bold">{metricas.tiempoPromedioEntrega.toFixed(1)} días</p>
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
                <p className="text-xs text-stone-500">Proveedores</p>
                <p className="text-xl font-bold">{metricas.proveedoresStats.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Órdenes que requieren atención */}
      {ordenesAtencion.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Órdenes que Requieren Atención
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-red-100 max-h-80 overflow-y-auto">
              {ordenesAtencion.map(orden => {
                const estadoConfig = ESTADOS_CONFIG[orden.estado] || ESTADOS_CONFIG.PENDIENTE
                const hoy = new Date()
                hoy.setHours(0, 0, 0, 0)
                const fechaEntrega = orden.fechaEntrega ? new Date(orden.fechaEntrega) : null
                const diasAtraso = fechaEntrega 
                  ? Math.ceil((hoy.getTime() - fechaEntrega.getTime()) / (1000 * 60 * 60 * 24))
                  : 0
                
                return (
                  <div key={orden.id} className="p-4 hover:bg-red-100 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold">#{orden.numero.toString().padStart(6, '0')}</span>
                          <Badge className={`${estadoConfig.color} border`}>
                            {estadoConfig.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-stone-600 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {orden.proveedor?.nombre || 'Sin proveedor'}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-stone-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Entrega: {formatDate(orden.fechaEntrega)}
                          </span>
                          <span>{formatCurrency(orden.total)}</span>
                        </div>
                      </div>
                      {diasAtraso > 0 && (
                        <div className="text-right">
                          <p className="text-red-600 font-bold">{diasAtraso} días</p>
                          <p className="text-xs text-red-500">de atraso</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cumplimiento por proveedor */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-600" />
            Cumplimiento por Proveedor
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {metricas.proveedoresStats.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay datos de proveedores</p>
            </div>
          ) : (
            <div className="divide-y max-h-96 overflow-y-auto">
              {metricas.proveedoresStats.map((prov, index) => {
                const porcentajeCumplimiento = prov.total > 0 
                  ? (prov.completadas / prov.total) * 100 
                  : 0
                
                return (
                  <div key={index} className="p-4 hover:bg-stone-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{prov.nombre}</p>
                        <p className="text-sm text-stone-500">
                          {prov.total} orden{prov.total !== 1 ? 'es' : ''} 
                          {prov.atrasadas > 0 && (
                            <span className="text-red-600 ml-2">
                              ({prov.atrasadas} atrasada{prov.atrasadas !== 1 ? 's' : ''})
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-amber-600">
                          {porcentajeCumplimiento.toFixed(0)}%
                        </p>
                        <p className="text-xs text-stone-500">cumplimiento</p>
                      </div>
                    </div>
                    <Progress 
                      value={porcentajeCumplimiento} 
                      className="h-2"
                    />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline de órdenes recientes */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            Actividad Reciente
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {ordenes.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay actividad reciente</p>
            </div>
          ) : (
            <div className="divide-y max-h-96 overflow-y-auto">
              {ordenes.slice(0, 10).map(orden => {
                const estadoConfig = ESTADOS_CONFIG[orden.estado] || ESTADOS_CONFIG.PENDIENTE
                const EstadoIcon = estadoConfig.icon
                
                // Calcular progreso
                const totalPedida = orden.detalles.reduce((acc, d) => acc + d.cantidadPedida, 0)
                const totalRecibida = orden.detalles.reduce((acc, d) => acc + d.cantidadRecibida, 0)
                const progreso = totalPedida > 0 ? (totalRecibida / totalPedida) * 100 : 0
                
                return (
                  <div key={orden.id} className="p-4 hover:bg-stone-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${estadoConfig.color}`}>
                        <EstadoIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm">
                            #{orden.numero.toString().padStart(6, '0')}
                          </span>
                          <Badge className={`${estadoConfig.color} border text-xs`}>
                            {estadoConfig.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-stone-600 truncate">
                          {orden.proveedor?.nombre || 'Sin proveedor'}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex-1">
                            <Progress value={progreso} className="h-1.5" />
                          </div>
                          <span className="text-xs text-stone-500">
                            {progreso.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-medium">{formatCurrency(orden.total)}</p>
                        <p className="text-xs text-stone-500">
                          {formatDate(orden.fechaEmision)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default SeguimientoOrdenes
