'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  AlertTriangle, Package, FileText, DollarSign, ShoppingCart, 
  AlertCircle, Clock, ChevronRight, XCircle, AlertOctagon
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Alerta {
  id: string
  tipo: 'stock_bajo' | 'cheque_vencer' | 'arqueo_pendiente' | 'factura_vencida' | 'orden_atrasada'
  titulo: string
  descripcion: string
  prioridad: 'alta' | 'media' | 'baja'
  fecha?: string
  monto?: number
  detalle?: string
}

interface AlertasPanelProps {
  alertas: Alerta[]
  loading?: boolean
  onAlertClick?: (alerta: Alerta) => void
}

const tipoConfig = {
  stock_bajo: {
    icon: Package,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700'
  },
  cheque_vencer: {
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700'
  },
  arqueo_pendiente: {
    icon: FileText,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700'
  },
  factura_vencida: {
    icon: DollarSign,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700'
  },
  orden_atrasada: {
    icon: ShoppingCart,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700'
  }
}

const prioridadConfig = {
  alta: { label: 'Urgente', color: 'bg-red-500' },
  media: { label: 'Importante', color: 'bg-amber-500' },
  baja: { label: 'Normal', color: 'bg-stone-400' }
}

export function AlertasPanel({ alertas, loading, onAlertClick }: AlertasPanelProps) {
  if (loading) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Alertas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex gap-3 mb-3 p-3 bg-stone-100 rounded-lg">
              <div className="w-8 h-8 bg-stone-200 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-stone-200 rounded w-1/2" />
                <div className="h-2 bg-stone-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const alertasPorTipo = alertas.reduce((acc, alerta) => {
    if (!acc[alerta.tipo]) acc[alerta.tipo] = []
    acc[alerta.tipo].push(alerta)
    return acc
  }, {} as Record<string, Alerta[]>)

  const alertasPorPrioridad = {
    alta: alertas.filter(a => a.prioridad === 'alta'),
    media: alertas.filter(a => a.prioridad === 'media'),
    baja: alertas.filter(a => a.prioridad === 'baja')
  }

  const totalAlertas = alertas.length
  const alertasUrgentes = alertasPorPrioridad.alta.length

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="bg-stone-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Alertas
            {totalAlertas > 0 && (
              <Badge className="ml-2 bg-amber-100 text-amber-700">
                {totalAlertas}
              </Badge>
            )}
          </CardTitle>
          {alertasUrgentes > 0 && (
            <Badge className="bg-red-100 text-red-700 animate-pulse">
              <AlertOctagon className="w-3 h-3 mr-1" />
              {alertasUrgentes} urgente{alertasUrgentes > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {alertas.length === 0 ? (
          <div className="p-8 text-center text-stone-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Sin alertas</p>
            <p className="text-sm">Todo está en orden</p>
          </div>
        ) : (
          <ScrollArea className="h-80">
            <div className="p-4 space-y-2">
              {alertas.map((alerta) => {
                const config = tipoConfig[alerta.tipo]
                const Icon = config.icon
                
                return (
                  <div
                    key={alerta.id}
                    onClick={() => onAlertClick?.(alerta)}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm',
                      config.bg,
                      config.border
                    )}
                  >
                    <div className={cn('p-2 rounded-lg bg-white', config.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm text-stone-800 truncate">
                          {alerta.titulo}
                        </p>
                        <Badge className={cn('text-xs', prioridadConfig[alerta.prioridad].color, 'text-white')}>
                          {prioridadConfig[alerta.prioridad].label}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-stone-600 mb-1">
                        {alerta.descripcion}
                      </p>
                      
                      <div className="flex items-center gap-3 text-xs text-stone-400">
                        {alerta.fecha && (
                          <span>{new Date(alerta.fecha).toLocaleDateString('es-AR')}</span>
                        )}
                        {alerta.monto && (
                          <span className="font-medium text-stone-600">
                            ${alerta.monto.toLocaleString('es-AR')}
                          </span>
                        )}
                        {alerta.detalle && (
                          <span>{alerta.detalle}</span>
                        )}
                      </div>
                    </div>
                    
                    <ChevronRight className="w-4 h-4 text-stone-400 flex-shrink-0" />
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

export default AlertasPanel
