'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  FileCheck, CheckCircle, AlertCircle, Clock, Loader2,
  Play, Check, X, Eye, ArrowRight, Percent
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Conciliacion {
  id: string
  fecha: string
  fechaDesde: string
  fechaHasta: string
  nombreArchivo: string
  totalRegistros: number
  totalDebitos: number
  totalCreditos: number
  conciliados: number
  pendientes: number
  diferencias: number
  estado: string
  cuentaBancaria?: {
    banco: string
    tipoCuenta: string
    numeroCuenta: string
  }
}

interface DetalleConciliacion {
  id: string
  fechaExtracto: string
  descripcionExtracto: string
  referenciaExtracto?: string
  montoExtracto: number
  tipoExtracto: string
  estado: string
  confianza?: number
  movimientoCaja?: {
    id: string
    concepto: string
    monto: number
    fecha: string
  }
}

export function ConciliacionAutomatica({ operador }: { operador: Operador }) {
  const [conciliaciones, setConciliaciones] = useState<Conciliacion[]>([])
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(false)
  const [conciliacionSeleccionada, setConciliacionSeleccionada] = useState<Conciliacion | null>(null)
  const [detalles, setDetalles] = useState<DetalleConciliacion[]>([])
  const [detalleDialogOpen, setDetalleDialogOpen] = useState(false)
  const [umbralConfianza, setUmbralConfianza] = useState(70)
  
  useEffect(() => {
    fetchConciliaciones()
  }, [])
  
  const fetchConciliaciones = async () => {
    try {
      const res = await fetch('/api/conciliacion/importar')
      const data = await res.json()
      setConciliaciones(data.data || [])
    } catch (error) {
      console.error('Error fetching conciliaciones:', error)
      toast.error('Error al cargar conciliaciones')
    } finally {
      setLoading(false)
    }
  }
  
  const fetchDetalles = async (conciliacionId: string) => {
    try {
      const res = await fetch(`/api/conciliacion/procesar?id=${conciliacionId}`)
      const data = await res.json()
      if (data.success) {
        setDetalles(data.data.detalles || [])
      }
    } catch (error) {
      console.error('Error fetching detalles:', error)
    }
  }
  
  const handleProcesar = async (conciliacionId: string) => {
    setProcesando(true)
    try {
      const res = await fetch('/api/conciliacion/procesar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conciliacionId,
          umbralConfianza
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast.success('Conciliación procesada correctamente')
        fetchConciliaciones()
        
        // Mostrar resultados
        setConciliacionSeleccionada(data.data)
        setDetalles(data.data.detalles || [])
      } else {
        toast.error(data.error || 'Error al procesar conciliación')
      }
    } catch (error) {
      console.error('Error procesando:', error)
      toast.error('Error al procesar conciliación')
    } finally {
      setProcesando(false)
    }
  }
  
  const handleConfirmar = async (conciliacionId: string) => {
    try {
      const res = await fetch('/api/conciliacion/procesar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conciliacionId })
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast.success('Conciliación confirmada')
        fetchConciliaciones()
        setConciliacionSeleccionada(null)
        setDetalles([])
      } else {
        toast.error(data.error || 'Error al confirmar conciliación')
      }
    } catch (error) {
      console.error('Error confirmando:', error)
      toast.error('Error al confirmar conciliación')
    }
  }
  
  const getConfianzaBadge = (confianza?: number) => {
    if (!confianza) return null
    
    let color = 'bg-red-100 text-red-800'
    if (confianza >= 90) color = 'bg-green-100 text-green-800'
    else if (confianza >= 70) color = 'bg-blue-100 text-blue-800'
    else if (confianza >= 50) color = 'bg-yellow-100 text-yellow-800'
    
    return (
      <Badge className={color}>
        {confianza.toFixed(0)}%
      </Badge>
    )
  }
  
  const getEstadoBadge = (estado: string) => {
    const colores: Record<string, string> = {
      'PENDIENTE': 'bg-yellow-100 text-yellow-800',
      'PROCESADA': 'bg-blue-100 text-blue-800',
      'CONFIRMADA': 'bg-green-100 text-green-800',
      'CONCILIADO': 'bg-green-100 text-green-800',
      'DIFERENCIA': 'bg-red-100 text-red-800',
      'AJUSTE': 'bg-purple-100 text-purple-800'
    }
    
    return (
      <Badge className={colores[estado] || 'bg-gray-100 text-gray-800'}>
        {estado}
      </Badge>
    )
  }
  
  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-stone-500">Cargando conciliaciones...</p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Lista de conciliaciones pendientes */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            Conciliaciones Pendientes
          </CardTitle>
          <CardDescription>
            Seleccione una conciliación para procesar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {conciliaciones.length === 0 ? (
            <div className="text-center py-8 text-stone-400">
              <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay conciliaciones pendientes</p>
              <p className="text-sm">Importe un extracto bancario primero</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Archivo</TableHead>
                  <TableHead className="text-center">Registros</TableHead>
                  <TableHead className="text-right">Débitos</TableHead>
                  <TableHead className="text-right">Créditos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conciliaciones.map((conc) => (
                  <TableRow key={conc.id} className={
                    conciliacionSeleccionada?.id === conc.id ? 'bg-blue-50' : ''
                  }>
                    <TableCell>
                      {new Date(conc.fecha).toLocaleDateString('es-AR')}
                    </TableCell>
                    <TableCell>
                      {conc.cuentaBancaria?.banco} - {conc.cuentaBancaria?.numeroCuenta}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {conc.nombreArchivo}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {conc.totalRegistros}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      ${conc.totalDebitos.toLocaleString('es-AR')}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      ${conc.totalCreditos.toLocaleString('es-AR')}
                    </TableCell>
                    <TableCell>
                      {getEstadoBadge(conc.estado)}
                    </TableCell>
                    <TableCell className="text-right">
                      {conc.estado === 'PENDIENTE' && (
                        <Button
                          size="sm"
                          onClick={() => handleProcesar(conc.id)}
                          disabled={procesando}
                        >
                          {procesando ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-1" />
                              Procesar
                            </>
                          )}
                        </Button>
                      )}
                      {(conc.estado === 'PROCESADA' || conc.estado === 'CONFIRMADA') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setConciliacionSeleccionada(conc)
                            fetchDetalles(conc.id)
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Resultados de la conciliación seleccionada */}
      {conciliacionSeleccionada && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Resultados de Conciliación
                </CardTitle>
                <CardDescription>
                  {conciliacionSeleccionada.nombreArchivo}
                </CardDescription>
              </div>
              {conciliacionSeleccionada.estado === 'PROCESADA' && (
                <Button onClick={() => handleConfirmar(conciliacionSeleccionada.id)}>
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar Todo
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Resumen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-600">
                  {conciliacionSeleccionada.conciliados}
                </p>
                <p className="text-sm text-stone-500">Conciliados</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg text-center">
                <p className="text-3xl font-bold text-yellow-600">
                  {conciliacionSeleccionada.pendientes}
                </p>
                <p className="text-sm text-stone-500">Pendientes</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <p className="text-3xl font-bold text-red-600">
                  {conciliacionSeleccionada.diferencias}
                </p>
                <p className="text-sm text-stone-500">Diferencias</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {Math.round(
                    (conciliacionSeleccionada.conciliados / conciliacionSeleccionada.totalRegistros) * 100
                  )}%
                </p>
                <p className="text-sm text-stone-500">Efectividad</p>
              </div>
            </div>
            
            {/* Barra de progreso */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Progreso de conciliación</span>
                <span className="font-medium">
                  {conciliacionSeleccionada.conciliados} de {conciliacionSeleccionada.totalRegistros}
                </span>
              </div>
              <Progress 
                value={(conciliacionSeleccionada.conciliados / conciliacionSeleccionada.totalRegistros) * 100}
                className="h-3"
              />
            </div>
            
            {/* Detalles */}
            <div>
              <h4 className="font-medium mb-3">Detalle de Movimientos</h4>
              <ScrollArea className="h-80">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Descripción Extracto</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Confianza</TableHead>
                      <TableHead>Match Sistema</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detalles.map((detalle) => (
                      <TableRow key={detalle.id} className={
                        detalle.estado === 'CONCILIADO' ? 'bg-green-50' :
                        detalle.estado === 'DIFERENCIA' ? 'bg-red-50' :
                        'bg-yellow-50'
                      }>
                        <TableCell>
                          {new Date(detalle.fechaExtracto).toLocaleDateString('es-AR')}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {detalle.descripcionExtracto}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${
                          detalle.tipoExtracto === 'CREDITO' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {detalle.tipoExtracto === 'CREDITO' ? '+' : '-'}
                          ${detalle.montoExtracto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          {getConfianzaBadge(detalle.confianza)}
                        </TableCell>
                        <TableCell>
                          {detalle.movimientoCaja ? (
                            <div className="text-xs">
                              <p className="truncate max-w-xs">{detalle.movimientoCaja.concepto}</p>
                              <p className="text-stone-500">
                                ${detalle.movimientoCaja.monto.toLocaleString('es-AR')}
                              </p>
                            </div>
                          ) : (
                            <span className="text-stone-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getEstadoBadge(detalle.estado)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Configuración de umbral */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Percent className="w-5 h-5" />
            Configuración de Conciliación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label className="text-sm">Umbral de Confianza:</Label>
            <Select 
              value={umbralConfianza.toString()} 
              onValueChange={(v) => setUmbralConfianza(parseInt(v))}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="90">90% - Muy estricto</SelectItem>
                <SelectItem value="80">80% - Estricto</SelectItem>
                <SelectItem value="70">70% - Normal</SelectItem>
                <SelectItem value="60">60% - Flexible</SelectItem>
                <SelectItem value="50">50% - Muy flexible</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-stone-500">
              Los movimientos con confianza igual o superior se concilian automáticamente
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ConciliacionAutomatica
