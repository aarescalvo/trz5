'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { 
  Truck, Loader2, RefreshCw, Plus, Search, Eye, CheckCircle, 
  Package, AlertCircle, Printer, Trash2
} from 'lucide-react'
import { TextoEditable, EditableBlock, useEditor } from '@/components/ui/editable-screen'

// Interfaces
interface Expedicion {
  id: string
  numero: number
  fecha: string
  destino: string
  direccionDestino?: string
  clienteId?: string
  cliente?: {
    id: string
    nombre: string
    cuit?: string
  }
  patenteCamion?: string
  patenteAcoplado?: string
  chofer?: string
  choferDni?: string
  transportista?: string
  remito?: string
  numeroPrecintos?: string
  cantidadPallets: number
  cantidadCajas: number
  kgTotal: number
  estado: string
  observaciones?: string
  operador?: {
    id: string
    nombre: string
  }
  pallets?: Pallet[]
}

interface Pallet {
  id: string
  numero: number
  cantidadCajas: number
  pesoTotal: number
  estado: string
  expedicionId?: string
  destino?: string
  cajas?: CajaEmpaque[]
}

interface CajaEmpaque {
  id: string
  codigoBarras: string
  producto?: {
    id: string
    codigo: string
    nombre: string
  }
  pesoNeto: number
  unidades: number
}

interface Cliente {
  id: string
  nombre: string
  cuit?: string
}

interface Operador {
  id: string
  nombre: string
  rol: string
  permisos?: Record<string, boolean>
}

interface Props {
  operador: Operador
}

const ESTADOS_EXPEDICION = [
  { id: 'PENDIENTE', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'EN_CARGA', label: 'En Carga', color: 'bg-blue-100 text-blue-700' },
  { id: 'DESPACHADO', label: 'Despachado', color: 'bg-green-100 text-green-700' },
  { id: 'ENTREGADO', label: 'Entregado', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'ANULADO', label: 'Anulado', color: 'bg-red-100 text-red-700' },
]

export function ExpedicionCiclo2Module({ operador }: Props) {
  const { editMode, getTexto } = useEditor()
  const [loading, setLoading] = useState(true)
  const [expediciciones, setExpediciones] = useState<Expedicion[]>([])
  const [palletsDisponibles, setPalletsDisponibles] = useState<Pallet[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  
  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('TODOS')
  const [busqueda, setBusqueda] = useState('')
  
  // Dialogs
  const [dialogNuevoOpen, setDialogNuevoOpen] = useState(false)
  const [dialogDetalleOpen, setDialogDetalleOpen] = useState(false)
  const [dialogPalletsOpen, setDialogPalletsOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Forms
  const [formExpedicion, setFormExpedicion] = useState({
    destino: '',
    direccionDestino: '',
    clienteId: '',
    patenteCamion: '',
    patenteAcoplado: '',
    chofer: '',
    choferDni: '',
    transportista: '',
    remito: '',
    numeroPrecintos: '',
    observaciones: ''
  })
  const [selectedPallets, setSelectedPallets] = useState<string[]>([])
  const [selectedExpedicion, setSelectedExpedicion] = useState<Expedicion | null>(null)
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    enCarga: 0,
    despachadas: 0,
    totalPallets: 0,
    totalCajas: 0,
    kgTotal: 0
  })

  // Cargar datos
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Cargar expediciones
      const resExpediciones = await fetch('/api/expedicion-ciclo2')
      const dataExpediciones = await resExpediciones.json()
      
      if (dataExpediciones.success) {
        setExpediciones(dataExpediciones.data)
        setStats(dataExpediciones.stats)
      }

      // Cargar pallets disponibles (completos y sin expedición)
      const resPallets = await fetch('/api/pallet?estado=COMPLETO')
      const dataPallets = await resPallets.json()
      if (dataPallets.success) {
        // Filtrar los que no tienen expedición asignada
        const disponibles = dataPallets.data.filter((p: Pallet) => !p.expedicionId)
        setPalletsDisponibles(disponibles)
      }

      // Cargar clientes
      const resClientes = await fetch('/api/clientes')
      const dataClientes = await resClientes.json()
      if (dataClientes.success) {
        setClientes(dataClientes.data)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  // Crear nueva expedición
  const handleCrearExpedicion = async () => {
    if (!formExpedicion.destino) {
      toast.error('El destino es obligatorio')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/expedicion-ciclo2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formExpedicion,
          operadorId: operador.id,
          palletIds: selectedPallets
        })
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success(`Expedición #${data.data.numero} creada correctamente`)
        setDialogNuevoOpen(false)
        setFormExpedicion({
          destino: '',
          direccionDestino: '',
          clienteId: '',
          patenteCamion: '',
          patenteAcoplado: '',
          chofer: '',
          choferDni: '',
          transportista: '',
          remito: '',
          numeroPrecintos: '',
          observaciones: ''
        })
        setSelectedPallets([])
        fetchData()
      } else {
        toast.error(data.error || 'Error al crear expedición')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  // Cambiar estado
  const handleCambiarEstado = async (id: string, nuevoEstado: string) => {
    try {
      const res = await fetch('/api/expedicion-ciclo2', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, estado: nuevoEstado })
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success('Estado actualizado')
        fetchData()
      } else {
        toast.error(data.error || 'Error al actualizar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    }
  }

  // Ver detalle
  const handleVerDetalle = async (expedicion: Expedicion) => {
    try {
      const res = await fetch(`/api/expedicion-ciclo2?id=${expedicion.id}`)
      const data = await res.json()
      
      if (data.success) {
        setSelectedExpedicion(data.data)
        setDialogDetalleOpen(true)
      }
    } catch (error) {
      toast.error('Error al cargar detalle')
    }
  }

  // Toggle selección de pallet
  const togglePallet = (id: string) => {
    setSelectedPallets(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  // Badge de estado
  const getEstadoBadge = (estado: string) => {
    const info = ESTADOS_EXPEDICION.find(e => e.id === estado)
    return (
      <Badge className={info?.color || 'bg-gray-100'}>
        {info?.label || estado}
      </Badge>
    )
  }

  // Filtrar expediciones
  const expedicionesFiltradas = expediciones.filter(e => {
    if (filtroEstado !== 'TODOS' && e.estado !== filtroEstado) return false
    if (!busqueda) return true
    const busquedaLower = busqueda.toLowerCase()
    return (
      e.numero.toString().includes(busquedaLower) ||
      e.destino?.toLowerCase().includes(busquedaLower) ||
      e.cliente?.nombre?.toLowerCase().includes(busquedaLower) ||
      e.remito?.toLowerCase().includes(busquedaLower)
    )
  })

  // Formatear fecha
  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR')
  }

  // Formatear peso
  const formatPeso = (kg: number) => `${kg.toFixed(2)} kg`

  // Calcular totales de pallets seleccionados
  const palletsSeleccionados = palletsDisponibles.filter(p => selectedPallets.includes(p.id))
  const totalCajasSeleccionadas = palletsSeleccionados.reduce((acc, p) => acc + p.cantidadCajas, 0)
  const totalPesoSeleccionado = palletsSeleccionados.reduce((acc, p) => acc + p.pesoTotal, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <EditableBlock bloqueId="header" label="Encabezado">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
                <Truck className="w-8 h-8 text-amber-500" />
                <TextoEditable id="expedicion-ciclo2-titulo" original="Expedición Ciclo II" tag="span" />
              </h1>
              <p className="text-stone-500 mt-1">
                <TextoEditable id="expedicion-ciclo2-subtitulo" original="Despacho de pallets y productos terminados" tag="span" />
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setDialogNuevoOpen(true)} className="bg-amber-500 hover:bg-amber-600">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Expedición
              </Button>
              <Button onClick={fetchData} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </div>
        </EditableBlock>

        {/* Stats */}
        <EditableBlock bloqueId="stats" label="Estadísticas">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltroEstado('PENDIENTE')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Pendientes</p>
                    <p className="text-xl font-bold">{stats.pendientes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltroEstado('EN_CARGA')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">En Carga</p>
                    <p className="text-xl font-bold">{stats.enCarga}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltroEstado('DESPACHADO')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Truck className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Despachadas</p>
                    <p className="text-xl font-bold">{stats.despachadas}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-stone-100 p-2 rounded-lg">
                    <Package className="w-5 h-5 text-stone-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Total Pallets</p>
                    <p className="text-xl font-bold">{stats.totalPallets}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <Package className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">KG Total</p>
                    <p className="text-xl font-bold">{formatPeso(stats.kgTotal)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </EditableBlock>

        {/* Filtros */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label className="text-xs">Buscar</Label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <Input
                    className="pl-9"
                    placeholder="Número, destino, cliente, remito..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-48">
                <Label className="text-xs">Estado</Label>
                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    {ESTADOS_EXPEDICION.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-500" />
              Expediciones
            </CardTitle>
            <CardDescription>
              {expedicionesFiltradas.length} de {expediciones.length} expediciones
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : expedicionesFiltradas.length === 0 ? (
              <div className="py-12 text-center text-stone-400">
                <Truck className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No hay expediciones para mostrar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-stone-50/50">
                      <TableHead>N°</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Pallets</TableHead>
                      <TableHead>Cajas</TableHead>
                      <TableHead>KG</TableHead>
                      <TableHead>Transporte</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-32"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expedicionesFiltradas.map((exp) => (
                      <TableRow key={exp.id} className="hover:bg-stone-50">
                        <TableCell className="font-bold">#{exp.numero}</TableCell>
                        <TableCell>{formatFecha(exp.fecha)}</TableCell>
                        <TableCell className="font-medium">{exp.destino}</TableCell>
                        <TableCell>{exp.cliente?.nombre || '-'}</TableCell>
                        <TableCell>{exp.cantidadPallets}</TableCell>
                        <TableCell>{exp.cantidadCajas}</TableCell>
                        <TableCell className="font-medium">{formatPeso(exp.kgTotal)}</TableCell>
                        <TableCell>
                          {exp.patenteCamion ? (
                            <span className="font-mono text-sm">{exp.patenteCamion}</span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>{getEstadoBadge(exp.estado)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleVerDetalle(exp)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {exp.estado === 'PENDIENTE' && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleCambiarEstado(exp.id, 'EN_CARGA')}
                                className="text-blue-600"
                              >
                                <Package className="w-4 h-4" />
                              </Button>
                            )}
                            {exp.estado === 'EN_CARGA' && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleCambiarEstado(exp.id, 'DESPACHADO')}
                                className="text-green-600"
                              >
                                <Truck className="w-4 h-4" />
                              </Button>
                            )}
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

        {/* Pallets disponibles */}
        {palletsDisponibles.length > 0 && (
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-green-500" />
                Pallets Disponibles para Despacho
              </CardTitle>
              <CardDescription>
                {palletsDisponibles.length} pallets completos sin asignar
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-stone-50/50">
                    <TableHead>N° Pallet</TableHead>
                    <TableHead>Cajas</TableHead>
                    <TableHead>Peso Total</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {palletsDisponibles.slice(0, 5).map((pallet) => (
                    <TableRow key={pallet.id}>
                      <TableCell className="font-medium">#{pallet.numero}</TableCell>
                      <TableCell>{pallet.cantidadCajas}</TableCell>
                      <TableCell>{formatPeso(pallet.pesoTotal)}</TableCell>
                      <TableCell>{pallet.destino || '-'}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-700">Disponible</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog: Nueva Expedición */}
      <Dialog open={dialogNuevoOpen} onOpenChange={setDialogNuevoOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-500" />
              Nueva Expedición
            </DialogTitle>
            <DialogDescription>
              Complete los datos para crear una nueva expedición
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Destino *</Label>
                <Input
                  value={formExpedicion.destino}
                  onChange={(e) => setFormExpedicion({...formExpedicion, destino: e.target.value})}
                  placeholder="Destino de la expedición"
                />
              </div>
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={formExpedicion.clienteId} onValueChange={(v) => setFormExpedicion({...formExpedicion, clienteId: v})}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                  <SelectContent>
                    {clientes.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dirección Destino</Label>
              <Input
                value={formExpedicion.direccionDestino}
                onChange={(e) => setFormExpedicion({...formExpedicion, direccionDestino: e.target.value})}
                placeholder="Dirección completa"
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Patente Camión</Label>
                <Input
                  value={formExpedicion.patenteCamion}
                  onChange={(e) => setFormExpedicion({...formExpedicion, patenteCamion: e.target.value.toUpperCase()})}
                  placeholder="AB123CD"
                  maxLength={10}
                />
              </div>
              <div className="space-y-2">
                <Label>Patente Acoplado</Label>
                <Input
                  value={formExpedicion.patenteAcoplado}
                  onChange={(e) => setFormExpedicion({...formExpedicion, patenteAcoplado: e.target.value.toUpperCase()})}
                  placeholder="AB123CD"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Chofer</Label>
                <Input
                  value={formExpedicion.chofer}
                  onChange={(e) => setFormExpedicion({...formExpedicion, chofer: e.target.value})}
                  placeholder="Nombre del chofer"
                />
              </div>
              <div className="space-y-2">
                <Label>DNI Chofer</Label>
                <Input
                  value={formExpedicion.choferDni}
                  onChange={(e) => setFormExpedicion({...formExpedicion, choferDni: e.target.value})}
                  placeholder="12345678"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Transportista</Label>
                <Input
                  value={formExpedicion.transportista}
                  onChange={(e) => setFormExpedicion({...formExpedicion, transportista: e.target.value})}
                  placeholder="Empresa transportista"
                />
              </div>
              <div className="space-y-2">
                <Label>N° Remito</Label>
                <Input
                  value={formExpedicion.remito}
                  onChange={(e) => setFormExpedicion({...formExpedicion, remito: e.target.value})}
                  placeholder="Número de remito"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>N° Precintos</Label>
              <Input
                value={formExpedicion.numeroPrecintos}
                onChange={(e) => setFormExpedicion({...formExpedicion, numeroPrecintos: e.target.value})}
                placeholder="Números de precinto separados por coma"
              />
            </div>

            <Separator />

            {/* Selección de pallets */}
            <div className="space-y-2">
              <Label>Pallets a Incluir</Label>
              {palletsDisponibles.length === 0 ? (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-700">
                    No hay pallets disponibles para despachar
                  </p>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>N°</TableHead>
                        <TableHead>Cajas</TableHead>
                        <TableHead>Peso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {palletsDisponibles.map((pallet) => (
                        <TableRow key={pallet.id} className="cursor-pointer" onClick={() => togglePallet(pallet.id)}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedPallets.includes(pallet.id)}
                              onChange={() => togglePallet(pallet.id)}
                              className="w-4 h-4"
                            />
                          </TableCell>
                          <TableCell>#{pallet.numero}</TableCell>
                          <TableCell>{pallet.cantidadCajas}</TableCell>
                          <TableCell>{formatPeso(pallet.pesoTotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {selectedPallets.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-700">
                    <strong>{selectedPallets.length}</strong> pallets seleccionados - 
                    <strong> {totalCajasSeleccionadas}</strong> cajas - 
                    <strong> {formatPeso(totalPesoSeleccionado)}</strong>
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                value={formExpedicion.observaciones}
                onChange={(e) => setFormExpedicion({...formExpedicion, observaciones: e.target.value})}
                placeholder="Observaciones..."
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogNuevoOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCrearExpedicion}
              disabled={saving || !formExpedicion.destino}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Crear Expedición
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalle de Expedición */}
      <Dialog open={dialogDetalleOpen} onOpenChange={setDialogDetalleOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-500" />
              Detalle de Expedición
            </DialogTitle>
          </DialogHeader>
          
          {selectedExpedicion && (
            <div className="space-y-4">
              <div className="p-4 bg-stone-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-stone-500">Expedición</p>
                    <p className="text-2xl font-bold">#{selectedExpedicion.numero}</p>
                  </div>
                  {getEstadoBadge(selectedExpedicion.estado)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-stone-500">Fecha</p>
                  <p className="font-medium">{formatFecha(selectedExpedicion.fecha)}</p>
                </div>
                <div>
                  <p className="text-sm text-stone-500">Destino</p>
                  <p className="font-medium">{selectedExpedicion.destino}</p>
                </div>
                <div>
                  <p className="text-sm text-stone-500">Cliente</p>
                  <p className="font-medium">{selectedExpedicion.cliente?.nombre || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-stone-500">Dirección</p>
                  <p className="font-medium">{selectedExpedicion.direccionDestino || '-'}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-stone-500 mb-2">Transporte</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-stone-400">Camión:</span> {selectedExpedicion.patenteCamion || '-'}</div>
                  <div><span className="text-stone-400">Acoplado:</span> {selectedExpedicion.patenteAcoplado || '-'}</div>
                  <div><span className="text-stone-400">Chofer:</span> {selectedExpedicion.chofer || '-'}</div>
                  <div><span className="text-stone-400">DNI:</span> {selectedExpedicion.choferDni || '-'}</div>
                  <div><span className="text-stone-400">Transportista:</span> {selectedExpedicion.transportista || '-'}</div>
                  <div><span className="text-stone-400">Remito:</span> {selectedExpedicion.remito || '-'}</div>
                  <div><span className="text-stone-400">Precintos:</span> {selectedExpedicion.numeroPrecintos || '-'}</div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-stone-500 mb-2">Resumen</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-stone-50 rounded-lg text-center">
                    <p className="text-2xl font-bold">{selectedExpedicion.cantidadPallets}</p>
                    <p className="text-xs text-stone-500">Pallets</p>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-lg text-center">
                    <p className="text-2xl font-bold">{selectedExpedicion.cantidadCajas}</p>
                    <p className="text-xs text-stone-500">Cajas</p>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-lg text-center">
                    <p className="text-2xl font-bold">{formatPeso(selectedExpedicion.kgTotal)}</p>
                    <p className="text-xs text-stone-500">KG Total</p>
                  </div>
                </div>
              </div>

              {selectedExpedicion.pallets && selectedExpedicion.pallets.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-stone-500 mb-2">Pallets Incluidos</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>N° Pallet</TableHead>
                          <TableHead>Cajas</TableHead>
                          <TableHead>Peso</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedExpedicion.pallets.map((pallet) => (
                          <TableRow key={pallet.id}>
                            <TableCell>#{pallet.numero}</TableCell>
                            <TableCell>{pallet.cantidadCajas}</TableCell>
                            <TableCell>{formatPeso(pallet.pesoTotal)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}

              {selectedExpedicion.observaciones && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-stone-500">Observaciones</p>
                    <p className="text-sm">{selectedExpedicion.observaciones}</p>
                  </div>
                </>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogDetalleOpen(false)}>
              Cerrar
            </Button>
            {selectedExpedicion && selectedExpedicion.estado === 'PENDIENTE' && (
              <Button 
                onClick={() => {
                  handleCambiarEstado(selectedExpedicion.id, 'EN_CARGA')
                  setDialogDetalleOpen(false)
                }}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Package className="w-4 h-4 mr-2" />
                Iniciar Carga
              </Button>
            )}
            {selectedExpedicion && selectedExpedicion.estado === 'EN_CARGA' && (
              <Button 
                onClick={() => {
                  handleCambiarEstado(selectedExpedicion.id, 'DESPACHADO')
                  setDialogDetalleOpen(false)
                }}
                className="bg-green-500 hover:bg-green-600"
              >
                <Truck className="w-4 h-4 mr-2" />
                Despachar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ExpedicionCiclo2Module
