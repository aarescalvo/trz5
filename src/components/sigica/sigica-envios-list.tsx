'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  RefreshCw, 
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Send,
  Package,
  ArrowRight,
  Truck
} from 'lucide-react'

interface EnvioSIGICA {
  id: string
  tipo: 'ROMANEO' | 'STOCK_CAMARA' | 'MOVIMIENTO' | 'DESPACHO'
  fechaEnvio: Date
  cantidadRegistros: number
  estado: 'PENDIENTE' | 'ENVIANDO' | 'EXITOSO' | 'ERROR' | 'REINTENTAR'
  codigoTransaccion: string | null
  mensajeError: string | null
  intentos: number
  ultimoIntento: Date | null
  operador: {
    id: string
    nombre: string
    usuario: string
  } | null
}

const TIPO_ICON: Record<string, typeof Send> = {
  ROMANEO: Send,
  STOCK_CAMARA: Package,
  MOVIMIENTO: ArrowRight,
  DESPACHO: Truck
}

const TIPO_LABEL: Record<string, string> = {
  ROMANEO: 'Romaneo',
  STOCK_CAMARA: 'Stock Cámara',
  MOVIMIENTO: 'Movimiento',
  DESPACHO: 'Despacho'
}

const ESTADO_CONFIG: Record<string, { color: string; icon: typeof CheckCircle }> = {
  PENDIENTE: { color: 'secondary', icon: Clock },
  ENVIANDO: { color: 'default', icon: RefreshCw },
  EXITOSO: { color: 'default', icon: CheckCircle },
  ERROR: { color: 'destructive', icon: XCircle },
  REINTENTAR: { color: 'outline', icon: AlertCircle }
}

export function SIGICAEnviosList() {
  const [envios, setEnvios] = useState<EnvioSIGICA[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [reintentando, setReintentando] = useState<string | null>(null)

  useEffect(() => {
    loadEnvios()
  }, [filtroEstado, filtroTipo])

  const loadEnvios = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroEstado !== 'todos') {
        params.append('estado', filtroEstado)
      }
      if (filtroTipo !== 'todos') {
        params.append('tipo', filtroTipo)
      }

      const response = await fetch(`/api/sigica/envios?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setEnvios(data.data)
      }
    } catch (error) {
      console.error('Error cargando envíos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReintentar = async (envioId: string) => {
    setReintentando(envioId)
    try {
      const response = await fetch('/api/sigica/reintentar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ envioId })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Recargar lista
        await loadEnvios()
      } else {
        alert(data.error || 'Error al reintentar envío')
      }
    } catch (error) {
      console.error('Error reintentando envío:', error)
      alert('Error al reintentar envío')
    } finally {
      setReintentando(null)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(date))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Historial de Envíos</CardTitle>
            <CardDescription>
              Registro de envíos realizados a SIGICA
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadEnvios} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex gap-4 mb-4">
          <div className="w-48">
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="ENVIANDO">Enviando</SelectItem>
                <SelectItem value="EXITOSO">Exitoso</SelectItem>
                <SelectItem value="ERROR">Error</SelectItem>
                <SelectItem value="REINTENTAR">Reintentar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-48">
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                <SelectItem value="ROMANEO">Romaneo</SelectItem>
                <SelectItem value="STOCK_CAMARA">Stock Cámara</SelectItem>
                <SelectItem value="MOVIMIENTO">Movimiento</SelectItem>
                <SelectItem value="DESPACHO">Despacho</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabla */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Registros</TableHead>
                <TableHead>Código Trans.</TableHead>
                <TableHead>Operador</TableHead>
                <TableHead>Intentos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">Cargando envíos...</p>
                  </TableCell>
                </TableRow>
              ) : envios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No hay envíos registrados</p>
                  </TableCell>
                </TableRow>
              ) : (
                envios.map((envio) => {
                  const Icon = TIPO_ICON[envio.tipo] || Send
                  const estadoConfig = ESTADO_CONFIG[envio.estado] || ESTADO_CONFIG.PENDIENTE
                  const EstadoIcon = estadoConfig.icon
                  
                  return (
                    <TableRow key={envio.id}>
                      <TableCell className="text-sm">
                        {formatDate(envio.fechaEnvio)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span>{TIPO_LABEL[envio.tipo]}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={estadoConfig.color as any}>
                          <EstadoIcon className="h-3 w-3 mr-1" />
                          {envio.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>{envio.cantidadRegistros}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {envio.codigoTransaccion || '-'}
                      </TableCell>
                      <TableCell>{envio.operador?.nombre || '-'}</TableCell>
                      <TableCell>
                        <span className={envio.intentos >= 3 ? 'text-red-500' : ''}>
                          {envio.intentos}/3
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {(envio.estado === 'ERROR' || envio.estado === 'REINTENTAR') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReintentar(envio.id)}
                            disabled={reintentando === envio.id || envio.intentos >= 3}
                          >
                            {reintentando === envio.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCcw className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Detalle del error si aplica */}
        {envios.filter(e => e.mensajeError).length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Últimos errores:</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {envios
                .filter(e => e.mensajeError)
                .slice(0, 5)
                .map(envio => (
                  <div key={envio.id} className="text-sm p-2 bg-red-50 border border-red-200 rounded">
                    <span className="font-medium">{formatDate(envio.fechaEnvio)}:</span>{' '}
                    <span className="text-red-600">{envio.mensajeError}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
