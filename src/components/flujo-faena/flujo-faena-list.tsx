'use client'

import { useState, useEffect } from 'react'
import { 
  Workflow, RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle,
  Eye, FileCheck, Upload, FileText, Send, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

const ESTADOS_FLUJO = [
  { id: 'INICIADO', label: 'Iniciado', color: 'bg-slate-100 text-slate-700', icon: Clock },
  { id: 'VERIFICACION', label: 'Verificación', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  { id: 'PENDIENTE_VISTO_BUENO', label: 'Pendiente Supervisor', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
  { id: 'CONFIRMADO', label: 'Confirmado', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  { id: 'DATOS_SUBIDOS', label: 'Datos Subidos', color: 'bg-cyan-100 text-cyan-700', icon: Upload },
  { id: 'REPORTES_EMITIDOS', label: 'Reportes Emitidos', color: 'bg-teal-100 text-teal-700', icon: FileText },
  { id: 'ROMANEOS_ENVIADOS', label: 'Romaneos Enviados', color: 'bg-blue-100 text-blue-700', icon: Send },
  { id: 'COMPLETADO', label: 'Completado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  { id: 'ANULADO', label: 'Anulado', color: 'bg-red-100 text-red-700', icon: XCircle },
]

interface FlujoFaena {
  id: string
  fecha: string
  estado: string
  datosVerificados: boolean
  vistoBueno: boolean
  datosSubidos: boolean
  reportesEmitidos: boolean
  romaneosEnviados: boolean
  observaciones?: string
  createdAt: string
  updatedAt: string
  listaFaena: {
    id: string
    fecha: string
    cantidadTotal: number
    supervisor?: { nombre: string }
    tropas?: { tropa: { codigo: string; usuarioFaena?: { nombre: string } } }[]
  }
  verificador?: { nombre: string }
  supervisor?: { nombre: string }
  historial?: { fecha: string; estadoNuevo: string; operador?: { nombre: string } }[]
}

interface Operador {
  id: string
  nombre: string
  nivel: string
}

interface FlujoFaenaListProps {
  operador: Operador
  onSelectFlujo: (flujo: FlujoFaena) => void
}

export function FlujoFaenaList({ operador, onSelectFlujo }: FlujoFaenaListProps) {
  const [flujos, setFlujos] = useState<FlujoFaena[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string | null>(null)

  useEffect(() => {
    fetchFlujos()
  }, [filtroEstado])

  const fetchFlujos = async () => {
    setLoading(true)
    try {
      const url = filtroEstado 
        ? `/api/flujo-faena?estado=${filtroEstado}` 
        : '/api/flujo-faena'
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setFlujos(data.data)
      }
    } catch (error) {
      console.error('Error fetching flujos:', error)
      toast.error('Error al cargar flujos de faena')
    } finally {
      setLoading(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    const est = ESTADOS_FLUJO.find(e => e.id === estado)
    const Icon = est?.icon || Clock
    return (
      <Badge className={`${est?.color || 'bg-gray-100'} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {est?.label || estado}
      </Badge>
    )
  }

  const getProgressPercentage = (flujo: FlujoFaena) => {
    const steps = [
      flujo.datosVerificados,
      flujo.vistoBueno,
      flujo.datosSubidos,
      flujo.reportesEmitidos,
      flujo.romaneosEnviados
    ]
    const completed = steps.filter(Boolean).length
    return (completed / steps.length) * 100
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Workflow className="w-8 h-8 animate-pulse text-amber-500" />
      </div>
    )
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Workflow className="w-5 h-5 text-amber-600" />
              Flujos de Faena
            </CardTitle>
            <CardDescription>
              Gestión del ciclo completo de faena con aprobación de supervisor
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchFlujos}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
        
        {/* Filtros por estado */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            variant={filtroEstado === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroEstado(null)}
            className={filtroEstado === null ? 'bg-amber-500 hover:bg-amber-600' : ''}
          >
            Todos
          </Button>
          {ESTADOS_FLUJO.filter(e => ['PENDIENTE_VISTO_BUENO', 'CONFIRMADO', 'DATOS_SUBIDOS'].includes(e.id)).map(estado => (
            <Button
              key={estado.id}
              variant={filtroEstado === estado.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroEstado(estado.id)}
              className={filtroEstado === estado.id ? 'bg-amber-500 hover:bg-amber-600' : ''}
            >
              {estado.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {flujos.length === 0 ? (
          <div className="p-12 text-center text-stone-400">
            <Workflow className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No hay flujos de faena</p>
            <p className="text-sm">Los flujos se crean automáticamente al cerrar una lista de faena</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Lista Faena</TableHead>
                <TableHead>Animales</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead>Supervisor</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flujos.map((flujo) => (
                <TableRow key={flujo.id} className="hover:bg-stone-50">
                  <TableCell className="font-medium">
                    {formatDate(flujo.fecha)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-mono text-sm">
                        {new Date(flujo.listaFaena?.fecha).toLocaleDateString('es-AR')}
                      </span>
                      <span className="text-xs text-stone-400">
                        {flujo.listaFaena?.tropas?.length || 0} tropas
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-amber-600">
                      {flujo.listaFaena?.cantidadTotal || 0}
                    </span>
                  </TableCell>
                  <TableCell>{getEstadoBadge(flujo.estado)}</TableCell>
                  <TableCell>
                    <div className="w-24">
                      <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-400 to-green-500 transition-all duration-300"
                          style={{ width: `${getProgressPercentage(flujo)}%` }}
                        />
                      </div>
                      <span className="text-xs text-stone-400 mt-1">
                        {Math.round(getProgressPercentage(flujo))}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {flujo.supervisor?.nombre || flujo.listaFaena?.supervisor?.nombre || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectFlujo(flujo)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

export default FlujoFaenaList
