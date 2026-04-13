'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface SIGICAStatus {
  habilitado: boolean
  conectado: boolean | null
  ultimaSincronizacion: Date | null
  mensaje?: string
}

interface SIGICAStatusCardProps {
  onProbarConexion?: () => Promise<void>
  onActualizarStock?: () => Promise<void>
  loading?: boolean
}

export function SIGICAStatusCard({ onProbarConexion, onActualizarStock, loading = false }: SIGICAStatusCardProps) {
  const [status, setStatus] = useState<SIGICAStatus>({
    habilitado: false,
    conectado: null,
    ultimaSincronizacion: null
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/sigica/config')
      const data = await response.json()
      
      if (data.success && data.data) {
        setStatus({
          habilitado: data.data.habilitado,
          conectado: null,
          ultimaSincronizacion: data.data.ultimaSincronizacion ? new Date(data.data.ultimaSincronizacion) : null
        })
      }
    } catch (error) {
      console.error('Error cargando estado SIGICA:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProbarConexion = async () => {
    if (onProbarConexion) {
      await onProbarConexion()
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/sigica/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ probarConexion: true })
      })
      const data = await response.json()
      
      setStatus(prev => ({
        ...prev,
        conectado: data.pruebaConexion?.exito ?? false,
        mensaje: data.pruebaConexion?.mensaje
      }))
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        conectado: false,
        mensaje: 'Error al probar conexión'
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const formatUltimaSincronizacion = (date: Date | null) => {
    if (!date) return 'Nunca'
    return new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {status.habilitado ? (
              <Cloud className="h-5 w-5 text-green-500" />
            ) : (
              <CloudOff className="h-5 w-5 text-muted-foreground" />
            )}
            Integración SIGICA
          </CardTitle>
          <Badge variant={status.habilitado ? 'default' : 'secondary'}>
            {status.habilitado ? 'Habilitado' : 'Deshabilitado'}
          </Badge>
        </div>
        <CardDescription>
          Sistema de Gestión de la Industria Cárnica Argentina
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado de conexión */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status.conectado === null ? (
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            ) : status.conectado ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">
              {status.conectado === null 
                ? 'Sin verificar' 
                : status.conectado 
                  ? 'Conectado' 
                  : 'Sin conexión'}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleProbarConexion}
            disabled={!status.habilitado || isLoading || loading}
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Probar</span>
          </Button>
        </div>

        {/* Última sincronización */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Última sincronización: {formatUltimaSincronizacion(status.ultimaSincronizacion)}</span>
        </div>

        {/* Mensaje de error/info */}
        {status.mensaje && (
          <p className={`text-sm ${status.conectado ? 'text-green-600' : 'text-red-600'}`}>
            {status.mensaje}
          </p>
        )}

        {/* Acción de actualizar stock */}
        {status.habilitado && onActualizarStock && (
          <Button
            className="w-full"
            onClick={onActualizarStock}
            disabled={isLoading || loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar Stock en SIGICA
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
