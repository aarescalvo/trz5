'use client'

import { useState, useEffect } from 'react'
import { 
  ArrowLeft, Calendar, User, Clock, CheckCircle, XCircle, AlertTriangle,
  FileCheck, Upload, FileText, Send, Shield, ChevronDown, ChevronUp,
  RefreshCw, Printer, Mail, MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { FlujoFaenaTimeline } from './flujo-faena-timeline'
import { SupervisorApprovalDialog } from './supervisor-approval-dialog'
import { toast } from 'sonner'

const ESTADOS_FLUJO: Record<string, { label: string; color: string; description: string }> = {
  INICIADO: { label: 'Iniciado', color: 'bg-slate-100 text-slate-700', description: 'Faena en proceso' },
  VERIFICACION: { label: 'Verificación', color: 'bg-amber-100 text-amber-700', description: 'En verificación de datos' },
  PENDIENTE_VISTO_BUENO: { label: 'Pendiente Supervisor', color: 'bg-orange-100 text-orange-700', description: 'Esperando visto bueno' },
  CONFIRMADO: { label: 'Confirmado', color: 'bg-emerald-100 text-emerald-700', description: 'Visto bueno otorgado' },
  DATOS_SUBIDOS: { label: 'Datos Subidos', color: 'bg-cyan-100 text-cyan-700', description: 'Datos subidos al sistema' },
  REPORTES_EMITIDOS: { label: 'Reportes Emitidos', color: 'bg-teal-100 text-teal-700', description: 'Reportes generados' },
  ROMANEOS_ENVIADOS: { label: 'Romaneos Enviados', color: 'bg-blue-100 text-blue-700', description: 'Romaneos enviados a clientes' },
  COMPLETADO: { label: 'Completado', color: 'bg-green-100 text-green-700', description: 'Flujo completo' },
  ANULADO: { label: 'Anulado', color: 'bg-red-100 text-red-700', description: 'Flujo anulado' },
}

interface FlujoFaena {
  id: string
  fecha: string
  estado: string
  datosVerificados: boolean
  vistoBueno: boolean
  datosSubidos: boolean
  reportesEmitidos: boolean
  romaneosEnviados: boolean
  comentarioVistoBueno?: string
  observaciones?: string
  fechaVerificacion?: string
  fechaVistoBueno?: string
  fechaSubida?: string
  fechaReportes?: string
  fechaEnvioRomaneos?: string
  listaFaena: {
    id: string
    fecha: string
    cantidadTotal: number
    supervisor?: { nombre: string }
    tropas?: { 
      cantidad: number
      tropa: { 
        codigo: string
        cantidadCabezas: number
        usuarioFaena?: { nombre: string } 
      } 
    }[]
  }
  verificador?: { nombre: string }
  supervisor?: { nombre: string }
  historial?: { 
    fecha: string
    estadoAnterior: string
    estadoNuevo: string
    observaciones?: string
    operador?: { nombre: string } 
  }[]
}

interface Operador {
  id: string
  nombre: string
  nivel: string
}

interface FlujoFaenaDetailProps {
  flujoId: string
  operador: Operador
  onBack: () => void
}

export function FlujoFaenaDetail({ flujoId, operador, onBack }: FlujoFaenaDetailProps) {
  const [flujo, setFlujo] = useState<FlujoFaena | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [observaciones, setObservaciones] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    fetchFlujo()
  }, [flujoId])

  const fetchFlujo = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/flujo-faena/${flujoId}`)
      const data = await res.json()
      if (data.success) {
        setFlujo(data.data)
      }
    } catch (error) {
      console.error('Error fetching flujo:', error)
      toast.error('Error al cargar flujo')
    } finally {
      setLoading(false)
    }
  }

  const handleVerificar = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/flujo-faena/${flujoId}/verificar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificadorId: operador.id,
          observaciones
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setObservaciones('')
        fetchFlujo()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Error al verificar datos')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSubirDatos = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/flujo-faena/${flujoId}/subir-datos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operadorId: operador.id,
          observaciones
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setObservaciones('')
        fetchFlujo()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Error al subir datos')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEmitirReportes = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/flujo-faena/${flujoId}/emitir-reportes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operadorId: operador.id,
          observaciones
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setObservaciones('')
        fetchFlujo()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Error al emitir reportes')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEnviarRomaneos = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/flujo-faena/${flujoId}/enviar-romaneos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operadorId: operador.id,
          observaciones,
          metodoEnvio: 'EMAIL'
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setObservaciones('')
        fetchFlujo()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Error al enviar romaneos')
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprovalComplete = () => {
    setShowApprovalDialog(false)
    fetchFlujo()
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

  const canVerify = !flujo?.datosVerificados && flujo?.estado === 'INICIADO'
  const canApprove = flujo?.estado === 'PENDIENTE_VISTO_BUENO' && (operador.nivel === 'SUPERVISOR' || operador.nivel === 'ADMINISTRADOR')
  const canUploadData = flujo?.vistoBueno && flujo?.estado === 'CONFIRMADO'
  const canEmitReports = flujo?.datosSubidos && flujo?.estado === 'DATOS_SUBIDOS'
  const canSendRomaneos = flujo?.reportesEmitidos && flujo?.estado === 'REPORTES_EMITIDOS'

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  if (!flujo) {
    return (
      <div className="p-12 text-center">
        <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
        <p className="text-lg text-stone-600">Flujo no encontrado</p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </div>
    )
  }

  const estadoInfo = ESTADOS_FLUJO[flujo.estado]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchFlujo}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Main Info Card */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-600" />
                Flujo de Faena - {formatDate(flujo.fecha)}
              </CardTitle>
              <CardDescription>
                Lista de Faena: {new Date(flujo.listaFaena?.fecha).toLocaleDateString('es-AR')} - 
                {flujo.listaFaena?.cantidadTotal} animales
              </CardDescription>
            </div>
            <Badge className={`${estadoInfo?.color} text-base px-4 py-2`}>
              {estadoInfo?.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Status Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className={`p-4 rounded-lg border ${flujo.datosVerificados ? 'bg-green-50 border-green-200' : 'bg-stone-50 border-stone-200'}`}>
              <div className="flex items-center gap-2">
                {flujo.datosVerificados ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Clock className="w-5 h-5 text-stone-400" />
                )}
                <span className="font-medium text-sm">Verificación</span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                {flujo.datosVerificados ? 'Completado' : 'Pendiente'}
              </p>
              {flujo.verificador && (
                <p className="text-xs text-stone-400 mt-1">{flujo.verificador.nombre}</p>
              )}
            </div>

            <div className={`p-4 rounded-lg border ${flujo.vistoBueno ? 'bg-green-50 border-green-200' : 'bg-stone-50 border-stone-200'}`}>
              <div className="flex items-center gap-2">
                {flujo.vistoBueno ? (
                  <Shield className="w-5 h-5 text-green-500" />
                ) : (
                  <Shield className="w-5 h-5 text-stone-400" />
                )}
                <span className="font-medium text-sm">Visto Bueno</span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                {flujo.vistoBueno ? 'Aprobado' : 'Pendiente'}
              </p>
              {flujo.supervisor && (
                <p className="text-xs text-stone-400 mt-1">{flujo.supervisor.nombre}</p>
              )}
            </div>

            <div className={`p-4 rounded-lg border ${flujo.datosSubidos ? 'bg-green-50 border-green-200' : 'bg-stone-50 border-stone-200'}`}>
              <div className="flex items-center gap-2">
                {flujo.datosSubidos ? (
                  <Upload className="w-5 h-5 text-green-500" />
                ) : (
                  <Upload className="w-5 h-5 text-stone-400" />
                )}
                <span className="font-medium text-sm">Datos Subidos</span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                {flujo.datosSubidos ? 'Completado' : 'Pendiente'}
              </p>
            </div>

            <div className={`p-4 rounded-lg border ${flujo.reportesEmitidos ? 'bg-green-50 border-green-200' : 'bg-stone-50 border-stone-200'}`}>
              <div className="flex items-center gap-2">
                {flujo.reportesEmitidos ? (
                  <FileText className="w-5 h-5 text-green-500" />
                ) : (
                  <FileText className="w-5 h-5 text-stone-400" />
                )}
                <span className="font-medium text-sm">Reportes</span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                {flujo.reportesEmitidos ? 'Emitidos' : 'Pendiente'}
              </p>
            </div>

            <div className={`p-4 rounded-lg border ${flujo.romaneosEnviados ? 'bg-green-50 border-green-200' : 'bg-stone-50 border-stone-200'}`}>
              <div className="flex items-center gap-2">
                {flujo.romaneosEnviados ? (
                  <Send className="w-5 h-5 text-green-500" />
                ) : (
                  <Send className="w-5 h-5 text-stone-400" />
                )}
                <span className="font-medium text-sm">Romaneos</span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                {flujo.romaneosEnviados ? 'Enviados' : 'Pendiente'}
              </p>
            </div>
          </div>

          <Separator />

          {/* Tropas info */}
          <div>
            <h4 className="font-medium mb-3">Tropas en esta Lista</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {flujo.listaFaena?.tropas?.map((t, i) => (
                <div key={i} className="p-3 bg-stone-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold">{t.tropa.codigo}</span>
                    <Badge variant="outline">{t.cantidad} cab.</Badge>
                  </div>
                  <p className="text-sm text-stone-500 mt-1">{t.tropa.usuarioFaena?.nombre || '-'}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-4">
            <h4 className="font-medium">Acciones</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  placeholder="Agregar observaciones..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex flex-col gap-2">
                {canVerify && (
                  <Button 
                    onClick={handleVerificar} 
                    disabled={actionLoading}
                    className="bg-amber-500 hover:bg-amber-600"
                  >
                    <FileCheck className="w-4 h-4 mr-2" />
                    Verificar Datos
                  </Button>
                )}
                
                {canApprove && (
                  <Button 
                    onClick={() => setShowApprovalDialog(true)} 
                    disabled={actionLoading}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Dar Visto Bueno
                  </Button>
                )}
                
                {canUploadData && (
                  <Button 
                    onClick={handleSubirDatos} 
                    disabled={actionLoading}
                    className="bg-cyan-500 hover:bg-cyan-600"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Datos
                  </Button>
                )}
                
                {canEmitReports && (
                  <Button 
                    onClick={handleEmitirReportes} 
                    disabled={actionLoading}
                    className="bg-teal-500 hover:bg-teal-600"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Emitir Reportes
                  </Button>
                )}
                
                {canSendRomaneos && (
                  <Button 
                    onClick={handleEnviarRomaneos} 
                    disabled={actionLoading}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Romaneos
                  </Button>
                )}
              </div>
            </div>

            {flujo.comentarioVistoBueno && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm font-medium text-orange-700">Comentario del Supervisor:</p>
                <p className="text-sm text-orange-600 mt-1">{flujo.comentarioVistoBueno}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="border-0 shadow-md">
        <CardHeader className="cursor-pointer" onClick={() => setShowHistory(!showHistory)}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              Historial de Cambios
            </CardTitle>
            {showHistory ? <ChevronUp /> : <ChevronDown />}
          </div>
        </CardHeader>
        {showHistory && (
          <CardContent className="p-6">
            <FlujoFaenaTimeline historial={flujo.historial || []} />
          </CardContent>
        )}
      </Card>

      {/* Approval Dialog */}
      <SupervisorApprovalDialog
        open={showApprovalDialog}
        onClose={() => setShowApprovalDialog(false)}
        flujoId={flujoId}
        operador={operador}
        onComplete={handleApprovalComplete}
      />
    </div>
  )
}

export default FlujoFaenaDetail
