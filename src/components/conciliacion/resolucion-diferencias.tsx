'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  AlertTriangle, CheckCircle, XCircle, Search, ArrowRight,
  Loader2, Filter, FileSearch, ArrowRightLeft, Eye
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Diferencia {
  id: string
  fechaExtracto: string
  descripcionExtracto: string
  referenciaExtracto?: string
  montoExtracto: number
  tipoExtracto: string
  estado: string
  confianza?: number
  observaciones?: string
  conciliacion: {
    id: string
    cuentaBancaria: {
      banco: string
      numeroCuenta: string
    }
  }
  movimientoCaja?: {
    id: string
    concepto: string
    monto: number
    fecha: string
  }
}

interface PosibleMatch {
  id: string
  concepto: string
  monto: number
  fecha: string
  tipo: string
  caja?: {
    nombre: string
  }
}

export function ResolucionDiferencias({ operador }: { operador: Operador }) {
  const [diferencias, setDiferencias] = useState<Diferencia[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>('DIFERENCIA')
  
  // Dialogs
  const [detalleSeleccionado, setDetalleSeleccionado] = useState<Diferencia | null>(null)
  const [posiblesMatches, setPosiblesMatches] = useState<PosibleMatch[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [ajusteDialogOpen, setAjusteDialogOpen] = useState(false)
  const [busquedaDialogOpen, setBusquedaDialogOpen] = useState(false)
  
  // Form state
  const [montoAjuste, setMontoAjuste] = useState<number>(0)
  const [observaciones, setObservaciones] = useState('')
  const [busquedaManual, setBusquedaManual] = useState({
    fechaDesde: '',
    fechaHasta: '',
    montoMin: '',
    montoMax: '',
    concepto: ''
  })
  
  useEffect(() => {
    fetchDiferencias()
  }, [filtroEstado])
  
  const fetchDiferencias = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/conciliacion/diferencias?estado=${filtroEstado}`)
      const data = await res.json()
      setDiferencias(data.data || [])
    } catch (error) {
      console.error('Error fetching diferencias:', error)
      toast.error('Error al cargar diferencias')
    } finally {
      setLoading(false)
    }
  }
  
  const handleBuscarMatch = async (detalle: Diferencia) => {
    setDetalleSeleccionado(detalle)
    setBusquedaDialogOpen(true)
    
    try {
      const res = await fetch('/api/conciliacion/diferencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          detalleId: detalle.id,
          accion: 'BUSCAR'
        })
      })
      
      const data = await res.json()
      if (data.success) {
        setPosiblesMatches(data.data.posiblesCoincidencias || [])
      }
    } catch (error) {
      console.error('Error buscando matches:', error)
    }
  }
  
  const handleConciliar = async (movimientoCajaId: string) => {
    if (!detalleSeleccionado) return
    
    try {
      const res = await fetch('/api/conciliacion/diferencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          detalleId: detalleSeleccionado.id,
          accion: 'CONCILIAR',
          movimientoCajaId,
          observaciones
        })
      })
      
      const data = await res.json()
      if (data.success) {
        toast.success('Movimiento conciliado')
        setDialogOpen(false)
        setBusquedaDialogOpen(false)
        fetchDiferencias()
      } else {
        toast.error(data.error || 'Error al conciliar')
      }
    } catch (error) {
      console.error('Error conciliando:', error)
      toast.error('Error al conciliar')
    }
  }
  
  const handleCrearAjuste = async () => {
    if (!detalleSeleccionado) return
    
    try {
      const res = await fetch('/api/conciliacion/diferencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          detalleId: detalleSeleccionado.id,
          accion: 'AJUSTE',
          montoAjuste,
          observaciones
        })
      })
      
      const data = await res.json()
      if (data.success) {
        toast.success('Ajuste creado')
        setAjusteDialogOpen(false)
        fetchDiferencias()
      } else {
        toast.error(data.error || 'Error al crear ajuste')
      }
    } catch (error) {
      console.error('Error creando ajuste:', error)
      toast.error('Error al crear ajuste')
    }
  }
  
  const handleIgnorar = async () => {
    if (!detalleSeleccionado) return
    
    try {
      const res = await fetch('/api/conciliacion/diferencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          detalleId: detalleSeleccionado.id,
          accion: 'IGNORAR',
          observaciones
        })
      })
      
      const data = await res.json()
      if (data.success) {
        toast.success('Movimiento ignorado')
        setDialogOpen(false)
        fetchDiferencias()
      } else {
        toast.error(data.error || 'Error al ignorar')
      }
    } catch (error) {
      console.error('Error ignorando:', error)
      toast.error('Error al ignorar')
    }
  }
  
  const handleBusquedaManual = async () => {
    if (!detalleSeleccionado) return
    
    try {
      const res = await fetch('/api/conciliacion/diferencias', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          detalleId: detalleSeleccionado.id,
          filtros: busquedaManual
        })
      })
      
      const data = await res.json()
      if (data.success) {
        setPosiblesMatches(data.data || [])
      }
    } catch (error) {
      console.error('Error en búsqueda manual:', error)
    }
  }
  
  const getEstadoBadge = (estado: string) => {
    const colores: Record<string, string> = {
      'PENDIENTE': 'bg-yellow-100 text-yellow-800',
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
  
  // Resumen
  const totalDiferencias = diferencias.filter(d => d.estado === 'DIFERENCIA').length
  const totalPendientes = diferencias.filter(d => d.estado === 'PENDIENTE').length
  const totalMonto = diferencias
    .filter(d => d.estado === 'DIFERENCIA')
    .reduce((sum, d) => sum + d.montoExtracto, 0)
  
  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-stone-500">Cargando diferencias...</p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-500 p-2 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Diferencias</p>
                <p className="text-2xl font-bold">{totalDiferencias}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-500 p-2 rounded-lg">
                <Filter className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Pendientes Revisión</p>
                <p className="text-2xl font-bold">{totalPendientes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500 p-2 rounded-lg">
                <ArrowRightLeft className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Monto en Diferencias</p>
                <p className="text-2xl font-bold">${totalMonto.toLocaleString('es-AR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Lista de diferencias */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileSearch className="w-5 h-5" />
                Diferencias Pendientes de Resolución
              </CardTitle>
              <CardDescription>
                Movimientos del extracto sin coincidencia en el sistema
              </CardDescription>
            </div>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DIFERENCIA">Diferencias</SelectItem>
                <SelectItem value="PENDIENTE">Pendientes</SelectItem>
                <SelectItem value="AJUSTE">Ajustes</SelectItem>
                <SelectItem value="CONCILIADO">Conciliados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {diferencias.length === 0 ? (
            <div className="text-center py-8 text-stone-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay diferencias pendientes</p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cuenta</TableHead>
                    <TableHead>Descripción Extracto</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Confianza</TableHead>
                    <TableHead>Match Sistema</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diferencias.map((diferencia) => (
                    <TableRow key={diferencia.id}>
                      <TableCell>
                        {new Date(diferencia.fechaExtracto).toLocaleDateString('es-AR')}
                      </TableCell>
                      <TableCell className="text-xs">
                        {diferencia.conciliacion.cuentaBancaria.banco}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {diferencia.descripcionExtracto}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        diferencia.tipoExtracto === 'CREDITO' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {diferencia.tipoExtracto === 'CREDITO' ? '+' : '-'}
                        ${diferencia.montoExtracto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {diferencia.confianza ? `${diferencia.confianza.toFixed(0)}%` : '-'}
                      </TableCell>
                      <TableCell>
                        {diferencia.movimientoCaja ? (
                          <div className="text-xs">
                            <p className="truncate max-w-xs">{diferencia.movimientoCaja.concepto}</p>
                            <p className="text-stone-500">
                              ${diferencia.movimientoCaja.monto.toLocaleString('es-AR')}
                            </p>
                          </div>
                        ) : (
                          <span className="text-stone-400">Sin match</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getEstadoBadge(diferencia.estado)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBuscarMatch(diferencia)}
                          >
                            <Search className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setDetalleSeleccionado(diferencia)
                              setMontoAjuste(diferencia.montoExtracto)
                              setAjusteDialogOpen(true)
                            }}
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      
      {/* Dialog de búsqueda de matches */}
      <Dialog open={busquedaDialogOpen} onOpenChange={setBusquedaDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Buscar Coincidencia
            </DialogTitle>
          </DialogHeader>
          
          {detalleSeleccionado && (
            <div className="space-y-4">
              {/* Detalle del extracto */}
              <div className="p-4 bg-stone-50 rounded-lg">
                <p className="text-sm text-stone-500 mb-1">Movimiento del Extracto</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-stone-400">Fecha:</span>
                    <p className="font-medium">
                      {new Date(detalleSeleccionado.fechaExtracto).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-stone-400">Monto:</span>
                    <p className={`font-bold ${
                      detalleSeleccionado.tipoExtracto === 'CREDITO' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${detalleSeleccionado.montoExtracto.toLocaleString('es-AR')}
                    </p>
                  </div>
                </div>
                <p className="text-sm mt-2">{detalleSeleccionado.descripcionExtracto}</p>
              </div>
              
              {/* Filtros de búsqueda */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <div>
                  <Label className="text-xs">Desde</Label>
                  <Input
                    type="date"
                    value={busquedaManual.fechaDesde}
                    onChange={(e) => setBusquedaManual({...busquedaManual, fechaDesde: e.target.value})}
                  />
                </div>
                <div>
                  <Label className="text-xs">Hasta</Label>
                  <Input
                    type="date"
                    value={busquedaManual.fechaHasta}
                    onChange={(e) => setBusquedaManual({...busquedaManual, fechaHasta: e.target.value})}
                  />
                </div>
                <div>
                  <Label className="text-xs">Monto Min</Label>
                  <Input
                    type="number"
                    value={busquedaManual.montoMin}
                    onChange={(e) => setBusquedaManual({...busquedaManual, montoMin: e.target.value})}
                  />
                </div>
                <div>
                  <Label className="text-xs">Monto Max</Label>
                  <Input
                    type="number"
                    value={busquedaManual.montoMax}
                    onChange={(e) => setBusquedaManual({...busquedaManual, montoMax: e.target.value})}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleBusquedaManual} className="w-full">
                    <Search className="w-4 h-4 mr-1" />
                    Buscar
                  </Button>
                </div>
              </div>
              
              {/* Posibles matches */}
              <div>
                <p className="text-sm font-medium mb-2">Posibles Coincidencias ({posiblesMatches.length})</p>
                <ScrollArea className="h-48">
                  {posiblesMatches.length === 0 ? (
                    <div className="text-center py-8 text-stone-400">
                      No se encontraron coincidencias
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Concepto</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                          <TableHead>Caja</TableHead>
                          <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {posiblesMatches.map((match) => (
                          <TableRow key={match.id}>
                            <TableCell>
                              {new Date(match.fecha).toLocaleDateString('es-AR')}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {match.concepto}
                            </TableCell>
                            <TableCell className={`text-right font-medium ${
                              match.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ${match.monto.toLocaleString('es-AR')}
                            </TableCell>
                            <TableCell className="text-xs">
                              {match.caja?.nombre || '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                onClick={() => handleConciliar(match.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Conciliar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </div>
              
              {/* Observaciones */}
              <div>
                <Label>Observaciones</Label>
                <Textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Agregar observaciones..."
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBusquedaDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleIgnorar}>
              <XCircle className="w-4 h-4 mr-2" />
              Ignorar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de ajuste */}
      <Dialog open={ajusteDialogOpen} onOpenChange={setAjusteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Ajuste Contable</DialogTitle>
          </DialogHeader>
          
          {detalleSeleccionado && (
            <div className="space-y-4">
              <div className="p-4 bg-stone-50 rounded-lg">
                <p className="text-sm">{detalleSeleccionado.descripcionExtracto}</p>
                <p className={`font-bold mt-1 ${
                  detalleSeleccionado.tipoExtracto === 'CREDITO' ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${detalleSeleccionado.montoExtracto.toLocaleString('es-AR')}
                </p>
              </div>
              
              <div>
                <Label>Monto del Ajuste</Label>
                <Input
                  type="number"
                  value={montoAjuste}
                  onChange={(e) => setMontoAjuste(parseFloat(e.target.value) || 0)}
                />
              </div>
              
              <div>
                <Label>Observaciones</Label>
                <Textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Descripción del ajuste..."
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAjusteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCrearAjuste}>
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Crear Ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ResolucionDiferencias
