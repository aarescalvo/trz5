'use client'

import { useState, useEffect, useMemo } from 'react'
import { Target, Plus, Edit, Trash2, Save, X, TrendingUp, TrendingDown, Minus, Calendar, AlertTriangle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

interface Indicador {
  id: string
  nombre: string
  descripcion?: string
  unidad: string
  valorObjetivo: number
  valorMinimo: number
  valorMaximo: number
  frecuencia: string
  activo: boolean
  createdAt: string
  valores?: ValorIndicador[]
}

interface ValorIndicador {
  id: string
  indicadorId: string
  fecha: string
  valor: number
  observaciones?: string
  registradoPor?: string
  createdAt: string
}

interface Operador {
  id: string
  nombre: string
  nivel: string
}

const FRECUENCIAS = [
  { id: 'DIARIO', label: 'Diario' },
  { id: 'SEMANAL', label: 'Semanal' },
  { id: 'QUINCENAL', label: 'Quincenal' },
  { id: 'MENSUAL', label: 'Mensual' },
  { id: 'TRIMESTRAL', label: 'Trimestral' },
]

// Función para calcular desviación
const calcularDesviacion = (valor: number, objetivo: number) => {
  if (objetivo === 0) return 0
  return ((valor - objetivo) / objetivo) * 100
}

// Función para obtener el estado del indicador
const getEstadoIndicador = (valor: number, min: number, max: number, objetivo: number) => {
  if (valor >= objetivo * 0.95 && valor <= objetivo * 1.05) {
    return { estado: 'optimo', color: 'text-green-600 bg-green-50', icon: CheckCircle }
  }
  if (valor >= min && valor <= max) {
    return { estado: 'aceptable', color: 'text-amber-600 bg-amber-50', icon: Minus }
  }
  if (valor < min) {
    return { estado: 'bajo', color: 'text-red-600 bg-red-50', icon: TrendingDown }
  }
  return { estado: 'alto', color: 'text-red-600 bg-red-50', icon: TrendingUp }
}

export function Indicadores({ operador }: { operador: Operador }) {
  const [indicadores, setIndicadores] = useState<Indicador[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogIndicadorOpen, setDialogIndicadorOpen] = useState(false)
  const [dialogValorOpen, setDialogValorOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [indicadorEditando, setIndicadorEditando] = useState<Indicador | null>(null)
  const [indicadorSeleccionado, setIndicadorSeleccionado] = useState<Indicador | null>(null)
  
  const [formDataIndicador, setFormDataIndicador] = useState({
    nombre: '',
    descripcion: '',
    unidad: '%',
    valorObjetivo: 0,
    valorMinimo: 0,
    valorMaximo: 0,
    frecuencia: 'MENSUAL'
  })

  const [formDataValor, setFormDataValor] = useState({
    indicadorId: '',
    fecha: new Date().toISOString().split('T')[0],
    valor: 0,
    observaciones: ''
  })

  useEffect(() => {
    fetchIndicadores()
  }, [])

  const fetchIndicadores = async () => {
    try {
      const res = await fetch('/api/indicadores')
      const data = await res.json()
      if (data.success) {
        setIndicadores(data.data)
      }
    } catch (error) {
      console.error('Error fetching indicadores:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNuevoIndicador = () => {
    setIndicadorEditando(null)
    setFormDataIndicador({
      nombre: '',
      descripcion: '',
      unidad: '%',
      valorObjetivo: 0,
      valorMinimo: 0,
      valorMaximo: 0,
      frecuencia: 'MENSUAL'
    })
    setDialogIndicadorOpen(true)
  }

  const handleEditarIndicador = (indicador: Indicador) => {
    setIndicadorEditando(indicador)
    setFormDataIndicador({
      nombre: indicador.nombre,
      descripcion: indicador.descripcion || '',
      unidad: indicador.unidad,
      valorObjetivo: indicador.valorObjetivo,
      valorMinimo: indicador.valorMinimo,
      valorMaximo: indicador.valorMaximo,
      frecuencia: indicador.frecuencia
    })
    setDialogIndicadorOpen(true)
  }

  const handleEliminarIndicador = (indicador: Indicador) => {
    setIndicadorEditando(indicador)
    setDeleteOpen(true)
  }

  const handleGuardarIndicador = async () => {
    if (!formDataIndicador.nombre) {
      toast.error('Ingrese el nombre del indicador')
      return
    }

    setSaving(true)
    try {
      const url = '/api/indicadores'
      const method = indicadorEditando ? 'PUT' : 'POST'
      const body = indicadorEditando 
        ? { ...formDataIndicador, id: indicadorEditando.id }
        : formDataIndicador

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        toast.success(indicadorEditando ? 'Indicador actualizado' : 'Indicador creado')
        setDialogIndicadorOpen(false)
        fetchIndicadores()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmarEliminar = async () => {
    if (!indicadorEditando) return

    setSaving(true)
    try {
      const res = await fetch(`/api/indicadores?id=${indicadorEditando.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Indicador eliminado')
        setDeleteOpen(false)
        fetchIndicadores()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleNuevoValor = (indicador: Indicador) => {
    setIndicadorSeleccionado(indicador)
    setFormDataValor({
      indicadorId: indicador.id,
      fecha: new Date().toISOString().split('T')[0],
      valor: indicador.valorObjetivo,
      observaciones: ''
    })
    setDialogValorOpen(true)
  }

  const handleGuardarValor = async () => {
    if (!formDataValor.indicadorId) {
      toast.error('Seleccione un indicador')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/valores-indicador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formDataValor,
          registradoPor: operador.nombre
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Valor registrado')
        setDialogValorOpen(false)
        fetchIndicadores()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  // Calcular estadísticas de indicadores
  const indicadoresConEstado = useMemo(() => {
    return indicadores.map(ind => {
      const ultimoValor = ind.valores?.[0]
      const valorActual = ultimoValor?.valor || 0
      const estado = getEstadoIndicador(valorActual, ind.valorMinimo, ind.valorMaximo, ind.valorObjetivo)
      const desviacion = calcularDesviacion(valorActual, ind.valorObjetivo)
      
      return {
        ...ind,
        valorActual,
        ultimoValor,
        estado,
        desviacion
      }
    })
  }, [indicadores])

  const indicadoresOptimos = indicadoresConEstado.filter(i => i.estado.estado === 'optimo').length
  const indicadoresAceptables = indicadoresConEstado.filter(i => i.estado.estado === 'aceptable').length
  const indicadoresCriticos = indicadoresConEstado.filter(i => ['bajo', 'alto'].includes(i.estado.estado)).length

  return (
    <div className="space-y-6">
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Total Indicadores</p>
                <p className="text-2xl font-bold text-stone-800">{indicadores.length}</p>
              </div>
              <Target className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Óptimos</p>
                <p className="text-2xl font-bold text-green-600">{indicadoresOptimos}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Aceptables</p>
                <p className="text-2xl font-bold text-amber-600">{indicadoresAceptables}</p>
              </div>
              <Minus className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Críticos</p>
                <p className="text-2xl font-bold text-red-600">{indicadoresCriticos}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para gestión */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="configurar">Configurar Indicadores</TabsTrigger>
          <TabsTrigger value="valores">Cargar Valores</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-600" />
                Estado de Indicadores
              </CardTitle>
              <CardDescription>
                Vista general del estado actual de todos los indicadores
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center">
                  <Target className="w-8 h-8 animate-pulse mx-auto text-amber-500" />
                </div>
              ) : indicadoresConEstado.length === 0 ? (
                <div className="p-8 text-center text-stone-400">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay indicadores configurados</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Indicador</TableHead>
                        <TableHead className="text-center">Frecuencia</TableHead>
                        <TableHead className="text-right">Objetivo</TableHead>
                        <TableHead className="text-right">Valor Actual</TableHead>
                        <TableHead className="text-center">Desviación</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                        <TableHead className="text-center">Cumplimiento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {indicadoresConEstado.map((ind) => {
                        const EstadoIcon = ind.estado.icon
                        const cumplimientoPorcentaje = ind.valorObjetivo > 0 
                          ? Math.min(100, (ind.valorActual / ind.valorObjetivo) * 100)
                          : 0
                        
                        return (
                          <TableRow key={ind.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{ind.nombre}</p>
                                {ind.descripcion && (
                                  <p className="text-xs text-stone-500">{ind.descripcion}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">
                                {FRECUENCIAS.find(f => f.id === ind.frecuencia)?.label || ind.frecuencia}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {ind.valorObjetivo} {ind.unidad}
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              {ind.valorActual} {ind.unidad}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={`${
                                Math.abs(ind.desviacion) <= 5 ? 'bg-green-100 text-green-700' :
                                Math.abs(ind.desviacion) <= 15 ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {ind.desviacion > 0 ? '+' : ''}{ind.desviacion.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={`flex items-center gap-1 w-fit mx-auto ${ind.estado.color}`}>
                                <EstadoIcon className="w-3 h-3" />
                                {ind.estado.estado.charAt(0).toUpperCase() + ind.estado.estado.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center w-32">
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={cumplimientoPorcentaje} 
                                  className="h-2 flex-1"
                                />
                                <span className="text-xs font-mono w-10">
                                  {cumplimientoPorcentaje.toFixed(0)}%
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configurar">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-600" />
                    Configuración de Indicadores
                  </CardTitle>
                  <CardDescription>
                    Defina los KPIs y sus valores objetivo
                  </CardDescription>
                </div>
                <Button onClick={handleNuevoIndicador} className="bg-amber-500 hover:bg-amber-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Indicador
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center">
                  <Target className="w-8 h-8 animate-pulse mx-auto text-amber-500" />
                </div>
              ) : indicadores.length === 0 ? (
                <div className="p-8 text-center text-stone-400">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay indicadores configurados</p>
                  <Button onClick={handleNuevoIndicador} variant="outline" className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear primer indicador
                  </Button>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead className="text-right">Objetivo</TableHead>
                        <TableHead className="text-right">Mín.</TableHead>
                        <TableHead className="text-right">Máx.</TableHead>
                        <TableHead>Frecuencia</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {indicadores.map((ind) => (
                        <TableRow key={ind.id} className={!ind.activo ? 'opacity-50' : ''}>
                          <TableCell className="font-medium">{ind.nombre}</TableCell>
                          <TableCell>{ind.unidad}</TableCell>
                          <TableCell className="text-right font-mono">{ind.valorObjetivo}</TableCell>
                          <TableCell className="text-right font-mono">{ind.valorMinimo}</TableCell>
                          <TableCell className="text-right font-mono">{ind.valorMaximo}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {FRECUENCIAS.find(f => f.id === ind.frecuencia)?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={ind.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                              {ind.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEditarIndicador(ind)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEliminarIndicador(ind)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="valores">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-600" />
                    Carga de Valores
                  </CardTitle>
                  <CardDescription>
                    Registre los valores periódicos de cada indicador
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {indicadores.filter(i => i.activo).map((ind) => {
                  const ultimoValor = ind.valores?.[0]
                  const estado = getEstadoIndicador(
                    ultimoValor?.valor || 0, 
                    ind.valorMinimo, 
                    ind.valorMaximo, 
                    ind.valorObjetivo
                  )
                  const EstadoIcon = estado.icon
                  
                  return (
                    <Card key={ind.id} className="border cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => handleNuevoValor(ind)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{ind.nombre}</h4>
                            <p className="text-xs text-stone-500">{ind.descripcion}</p>
                          </div>
                          <Badge variant="outline">
                            {FRECUENCIAS.find(f => f.id === ind.frecuencia)?.label}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-stone-500">Objetivo:</span>
                            <span className="font-mono font-medium">{ind.valorObjetivo} {ind.unidad}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-stone-500">Último valor:</span>
                            <span className={`font-mono font-medium ${
                              ultimoValor ? estado.color.split(' ')[0] : 'text-stone-400'
                            }`}>
                              {ultimoValor ? `${ultimoValor.valor} ${ind.unidad}` : 'Sin datos'}
                            </span>
                          </div>
                          {ultimoValor && (
                            <div className="flex justify-between text-xs text-stone-400">
                              <span>Registrado:</span>
                              <span>{new Date(ultimoValor.fecha).toLocaleDateString('es-AR')}</span>
                            </div>
                          )}
                        </div>
                        
                        <Button 
                          className="w-full mt-4 bg-amber-500 hover:bg-amber-600"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleNuevoValor(ind)
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Cargar Valor
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Nuevo/Editar Indicador */}
      <Dialog open={dialogIndicadorOpen} onOpenChange={setDialogIndicadorOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {indicadorEditando ? 'Editar Indicador' : 'Nuevo Indicador'}
            </DialogTitle>
            <DialogDescription>
              Configure los parámetros del indicador
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={formDataIndicador.nombre}
                onChange={(e) => setFormDataIndicador({ ...formDataIndicador, nombre: e.target.value })}
                placeholder="Ej: Rinde de Faena"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input
                value={formDataIndicador.descripcion}
                onChange={(e) => setFormDataIndicador({ ...formDataIndicador, descripcion: e.target.value })}
                placeholder="Descripción breve del indicador"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unidad</Label>
                <Select 
                  value={formDataIndicador.unidad} 
                  onValueChange={(v) => setFormDataIndicador({ ...formDataIndicador, unidad: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="%">Porcentaje (%)</SelectItem>
                    <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                    <SelectItem value="unidad">Unidad</SelectItem>
                    <SelectItem value="$">Pesos ($)</SelectItem>
                    <SelectItem value="hrs">Horas (hrs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Frecuencia</Label>
                <Select 
                  value={formDataIndicador.frecuencia} 
                  onValueChange={(v) => setFormDataIndicador({ ...formDataIndicador, frecuencia: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FRECUENCIAS.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Valor Objetivo</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formDataIndicador.valorObjetivo || ''}
                  onChange={(e) => setFormDataIndicador({ ...formDataIndicador, valorObjetivo: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Mínimo</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formDataIndicador.valorMinimo || ''}
                  onChange={(e) => setFormDataIndicador({ ...formDataIndicador, valorMinimo: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Máximo</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formDataIndicador.valorMaximo || ''}
                  onChange={(e) => setFormDataIndicador({ ...formDataIndicador, valorMaximo: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="font-mono"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogIndicadorOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleGuardarIndicador} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Cargar Valor */}
      <Dialog open={dialogValorOpen} onOpenChange={setDialogValorOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-600" />
              Cargar Valor
            </DialogTitle>
            <DialogDescription>
              {indicadorSeleccionado?.nombre} - Objetivo: {indicadorSeleccionado?.valorObjetivo} {indicadorSeleccionado?.unidad}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input
                    type="date"
                    value={formDataValor.fecha}
                    onChange={(e) => setFormDataValor({ ...formDataValor, fecha: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Valor *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formDataValor.valor || ''}
                  onChange={(e) => setFormDataValor({ ...formDataValor, valor: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="font-mono"
                />
              </div>
            </div>
            {indicadorSeleccionado && formDataValor.valor > 0 && (
              <div className="p-3 rounded-lg bg-stone-50 border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-600">Estado:</span>
                  <Badge className={getEstadoIndicador(
                    formDataValor.valor, 
                    indicadorSeleccionado.valorMinimo, 
                    indicadorSeleccionado.valorMaximo, 
                    indicadorSeleccionado.valorObjetivo
                  ).color}>
                    {getEstadoIndicador(
                      formDataValor.valor, 
                      indicadorSeleccionado.valorMinimo, 
                      indicadorSeleccionado.valorMaximo, 
                      indicadorSeleccionado.valorObjetivo
                    ).estado}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-stone-600">Desviación:</span>
                  <span className={`text-sm font-mono ${
                    Math.abs(calcularDesviacion(formDataValor.valor, indicadorSeleccionado.valorObjetivo)) <= 5 
                      ? 'text-green-600' 
                      : Math.abs(calcularDesviacion(formDataValor.valor, indicadorSeleccionado.valorObjetivo)) <= 15 
                        ? 'text-amber-600' 
                        : 'text-red-600'
                  }`}>
                    {calcularDesviacion(formDataValor.valor, indicadorSeleccionado.valorObjetivo).toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Input
                value={formDataValor.observaciones}
                onChange={(e) => setFormDataValor({ ...formDataValor, observaciones: e.target.value })}
                placeholder="Notas adicionales..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogValorOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleGuardarValor} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Eliminar Indicador
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar el indicador &quot;{indicadorEditando?.nombre}&quot;?
              Se eliminarán también todos sus valores históricos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmarEliminar} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Indicadores
