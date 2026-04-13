'use client'

import { CheckCircle, XCircle, Clock, User, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const ESTADOS_LABELS: Record<string, string> = {
  INICIADO: 'Iniciado',
  VERIFICACION: 'En Verificación',
  PENDIENTE_VISTO_BUENO: 'Pendiente Supervisor',
  CONFIRMADO: 'Confirmado',
  DATOS_SUBIDOS: 'Datos Subidos',
  REPORTES_EMITIDOS: 'Reportes Emitidos',
  ROMANEOS_ENVIADOS: 'Romaneos Enviados',
  COMPLETADO: 'Completado',
  ANULADO: 'Anulado'
}

interface HistorialEntry {
  fecha: string
  estadoAnterior?: string
  estadoNuevo: string
  observaciones?: string
  operador?: { nombre: string }
}

interface FlujoFaenaTimelineProps {
  historial: HistorialEntry[]
}

export function FlujoFaenaTimeline({ historial }: FlujoFaenaTimelineProps) {
  if (!historial || historial.length === 0) {
    return (
      <div className="text-center py-8 text-stone-400">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No hay historial disponible</p>
      </div>
    )
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      INICIADO: 'bg-slate-100 text-slate-700 border-slate-200',
      VERIFICACION: 'bg-amber-100 text-amber-700 border-amber-200',
      PENDIENTE_VISTO_BUENO: 'bg-orange-100 text-orange-700 border-orange-200',
      CONFIRMADO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      DATOS_SUBIDOS: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      REPORTES_EMITIDOS: 'bg-teal-100 text-teal-700 border-teal-200',
      ROMANEOS_ENVIADOS: 'bg-blue-100 text-blue-700 border-blue-200',
      COMPLETADO: 'bg-green-100 text-green-700 border-green-200',
      ANULADO: 'bg-red-100 text-red-700 border-red-200'
    }
    return colors[estado] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const getIcon = (estado: string) => {
    if (estado === 'ANULADO') return <XCircle className="w-4 h-4" />
    if (estado === 'COMPLETADO') return <CheckCircle className="w-4 h-4" />
    return <CheckCircle className="w-4 h-4" />
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-300 via-orange-300 to-green-300" />
      
      {/* Timeline items */}
      <div className="space-y-6">
        {historial.map((entry, index) => (
          <div key={index} className="relative pl-10">
            {/* Timeline dot */}
            <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${getEstadoColor(entry.estadoNuevo)} border-2`}>
              {getIcon(entry.estadoNuevo)}
            </div>
            
            {/* Content */}
            <div className="bg-stone-50 rounded-lg p-4 border border-stone-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {entry.estadoAnterior && (
                      <>
                        <Badge variant="outline" className="text-xs">
                          {ESTADOS_LABELS[entry.estadoAnterior] || entry.estadoAnterior}
                        </Badge>
                        <ArrowRight className="w-3 h-3 text-stone-400" />
                      </>
                    )}
                    <Badge className={`${getEstadoColor(entry.estadoNuevo)} text-xs`}>
                      {ESTADOS_LABELS[entry.estadoNuevo] || entry.estadoNuevo}
                    </Badge>
                  </div>
                  
                  {entry.observaciones && (
                    <p className="text-sm text-stone-600 mt-2">
                      {entry.observaciones}
                    </p>
                  )}
                </div>
                
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-xs text-stone-400">
                    <User className="w-3 h-3" />
                    {entry.operador?.nombre || 'Sistema'}
                  </div>
                  <div className="text-xs text-stone-400 mt-1">
                    {formatDate(entry.fecha)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FlujoFaenaTimeline
