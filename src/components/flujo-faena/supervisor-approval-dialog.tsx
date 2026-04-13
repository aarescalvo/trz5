'use client'

import { useState } from 'react'
import { Shield, AlertTriangle, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface Operador {
  id: string
  nombre: string
  nivel: string
}

interface SupervisorApprovalDialogProps {
  open: boolean
  onClose: () => void
  flujoId: string
  operador: Operador
  onComplete: () => void
}

export function SupervisorApprovalDialog({
  open,
  onClose,
  flujoId,
  operador,
  onComplete
}: SupervisorApprovalDialogProps) {
  const [loading, setLoading] = useState(false)
  const [comentario, setComentario] = useState('')
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [supervisor, setSupervisor] = useState<Operador | null>(null)
  const [verifyingPin, setVerifyingPin] = useState(false)
  const [approved, setApproved] = useState<boolean | null>(null)

  const verifyPin = async () => {
    if (!pin || pin.length < 4) {
      toast.error('Ingrese un PIN válido')
      return
    }

    setVerifyingPin(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      })
      const data = await res.json()
      
      if (data.success && (data.data.rol === 'SUPERVISOR' || data.data.rol === 'ADMINISTRADOR')) {
        setSupervisor({
          id: data.data.id,
          nombre: data.data.nombre,
          nivel: data.data.rol
        })
        toast.success(`Supervisor identificado: ${data.data.nombre}`)
      } else {
        toast.error('PIN inválido o sin permisos de supervisor')
      }
    } catch (error) {
      toast.error('Error al verificar PIN')
    } finally {
      setVerifyingPin(false)
    }
  }

  const handleApproval = async (aprobado: boolean) => {
    if (!supervisor) {
      toast.error('Debe identificarse con su PIN primero')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/flujo-faena/${flujoId}/visto-bueno`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supervisorId: supervisor.id,
          comentarioVistoBueno: comentario,
          aprobado
        })
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success(data.message)
        setApproved(aprobado)
        setTimeout(() => {
          onComplete()
          resetForm()
        }, 1500)
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Error al procesar visto bueno')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setPin('')
    setComentario('')
    setSupervisor(null)
    setApproved(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={resetForm}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <Shield className="w-5 h-5" />
            Visto Bueno de Supervisor
          </DialogTitle>
          <DialogDescription>
            Se requiere autorización de supervisor para continuar con el flujo
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* PIN Verification */}
          {!supervisor && (
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600 mb-2" />
                <p className="text-sm text-orange-700">
                  Ingrese su PIN de supervisor para autorizar esta acción.
                  Solo supervisores y administradores pueden dar visto bueno.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>PIN de Supervisor</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showPin ? 'text' : 'password'}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="••••••"
                      className="text-xl tracking-widest text-center h-12 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-12"
                      onClick={() => setShowPin(!showPin)}
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button 
                    onClick={verifyPin} 
                    disabled={verifyingPin || pin.length < 4}
                    className="h-12"
                  >
                    {verifyingPin ? 'Verificando...' : 'Verificar'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Supervisor Info */}
          {supervisor && (
            <>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">{supervisor.nombre}</p>
                    <p className="text-xs text-green-600">
                      {supervisor.nivel === 'ADMINISTRADOR' ? 'Administrador' : 'Supervisor'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Comentario */}
              <div className="space-y-2">
                <Label>Comentario (opcional)</Label>
                <Textarea
                  placeholder="Agregar observaciones sobre el visto bueno..."
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Result message */}
              {approved !== null && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${approved ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  {approved ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <p className="text-green-700 font-medium">Visto bueno otorgado correctamente</p>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-red-600" />
                      <p className="text-red-700 font-medium">Visto bueno rechazado</p>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetForm} disabled={loading}>
            Cancelar
          </Button>
          {supervisor && approved === null && (
            <>
              <Button 
                variant="destructive" 
                onClick={() => handleApproval(false)}
                disabled={loading}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rechazar
              </Button>
              <Button 
                onClick={() => handleApproval(true)}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Aprobar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SupervisorApprovalDialog
