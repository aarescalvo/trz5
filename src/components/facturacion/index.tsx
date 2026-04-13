'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, DollarSign, CheckCircle, XCircle, Eye, 
  Plus, Search, Loader2, Printer, RefreshCw, CreditCard,
  Building2, Receipt, Calendar, User, Package
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface Operador { id: string; nombre: string; rol: string }

interface Cliente {
  id: string
  nombre: string
  cuit?: string
  razonSocial?: string
  condicionIva?: string
  direccion?: string
  esUsuarioFaena: boolean
}

interface TipoServicio {
  id: string
  codigo: string
  nombre: string
  unidad: string
  porcentajeIva: number
  activo: boolean
}

interface DetalleFactura {
  id: string
  tipoProducto: string
  descripcion: string
  cantidad: number
  unidad: string
  precioUnitario: number
  subtotal: number
  tipoServicio?: TipoServicio
}

interface PagoFactura {
  id: string
  fecha: string
  monto: number
  metodoPago: string
  referencia?: string
}

interface Factura {
  id: string
  numero: string
  numeroInterno: number
  tipoComprobante: 'FACTURA_A' | 'FACTURA_B' | 'FACTURA_C' | 'REMITO' | 'NOTA_CREDITO' | 'NOTA_DEBITO'
  clienteId: string
  cliente: Cliente
  clienteNombre?: string
  clienteCuit?: string
  clienteCondicionIva?: string
  clienteDireccion?: string
  fecha: string
  subtotal: number
  iva: number
  porcentajeIva: number
  total: number
  saldo: number
  estado: 'PENDIENTE' | 'EMITIDA' | 'PAGADA' | 'ANULADA'
  condicionVenta?: string
  remito?: string
  observaciones?: string
  detalles: DetalleFactura[]
  pagos: PagoFactura[]
  operador?: { id: string; nombre: string }
}

interface Props { operador: Operador }

const TIPOS_COMPROBANTE = [
  { value: 'FACTURA_A', label: 'Factura A', descr: 'Para Responsables Inscriptos' },
  { value: 'FACTURA_B', label: 'Factura B', descr: 'Para Consumidor Final/Monotributo' },
  { value: 'FACTURA_C', label: 'Factura C', descr: 'Para Exentos/No Categorizados' },
]

const METODOS_PAGO = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia Bancaria' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'TARJETA_DEBITO', label: 'Tarjeta Débito' },
  { value: 'TARJETA_CREDITO', label: 'Tarjeta Crédito' },
]

export function FacturacionModule({ operador }: Props) {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [tiposServicio, setTiposServicio] = useState<TipoServicio[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [pagoOpen, setPagoOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'PENDIENTE' | 'EMITIDA' | 'PAGADA' | 'ANULADA'>('TODOS')
  const [searchTerm, setSearchTerm] = useState('')
  const [tabActivo, setTabActivo] = useState('facturas')

  const [formData, setFormData] = useState({
    clienteId: '',
    fecha: new Date().toISOString().split('T')[0],
    condicionVenta: 'CUENTA_CORRIENTE',
    remito: '',
    observaciones: '',
    detalles: [{ tipoServicioId: '', descripcion: '', cantidad: 1, unidad: 'KG', precioUnitario: 0 }]
  })

  const [pagoData, setPagoData] = useState({
    monto: 0,
    metodoPago: 'EFECTIVO',
    referencia: '',
    banco: '',
    observaciones: ''
  })

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [facturasRes, clientesRes, tiposRes] = await Promise.all([
        fetch('/api/facturacion'),
        fetch('/api/clientes'),
        fetch('/api/tipos-servicio?activo=true&seFactura=true')
      ])

      const [facturasData, clientesData, tiposData] = await Promise.all([
        facturasRes.json(),
        clientesRes.json(),
        tiposRes.json()
      ])

      if (facturasData.success) setFacturas(facturasData.data)
      if (clientesData.success) setClientes(clientesData.data.filter((c: Cliente) => c.esUsuarioFaena))
      if (tiposData.success) setTiposServicio(tiposData.data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleNuevaFactura = () => {
    setFormData({
      clienteId: '',
      fecha: new Date().toISOString().split('T')[0],
      condicionVenta: 'CUENTA_CORRIENTE',
      remito: '',
      observaciones: '',
      detalles: [{ tipoServicioId: '', descripcion: '', cantidad: 1, unidad: 'KG', precioUnitario: 0 }]
    })
    setDialogOpen(true)
  }

  const handleAgregarDetalle = () => {
    setFormData({
      ...formData,
      detalles: [...formData.detalles, { tipoServicioId: '', descripcion: '', cantidad: 1, unidad: 'KG', precioUnitario: 0 }]
    })
  }

  const handleEliminarDetalle = (index: number) => {
    if (formData.detalles.length === 1) return
    const nuevosDetalles = formData.detalles.filter((_, i) => i !== index)
    setFormData({ ...formData, detalles: nuevosDetalles })
  }

  const handleDetalleChange = (index: number, field: string, value: any) => {
    const nuevosDetalles = [...formData.detalles]
    nuevosDetalles[index] = { ...nuevosDetalles[index], [field]: value }
    
    // Si cambia el tipo de servicio, actualizar descripción y unidad
    if (field === 'tipoServicioId') {
      const tipo = tiposServicio.find(t => t.id === value)
      if (tipo) {
        nuevosDetalles[index].descripcion = tipo.nombre
        nuevosDetalles[index].unidad = tipo.unidad
      }
    }
    
    setFormData({ ...formData, detalles: nuevosDetalles })
  }

  const handleGuardar = async () => {
    if (!formData.clienteId) {
      toast.error('Debe seleccionar un cliente')
      return
    }

    if (formData.detalles.some(d => !d.descripcion || d.cantidad <= 0)) {
      toast.error('Complete todos los detalles correctamente')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/facturacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          operadorId: operador.id
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`Factura ${data.data.numero} creada exitosamente`)
        setDialogOpen(false)
        fetchAll()
      } else {
        toast.error(data.error || 'Error al crear factura')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al crear factura')
    } finally {
      setSaving(false)
    }
  }

  const handleMarcarPagada = async (factura: Factura) => {
    try {
      const res = await fetch('/api/facturacion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: factura.id, estado: 'PAGADA' })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Factura ${factura.numero} marcada como pagada`)
        fetchAll()
      }
    } catch {
      toast.error('Error al actualizar estado')
    }
  }

  const handleRegistrarPago = async () => {
    if (!facturaSeleccionada || pagoData.monto <= 0) {
      toast.error('Ingrese un monto válido')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/cuenta-corriente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facturaId: facturaSeleccionada.id,
          ...pagoData,
          operadorId: operador.id
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Pago registrado exitosamente')
        setPagoOpen(false)
        setPagoData({ monto: 0, metodoPago: 'EFECTIVO', referencia: '', banco: '', observaciones: '' })
        fetchAll()
      } else {
        toast.error(data.error || 'Error al registrar pago')
      }
    } catch {
      toast.error('Error al registrar pago')
    } finally {
      setSaving(false)
    }
  }

  const handleAnular = async () => {
    if (!facturaSeleccionada) return
    setSaving(true)
    try {
      const res = await fetch(`/api/facturacion?id=${facturaSeleccionada.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success(`Factura ${facturaSeleccionada.numero} anulada`)
        setDeleteOpen(false)
        fetchAll()
      } else {
        toast.error(data.error || 'Error al anular')
      }
    } catch {
      toast.error('Error al anular factura')
    } finally {
      setSaving(false)
    }
  }

  const handleImprimir = (factura: Factura) => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const tipoLabel = TIPOS_COMPROBANTE.find(t => t.value === factura.tipoComprobante)?.label || 'Factura'
      printWindow.document.write(`<!DOCTYPE html>
<html><head><title>Comprobante ${factura.numero}</title>
<style>
body{font-family:Arial;padding:40px;max-width:800px;margin:0 auto}
.header{text-align:center;border-bottom:2px solid #333;padding-bottom:20px;margin-bottom:30px}
.title{font-size:24px;font-weight:bold}
.row{display:flex;margin-bottom:8px}
.label{font-weight:bold;width:200px;color:#555}
.value{flex:1}
.total{font-size:20px;font-weight:bold;margin-top:20px;text-align:right}
table{width:100%;border-collapse:collapse;margin-top:20px}
th,td{border:1px solid #ddd;padding:8px;text-align:left}
th{background:#f5f5f5}
</style></head>
<body>
<div class="header">
<div class="title">${tipoLabel}</div>
<div>N° ${factura.numero}</div>
</div>
<div class="row"><span class="label">Fecha:</span><span class="value">${new Date(factura.fecha).toLocaleDateString('es-AR')}</span></div>
<div class="row"><span class="label">Cliente:</span><span class="value">${factura.clienteNombre || factura.cliente?.nombre}</span></div>
<div class="row"><span class="label">CUIT:</span><span class="value">${factura.clienteCuit || '-'}</span></div>
<div class="row"><span class="label">Condición IVA:</span><span class="value">${factura.clienteCondicionIva || '-'}</span></div>
<div class="row"><span class="label">Dirección:</span><span class="value">${factura.clienteDireccion || '-'}</span></div>
<table>
<thead><tr><th>Descripción</th><th>Cantidad</th><th>Unidad</th><th>P. Unit.</th><th>Subtotal</th></tr></thead>
<tbody>
${factura.detalles?.map(d => `<tr>
<td>${d.descripcion}</td>
<td>${d.cantidad}</td>
<td>${d.unidad}</td>
<td>$${d.precioUnitario.toLocaleString('es-AR', {minimumFractionDigits:2})}</td>
<td>$${d.subtotal.toLocaleString('es-AR', {minimumFractionDigits:2})}</td>
</tr>`).join('') || ''}
</tbody>
</table>
<div class="total">
<p>Subtotal: $${factura.subtotal?.toLocaleString('es-AR', {minimumFractionDigits:2}) || '0.00'}</p>
${factura.iva > 0 ? `<p>IVA (${factura.porcentajeIva}%): $${factura.iva?.toLocaleString('es-AR', {minimumFractionDigits:2})}</p>` : ''}
<p style="font-size:24px">Total: $${factura.total?.toLocaleString('es-AR', {minimumFractionDigits:2}) || '0.00'}</p>
</div>
</body></html>`)
      printWindow.document.close()
      printWindow.print()
    }
    toast.success('Enviando a impresión...')
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return <Badge className="bg-amber-100 text-amber-700">Pendiente</Badge>
      case 'EMITIDA': return <Badge className="bg-blue-100 text-blue-700">Emitida</Badge>
      case 'PAGADA': return <Badge className="bg-emerald-100 text-emerald-700">Pagada</Badge>
      case 'ANULADA': return <Badge className="bg-red-100 text-red-700">Anulada</Badge>
      default: return <Badge>{estado}</Badge>
    }
  }

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(amount)

  const facturasFiltradas = facturas.filter(f => {
    const matchEstado = filtroEstado === 'TODOS' || f.estado === filtroEstado
    const matchSearch = !searchTerm || 
      f.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.cliente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.clienteNombre?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchEstado && matchSearch
  })

  const totalFacturas = facturas.length
  const pendientes = facturas.filter(f => f.estado === 'PENDIENTE').length
  const pagadas = facturas.filter(f => f.estado === 'PAGADA').length
  const montoTotal = facturas.filter(f => f.estado !== 'ANULADA').reduce((sum, f) => sum + (f.total || 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <Receipt className="w-8 h-8 text-amber-500" />
              Facturación
            </h1>
            <p className="text-stone-500 mt-1">Gestión de facturas y cuenta corriente</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchAll} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" /> Actualizar
            </Button>
            <Button onClick={handleNuevaFactura} className="bg-amber-500 hover:bg-amber-600">
              <Plus className="w-4 h-4 mr-2" /> Nueva Factura
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={tabActivo} onValueChange={setTabActivo} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="facturas">Facturas</TabsTrigger>
            <TabsTrigger value="cuentas">Cuenta Corriente</TabsTrigger>
          </TabsList>

          {/* TAB FACTURAS */}
          <TabsContent value="facturas" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltroEstado('TODOS')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-stone-100 rounded-lg"><FileText className="w-5 h-5 text-stone-600" /></div>
                    <div><p className="text-xs text-stone-500 uppercase">Total Facturas</p><p className="text-2xl font-bold text-stone-800">{totalFacturas}</p></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltroEstado('PENDIENTE')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 rounded-lg"><DollarSign className="w-5 h-5 text-amber-600" /></div>
                    <div><p className="text-xs text-stone-500 uppercase">Pendientes</p><p className="text-2xl font-bold text-amber-600">{pendientes}</p></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltroEstado('PAGADA')}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg"><CheckCircle className="w-5 h-5 text-emerald-600" /></div>
                    <div><p className="text-xs text-stone-500 uppercase">Pagadas</p><p className="text-2xl font-bold text-emerald-600">{pagadas}</p></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-stone-100 rounded-lg"><DollarSign className="w-5 h-5 text-stone-600" /></div>
                    <div><p className="text-xs text-stone-500 uppercase">Monto Total</p><p className="text-lg font-bold text-stone-800">{formatCurrency(montoTotal)}</p></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filtros */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <Input placeholder="Buscar por número o cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                  </div>
                  <Select value={filtroEstado} onValueChange={(v) => setFiltroEstado(v as typeof filtroEstado)}>
                    <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Filtrar por estado" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos los estados</SelectItem>
                      <SelectItem value="PENDIENTE">Pendientes</SelectItem>
                      <SelectItem value="EMITIDA">Emitidas</SelectItem>
                      <SelectItem value="PAGADA">Pagadas</SelectItem>
                      <SelectItem value="ANULADA">Anuladas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tabla de Facturas */}
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" /> Listado de Comprobantes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
                ) : facturasFiltradas.length === 0 ? (
                  <div className="py-12 text-center text-stone-400">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No hay comprobantes que mostrar</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-semibold">Número</TableHead>
                          <TableHead className="font-semibold">Fecha</TableHead>
                          <TableHead className="font-semibold">Cliente</TableHead>
                          <TableHead className="font-semibold">Tipo</TableHead>
                          <TableHead className="font-semibold">Total</TableHead>
                          <TableHead className="font-semibold">Saldo</TableHead>
                          <TableHead className="font-semibold">Estado</TableHead>
                          <TableHead className="font-semibold text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {facturasFiltradas.map((factura) => (
                          <TableRow key={factura.id} className={factura.estado === 'ANULADA' ? 'opacity-50' : ''}>
                            <TableCell className="font-mono font-medium">{factura.numero}</TableCell>
                            <TableCell>{new Date(factura.fecha).toLocaleDateString('es-AR')}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{factura.clienteNombre || factura.cliente?.nombre}</p>
                                {factura.clienteCuit && <p className="text-xs text-stone-500">CUIT: {factura.clienteCuit}</p>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{TIPOS_COMPROBANTE.find(t => t.value === factura.tipoComprobante)?.label || factura.tipoComprobante}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">{formatCurrency(factura.total)}</TableCell>
                            <TableCell className={factura.saldo > 0 ? 'text-amber-600 font-medium' : ''}>
                              {formatCurrency(factura.saldo)}
                            </TableCell>
                            <TableCell>{getEstadoBadge(factura.estado)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => { setFacturaSeleccionada(factura); setViewOpen(true) }} title="Ver detalle"><Eye className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleImprimir(factura)} title="Imprimir" disabled={factura.estado === 'ANULADA'}><Printer className="w-4 h-4" /></Button>
                                {factura.estado === 'PENDIENTE' && (
                                  <>
                                    <Button variant="ghost" size="icon" onClick={() => { setFacturaSeleccionada(factura); setPagoData({ ...pagoData, monto: factura.saldo }); setPagoOpen(true) }} title="Registrar pago" className="text-emerald-600"><CreditCard className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleMarcarPagada(factura)} title="Marcar pagada" className="text-emerald-600"><CheckCircle className="w-4 h-4" /></Button>
                                  </>
                                )}
                                {factura.estado !== 'ANULADA' && factura.estado !== 'PAGADA' && (
                                  <Button variant="ghost" size="icon" onClick={() => { setFacturaSeleccionada(factura); setDeleteOpen(true) }} title="Anular" className="text-red-500"><XCircle className="w-4 h-4" /></Button>
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
          </TabsContent>

          {/* TAB CUENTA CORRIENTE */}
          <TabsContent value="cuentas">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-amber-500" />Cuenta Corriente por Cliente</CardTitle>
                <CardDescription>Seleccione un cliente para ver su estado de cuenta</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-stone-500 text-center py-8">Seleccione un cliente del listado para ver su estado de cuenta detallado</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog Nueva Factura */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-amber-600" />Nueva Factura</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cliente *</Label>
                  <Select value={formData.clienteId} onValueChange={(v) => setFormData({ ...formData, clienteId: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                    <SelectContent>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre} {c.razonSocial ? `(${c.razonSocial})` : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} />
                </div>
              </div>

              {/* Detalles */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Detalles de Factura</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAgregarDetalle}><Plus className="w-4 h-4 mr-1" />Agregar</Button>
                </div>
                <div className="space-y-3">
                  {formData.detalles.map((detalle, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 p-3 bg-stone-50 rounded-lg">
                      <div className="col-span-3">
                        <Select value={detalle.tipoServicioId} onValueChange={(v) => handleDetalleChange(index, 'tipoServicioId', v)}>
                          <SelectTrigger className="h-9"><SelectValue placeholder="Servicio" /></SelectTrigger>
                          <SelectContent>
                            {tiposServicio.map((t) => (
                              <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Input placeholder="Descripción" value={detalle.descripcion} onChange={(e) => handleDetalleChange(index, 'descripcion', e.target.value)} className="h-9" />
                      </div>
                      <div className="col-span-2">
                        <Input type="number" placeholder="Cant." value={detalle.cantidad || ''} onChange={(e) => handleDetalleChange(index, 'cantidad', parseFloat(e.target.value) || 0)} className="h-9" />
                      </div>
                      <div className="col-span-2">
                        <Input type="number" placeholder="Precio" value={detalle.precioUnitario || ''} onChange={(e) => handleDetalleChange(index, 'precioUnitario', parseFloat(e.target.value) || 0)} className="h-9" />
                      </div>
                      <div className="col-span-1 flex items-center">
                        <Badge variant="outline">{detalle.unidad}</Badge>
                      </div>
                      <div className="col-span-1 flex items-center justify-end">
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleEliminarDetalle(index)} disabled={formData.detalles.length === 1}><XCircle className="w-4 h-4 text-red-500" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observaciones */}
              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea value={formData.observaciones} onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })} placeholder="Notas adicionales..." rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleGuardar} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                {saving ? 'Guardando...' : 'Crear Factura'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Ver Detalle */}
        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Eye className="w-5 h-5 text-amber-600" />Detalle de Factura</DialogTitle>
            </DialogHeader>
            {facturaSeleccionada && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-stone-500">Número</p><p className="font-mono font-medium">{facturaSeleccionada.numero}</p></div>
                  <div><p className="text-sm text-stone-500">Tipo</p><p>{TIPOS_COMPROBANTE.find(t => t.value === facturaSeleccionada.tipoComprobante)?.label}</p></div>
                  <div><p className="text-sm text-stone-500">Fecha</p><p>{new Date(facturaSeleccionada.fecha).toLocaleDateString('es-AR')}</p></div>
                  <div><p className="text-sm text-stone-500">Estado</p>{getEstadoBadge(facturaSeleccionada.estado)}</div>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm text-stone-500 mb-2">Cliente</p>
                  <p className="font-medium">{facturaSeleccionada.clienteNombre || facturaSeleccionada.cliente?.nombre}</p>
                  {facturaSeleccionada.clienteCuit && <p className="text-sm text-stone-500">CUIT: {facturaSeleccionada.clienteCuit}</p>}
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm text-stone-500 mb-2">Detalles</p>
                  <Table>
                    <TableHeader><TableRow><TableHead>Descripción</TableHead><TableHead>Cant.</TableHead><TableHead>P. Unit.</TableHead><TableHead>Subtotal</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {facturaSeleccionada.detalles?.map((d, i) => (
                        <TableRow key={i}>
                          <TableCell>{d.descripcion}</TableCell>
                          <TableCell>{d.cantidad} {d.unidad}</TableCell>
                          <TableCell>{formatCurrency(d.precioUnitario)}</TableCell>
                          <TableCell>{formatCurrency(d.subtotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="border-t pt-4 space-y-1">
                  <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(facturaSeleccionada.subtotal)}</span></div>
                  {facturaSeleccionada.iva > 0 && <div className="flex justify-between"><span>IVA ({facturaSeleccionada.porcentajeIva}%):</span><span>{formatCurrency(facturaSeleccionada.iva)}</span></div>}
                  <div className="flex justify-between font-bold text-lg"><span>Total:</span><span>{formatCurrency(facturaSeleccionada.total)}</span></div>
                  {facturaSeleccionada.saldo > 0 && <div className="flex justify-between text-amber-600"><span>Saldo Pendiente:</span><span>{formatCurrency(facturaSeleccionada.saldo)}</span></div>}
                </div>
                {facturaSeleccionada.pagos && facturaSeleccionada.pagos.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-stone-500 mb-2">Pagos Registrados</p>
                    {facturaSeleccionada.pagos.map((p, i) => (
                      <div key={i} className="flex justify-between text-sm py-1">
                        <span>{new Date(p.fecha).toLocaleDateString('es-AR')} - {p.metodoPago} {p.referencia && `(${p.referencia})`}</span>
                        <span className="text-emerald-600">{formatCurrency(p.monto)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewOpen(false)}>Cerrar</Button>
              <Button onClick={() => { handleImprimir(facturaSeleccionada!); setViewOpen(false); }}><Printer className="w-4 h-4 mr-2" />Imprimir</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Pago */}
        <Dialog open={pagoOpen} onOpenChange={setPagoOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-amber-600" />Registrar Pago</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-700">Saldo pendiente: <strong>{formatCurrency(facturaSeleccionada?.saldo || 0)}</strong></p>
              </div>
              <div className="space-y-2">
                <Label>Monto a pagar *</Label>
                <Input type="number" value={pagoData.monto || ''} onChange={(e) => setPagoData({ ...pagoData, monto: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Método de pago</Label>
                <Select value={pagoData.metodoPago} onValueChange={(v) => setPagoData({ ...pagoData, metodoPago: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {METODOS_PAGO.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {pagoData.metodoPago === 'TRANSFERENCIA' && (
                <div className="space-y-2">
                  <Label>Referencia / N° Comprobante</Label>
                  <Input value={pagoData.referencia} onChange={(e) => setPagoData({ ...pagoData, referencia: e.target.value })} placeholder="N° de transferencia" />
                </div>
              )}
              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Input value={pagoData.observaciones} onChange={(e) => setPagoData({ ...pagoData, observaciones: e.target.value })} placeholder="Notas opcionales" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPagoOpen(false)}>Cancelar</Button>
              <Button onClick={handleRegistrarPago} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                Registrar Pago
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Anular */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle className="text-red-600 flex items-center gap-2"><XCircle className="w-5 h-5" />Anular Factura</DialogTitle></DialogHeader>
            <p className="text-sm text-stone-500">¿Está seguro que desea anular la factura {facturaSeleccionada?.numero}? Esta acción no se puede deshacer.</p>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
              <Button onClick={handleAnular} disabled={saving} className="bg-red-600 hover:bg-red-700">{saving ? 'Anulando...' : 'Anular Factura'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default FacturacionModule
