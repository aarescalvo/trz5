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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Package, Loader2, RefreshCw, Search, Barcode, Eye, Printer,
  TrendingUp, AlertTriangle, CheckCircle, Truck, PackageX
} from 'lucide-react'
import { TextoEditable, EditableBlock, useEditor } from '@/components/ui/editable-screen'

// Interfaces
interface CajaEmpaque {
  id: string
  codigoBarras: string
  codigoArticulo: string
  codigoEspecie: string
  codigoTipificacion: string
  codigoTrabajo: string
  codigoTransporte: string
  codigoDestino: string
  fechaProduccion: string
  loteNumero: number
  unidades: number
  pesoNeto: number
  pesoBruto: number
  numeradorCaja: number
  fechaVencimiento?: string
  estado: string
  observaciones?: string
  producto?: {
    id: string
    codigo: string
    nombre: string
    tara?: number | null
    diasConservacion?: number | null
  }
  lote?: {
    id: string
    numero: number
    anio: number
    estado: string
  }
  propietario?: {
    id: string
    nombre: string
  }
  camara?: {
    id: string
    nombre: string
  }
  pallet?: {
    id: string
    numero: number
    estado: string
  }
  operador?: {
    id: string
    nombre: string
  }
}

interface Producto {
  id: string
  codigo: string
  nombre: string
  especie: string
}

interface Camara {
  id: string
  nombre: string
  tipo: string
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

const ESTADOS_CAJA = [
  { id: 'EN_CAMARA', label: 'En Cámara', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'EN_PALLETS', label: 'En Pallet', color: 'bg-blue-100 text-blue-700' },
  { id: 'DESPACHADA', label: 'Despachada', color: 'bg-green-100 text-green-700' },
  { id: 'ANULADA', label: 'Anulada', color: 'bg-red-100 text-red-700' },
]

export function StockEmpaqueModule({ operador }: Props) {
  const { editMode, getTexto } = useEditor()
  const [loading, setLoading] = useState(true)
  const [cajas, setCajas] = useState<CajaEmpaque[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [camaras, setCamaras] = useState<Camara[]>([])
  
  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('EN_CAMARA')
  const [filtroProducto, setFiltroProducto] = useState('TODOS')
  const [filtroCamara, setFiltroCamara] = useState('TODOS')
  const [busqueda, setBusqueda] = useState('')
  
  // Dialogs
  const [dialogDetalleOpen, setDialogDetalleOpen] = useState(false)
  const [dialogCodigoOpen, setDialogCodigoOpen] = useState(false)
  
  // Forms
  const [selectedCaja, setSelectedCaja] = useState<CajaEmpaque | null>(null)
  const [codigoBarrasInput, setCodigoBarrasInput] = useState('')
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    enCamara: 0,
    enPallets: 0,
    despachadas: 0,
    pesoNetoTotal: 0,
    proximasVencer: 0
  })

  // Agrupación por producto
  const [agrupacionProductos, setAgrupacionProductos] = useState<{
    producto: string
    cantidad: number
    pesoTotal: number
  }[]>([])

  // Cargar datos
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Cargar cajas
      const resCajas = await fetch('/api/caja-empaque')
      const dataCajas = await resCajas.json()
      
      if (dataCajas.success) {
        setCajas(dataCajas.data)
        setStats(dataCajas.stats)
        
        // Calcular agrupación por producto
        const agrupacion: Record<string, { cantidad: number; pesoTotal: number }> = {}
        dataCajas.data.forEach((c: CajaEmpaque) => {
          const nombre = c.producto?.nombre || 'Sin producto'
          if (!agrupacion[nombre]) {
            agrupacion[nombre] = { cantidad: 0, pesoTotal: 0 }
          }
          agrupacion[nombre].cantidad++
          agrupacion[nombre].pesoTotal += c.pesoNeto
        })
        
        setAgrupacionProductos(
          Object.entries(agrupacion).map(([producto, data]) => ({
            producto,
            cantidad: data.cantidad,
            pesoTotal: data.pesoTotal
          })).sort((a, b) => b.cantidad - a.cantidad)
        )
      }

      // Cargar productos
      const resProductos = await fetch('/api/productos')
      const dataProductos = await resProductos.json()
      if (dataProductos.success) {
        setProductos(dataProductos.data.filter((p: Producto) => p.activo !== false))
      }

      // Cargar cámaras
      const resCamaras = await fetch('/api/camaras')
      const dataCamaras = await resCamaras.json()
      if (dataCamaras.success) {
        setCamaras(dataCamaras.data)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  // Buscar por código de barras
  const handleBuscarCodigo = () => {
    if (!codigoBarrasInput) return
    
    const caja = cajas.find(c => c.codigoBarras === codigoBarrasInput)
    if (caja) {
      setSelectedCaja(caja)
      setDialogDetalleOpen(true)
      setDialogCodigoOpen(false)
      setCodigoBarrasInput('')
    } else {
      toast.error('Caja no encontrada')
    }
  }

  // Ver detalle
  const handleVerDetalle = (caja: CajaEmpaque) => {
    setSelectedCaja(caja)
    setDialogDetalleOpen(true)
  }

  // Imprimir etiqueta
  const handleImprimir = (caja: CajaEmpaque) => {
    toast.info(`Imprimiendo etiqueta: ${caja.codigoBarras}`)
  }

  // Badge de estado
  const getEstadoBadge = (estado: string) => {
    const info = ESTADOS_CAJA.find(e => e.id === estado)
    return (
      <Badge className={info?.color || 'bg-gray-100'}>
        {info?.label || estado}
      </Badge>
    )
  }

  // Filtrar cajas
  const cajasFiltradas = cajas.filter(c => {
    if (filtroEstado !== 'TODOS' && c.estado !== filtroEstado) return false
    if (filtroProducto !== 'TODOS' && c.producto?.id !== filtroProducto) return false
    if (filtroCamara !== 'TODOS' && c.camara?.id !== filtroCamara) return false
    if (!busqueda) return true
    const busquedaLower = busqueda.toLowerCase()
    return (
      c.codigoBarras.toLowerCase().includes(busquedaLower) ||
      c.producto?.nombre?.toLowerCase().includes(busquedaLower) ||
      c.lote?.numero?.toString().includes(busquedaLower)
    )
  })

  // Formatear fecha
  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR')
  }

  // Formatear peso
  const formatPeso = (kg: number) => `${kg.toFixed(2)} kg`

  // Verificar si está próxima a vencer (7 días o menos)
  const isProximaVencer = (fechaVencimiento?: string) => {
    if (!fechaVencimiento) return false
    const vence = new Date(fechaVencimiento)
    const hoy = new Date()
    const diff = vence.getTime() - hoy.getTime()
    const dias = diff / (1000 * 60 * 60 * 24)
    return dias <= 7 && dias > 0
  }

  // Verificar si ya venció
  const isVencida = (fechaVencimiento?: string) => {
    if (!fechaVencimiento) return false
    const vence = new Date(fechaVencimiento)
    const hoy = new Date()
    return vence < hoy
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <EditableBlock bloqueId="header" label="Encabezado">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
                <Package className="w-8 h-8 text-amber-500" />
                <TextoEditable id="stock-empaque-titulo" original="Stock Empaque" tag="span" />
              </h1>
              <p className="text-stone-500 mt-1">
                <TextoEditable id="stock-empaque-subtitulo" original="Control de stock de productos empacados - Ciclo II" tag="span" />
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setDialogCodigoOpen(true)} variant="outline">
                <Barcode className="w-4 h-4 mr-2" />
                Buscar Código
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
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltroEstado('EN_CAMARA')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <Package className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">En Cámara</p>
                    <p className="text-xl font-bold">{stats.enCamara}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltroEstado('EN_PALLETS')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">En Pallets</p>
                    <p className="text-xl font-bold">{stats.enPallets}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltroEstado('DESPACHADA')}>
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
                    <TrendingUp className="w-5 h-5 text-stone-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Peso Total</p>
                    <p className="text-xl font-bold">{formatPeso(stats.pesoNetoTotal)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Próx. Vencer</p>
                    <p className="text-xl font-bold text-orange-600">{stats.proximasVencer}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </EditableBlock>

        {/* Tabs */}
        <Tabs defaultValue="stock" className="space-y-4">
          <TabsList className="bg-stone-100">
            <TabsTrigger value="stock">Stock</TabsTrigger>
            <TabsTrigger value="agrupado">Por Producto</TabsTrigger>
          </TabsList>

          <TabsContent value="stock" className="space-y-4">
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
                        placeholder="Código, producto, lote..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="w-40">
                    <Label className="text-xs">Estado</Label>
                    <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODOS">Todos</SelectItem>
                        {ESTADOS_CAJA.map(e => (
                          <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-48">
                    <Label className="text-xs">Producto</Label>
                    <Select value={filtroProducto} onValueChange={setFiltroProducto}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODOS">Todos</SelectItem>
                        {productos.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.codigo} - {p.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-40">
                    <Label className="text-xs">Cámara</Label>
                    <Select value={filtroCamara} onValueChange={setFiltroCamara}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODOS">Todas</SelectItem>
                        {camaras.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
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
                  <Package className="w-5 h-5 text-amber-500" />
                  Cajas en Stock
                </CardTitle>
                <CardDescription>
                  {cajasFiltradas.length} de {cajas.length} cajas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  </div>
                ) : cajasFiltradas.length === 0 ? (
                  <div className="py-12 text-center text-stone-400">
                    <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No hay cajas para mostrar</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-96">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-stone-50/50">
                          <TableHead>Código de Barras</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Lote</TableHead>
                          <TableHead>Uds</TableHead>
                          <TableHead>P. Neto</TableHead>
                          <TableHead>Cámara</TableHead>
                          <TableHead>Vencimiento</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="w-24"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cajasFiltradas.map((caja) => (
                          <TableRow 
                            key={caja.id} 
                            className={`hover:bg-stone-50 ${
                              isVencida(caja.fechaVencimiento) ? 'bg-red-50' :
                              isProximaVencer(caja.fechaVencimiento) ? 'bg-orange-50' : ''
                            }`}
                          >
                            <TableCell className="font-mono text-xs">{caja.codigoBarras}</TableCell>
                            <TableCell className="font-medium">{caja.producto?.nombre || '-'}</TableCell>
                            <TableCell>{caja.lote?.numero || '-'}</TableCell>
                            <TableCell>{caja.unidades}</TableCell>
                            <TableCell className="font-medium">{formatPeso(caja.pesoNeto)}</TableCell>
                            <TableCell>{caja.camara?.nombre || '-'}</TableCell>
                            <TableCell>
                              {caja.fechaVencimiento ? (
                                <span className={`text-sm ${
                                  isVencida(caja.fechaVencimiento) ? 'text-red-600 font-medium' :
                                  isProximaVencer(caja.fechaVencimiento) ? 'text-orange-600' : ''
                                }`}>
                                  {formatFecha(caja.fechaVencimiento)}
                                  {isVencida(caja.fechaVencimiento) && (
                                    <Badge className="ml-1 bg-red-100 text-red-700 text-xs">Vencida</Badge>
                                  )}
                                  {isProximaVencer(caja.fechaVencimiento) && !isVencida(caja.fechaVencimiento) && (
                                    <AlertTriangle className="w-3 h-3 inline ml-1 text-orange-500" />
                                  )}
                                </span>
                              ) : '-'}
                            </TableCell>
                            <TableCell>{getEstadoBadge(caja.estado)}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleVerDetalle(caja)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleImprimir(caja)}
                                  disabled={caja.estado === 'ANULADA'}
                                >
                                  <Printer className="w-4 h-4" />
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

          <TabsContent value="agrupado">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg">
                <CardTitle className="text-lg">Stock por Producto</CardTitle>
                <CardDescription>
                  {agrupacionProductos.length} productos diferentes
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-stone-50/50">
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-right">Cajas</TableHead>
                        <TableHead className="text-right">Peso Total</TableHead>
                        <TableHead className="text-right">Peso Promedio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agrupacionProductos.map((item, index) => (
                        <TableRow key={index} className="hover:bg-stone-50">
                          <TableCell className="font-medium">{item.producto}</TableCell>
                          <TableCell className="text-right">{item.cantidad}</TableCell>
                          <TableCell className="text-right font-medium">{formatPeso(item.pesoTotal)}</TableCell>
                          <TableCell className="text-right text-stone-500">
                            {formatPeso(item.pesoTotal / item.cantidad)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog: Buscar por código */}
      <Dialog open={dialogCodigoOpen} onOpenChange={setDialogCodigoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Barcode className="w-5 h-5 text-amber-500" />
              Buscar por Código de Barras
            </DialogTitle>
            <DialogDescription>
              Escanee o ingrese el código de barras de la caja
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Código de Barras</Label>
              <Input
                value={codigoBarrasInput}
                onChange={(e) => setCodigoBarrasInput(e.target.value)}
                placeholder="Escanear o ingresar..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleBuscarCodigo()
                }}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogCodigoOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleBuscarCodigo}
              disabled={!codigoBarrasInput}
              className="bg-amber-500 hover:bg-amber-600"
            >
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalle de Caja */}
      <Dialog open={dialogDetalleOpen} onOpenChange={setDialogDetalleOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Barcode className="w-5 h-5 text-amber-500" />
              Detalle de Caja
            </DialogTitle>
          </DialogHeader>
          
          {selectedCaja && (
            <div className="space-y-4">
              <div className="p-3 bg-stone-50 rounded-lg">
                <p className="text-xs text-stone-500 mb-1">Código de Barras</p>
                <p className="font-mono text-lg font-bold">{selectedCaja.codigoBarras}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-stone-500">Producto</p>
                  <p className="font-medium">{selectedCaja.producto?.nombre || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-stone-500">Lote</p>
                  <p className="font-medium">{selectedCaja.lote?.numero}/{selectedCaja.lote?.anio}</p>
                </div>
                <div>
                  <p className="text-sm text-stone-500">Unidades</p>
                  <p className="font-medium">{selectedCaja.unidades}</p>
                </div>
                <div>
                  <p className="text-sm text-stone-500">Peso Neto</p>
                  <p className="font-medium">{formatPeso(selectedCaja.pesoNeto)}</p>
                </div>
                <div>
                  <p className="text-sm text-stone-500">Peso Bruto</p>
                  <p className="font-medium">{formatPeso(selectedCaja.pesoBruto)}</p>
                </div>
                <div>
                  <p className="text-sm text-stone-500">Estado</p>
                  {getEstadoBadge(selectedCaja.estado)}
                </div>
                <div>
                  <p className="text-sm text-stone-500">Fecha Producción</p>
                  <p className="font-medium">{formatFecha(selectedCaja.fechaProduccion)}</p>
                </div>
                <div>
                  <p className="text-sm text-stone-500">Fecha Vencimiento</p>
                  <p className={`font-medium ${
                    isVencida(selectedCaja.fechaVencimiento) ? 'text-red-600' :
                    isProximaVencer(selectedCaja.fechaVencimiento) ? 'text-orange-600' : ''
                  }`}>
                    {selectedCaja.fechaVencimiento ? formatFecha(selectedCaja.fechaVencimiento) : '-'}
                    {isVencida(selectedCaja.fechaVencimiento) && ' (Vencida)'}
                    {isProximaVencer(selectedCaja.fechaVencimiento) && !isVencida(selectedCaja.fechaVencimiento) && ' (Próxima)'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-stone-500">Cámara</p>
                  <p className="font-medium">{selectedCaja.camara?.nombre || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-stone-500">Pallet</p>
                  <p className="font-medium">
                    {selectedCaja.pallet ? `#${selectedCaja.pallet.numero}` : '-'}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-stone-500 mb-2">Códigos de Barras (Parte Fija)</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-stone-50 rounded">
                    <span className="text-stone-400">Artículo:</span>
                    <span className="font-mono ml-1">{selectedCaja.codigoArticulo}</span>
                  </div>
                  <div className="p-2 bg-stone-50 rounded">
                    <span className="text-stone-400">Especie:</span>
                    <span className="font-mono ml-1">{selectedCaja.codigoEspecie}</span>
                  </div>
                  <div className="p-2 bg-stone-50 rounded">
                    <span className="text-stone-400">Tipif:</span>
                    <span className="font-mono ml-1">{selectedCaja.codigoTipificacion}</span>
                  </div>
                </div>
              </div>

              {selectedCaja.observaciones && (
                <div>
                  <p className="text-sm text-stone-500">Observaciones</p>
                  <p className="text-sm">{selectedCaja.observaciones}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogDetalleOpen(false)}>
              Cerrar
            </Button>
            {selectedCaja && selectedCaja.estado !== 'ANULADA' && (
              <Button onClick={() => handleImprimir(selectedCaja)} className="bg-amber-500 hover:bg-amber-600">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default StockEmpaqueModule
