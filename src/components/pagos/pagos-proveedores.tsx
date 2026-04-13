'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  CreditCard, Plus, Search, Printer, Eye, FileText,
  Building2, CheckCircle, Clock, XCircle, Calendar, DollarSign
} from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Proveedor {
  id: string
  nombre: string
  cuit?: string
  telefono?: string
}

interface FacturaPendiente {
  id: string
  numero: string
  fecha: string
  total: number
  saldoPendiente: number
  estado: string
}

interface FormaPago {
  id: string
  nombre: string
  tipo: string
  requiereCheque: boolean
}

interface Cheque {
  id: string
  numero: string
  banco: string
  monto: number
  fechaVencimiento: string
  estado: string
  libradorNombre: string
}

interface Pago {
  id: string
  numero: number
  terceroNombre: string
  terceroCuit?: string
  terceroTipo: string
  monto: number
  fecha: string
  estado: string
  formaPago?: { nombre: string; tipo: string }
  cheque?: { numero: string; banco: string }
  comprobante?: string
  observaciones?: string
  aplicaciones?: {
    id: string
    monto: number
    factura: {
      numero: string
      total: number
    }
  }[]
}

export function PagosProveedores({ operador }: { operador: Operador }) {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [facturasPendientes, setFacturasPendientes] = useState<FacturaPendiente[]>([])
  const [formasPago, setFormasPago] = useState<FormaPago[]>([])
  const [chequesDisponibles, setChequesDisponibles] = useState<Cheque[]>([])
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detalleDialogOpen, setDetalleDialogOpen] = useState(false)
  const [pagoSeleccionado, setPagoSeleccionado] = useState<Pago | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    proveedorId: '',
    monto: 0,
    formaPagoId: '',
    chequeId: '',
    fecha: new Date().toISOString().split('T')[0],
    comprobante: '',
    observaciones: '',
  })

  // Facturas seleccionadas para aplicar el pago
  const [facturasSeleccionadas, setFacturasSeleccionadas] = useState<Map<string, number>>(new Map())

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [proveedoresRes, formasPagoRes, chequesRes, pagosRes] = await Promise.all([
        fetch('/api/proveedores'),
        fetch('/api/formas-pago'),
        fetch('/api/cheques?estado=RECIBIDO'),
        fetch('/api/pagos?terceroTipo=PROVEEDOR'),
      ])

      if (proveedoresRes.ok) {
        const data = await proveedoresRes.json()
        setProveedores(data.data || data || [])
      }
      if (formasPagoRes.ok) {
        const data = await formasPagoRes.json()
        setFormasPago(data.data || data || [])
      }
      if (chequesRes.ok) {
        const data = await chequesRes.json()
        setChequesDisponibles(data.data || data || [])
      }
      if (pagosRes.ok) {
        const data = await pagosRes.json()
        setPagos(data.data || data || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFacturasProveedor = async (proveedorId: string) => {
    try {
      // Buscar facturas pendientes del proveedor
      const res = await fetch(`/api/facturacion?estado=EMITIDA`)
      if (res.ok) {
        const data = await res.json()
        // Filtrar facturas pendientes de pago (simulado)
        const pendientes = (data.data || data || []).map((f: FacturaPendiente) => ({
          ...f,
          saldoPendiente: f.total // En una implementación real, calcular según pagos aplicados
        }))
        setFacturasPendientes(pendientes)
      }
    } catch (error) {
      console.error('Error fetching facturas:', error)
    }
  }

  const handleProveedorChange = (proveedorId: string) => {
    setFormData({ ...formData, proveedorId, chequeId: '' })
    setFacturasSeleccionadas(new Map())
    if (proveedorId) {
      fetchFacturasProveedor(proveedorId)
    } else {
      setFacturasPendientes([])
    }
  }

  const handleFormaPagoChange = (formaPagoId: string) => {
    const forma = formasPago.find(f => f.id === formaPagoId)
    setFormData({
      ...formData,
      formaPagoId,
      chequeId: forma?.requiereCheque ? formData.chequeId : ''
    })
  }

  const toggleFacturaSeleccion = (factura: FacturaPendiente) => {
    const newSelection = new Map(facturasSeleccionadas)
    if (newSelection.has(factura.id)) {
      newSelection.delete(factura.id)
    } else {
      newSelection.set(factura.id, factura.saldoPendiente)
    }
    setFacturasSeleccionadas(newSelection)
  }

  const actualizarMontoAplicado = (facturaId: string, monto: number) => {
    const newSelection = new Map(facturasSeleccionadas)
    newSelection.set(facturaId, monto)
    setFacturasSeleccionadas(newSelection)
  }

  const totalAplicado = Array.from(facturasSeleccionadas.values()).reduce((sum, monto) => sum + monto, 0)

  const handleSavePago = async () => {
    if (!formData.proveedorId) {
      toast.error('Seleccione un proveedor')
      return
    }
    if (formData.monto <= 0) {
      toast.error('Ingrese un monto válido')
      return
    }
    if (!formData.formaPagoId) {
      toast.error('Seleccione una forma de pago')
      return
    }

    const proveedor = proveedores.find(p => p.id === formData.proveedorId)
    if (!proveedor) return

    try {
      const res = await fetch('/api/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          terceroId: formData.proveedorId,
          terceroNombre: proveedor.nombre,
          terceroCuit: proveedor.cuit,
          terceroTipo: 'PROVEEDOR',
          monto: formData.monto,
          formaPagoId: formData.formaPagoId,
          chequeId: formData.chequeId || null,
          fecha: formData.fecha,
          comprobante: formData.comprobante,
          observaciones: formData.observaciones,
          operadorId: operador.id,
          estado: 'CONFIRMADO'
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Pago registrado correctamente')
        setDialogOpen(false)
        resetForm()
        fetchData()
      } else {
        toast.error(data.error || 'Error al registrar pago')
      }
    } catch (error) {
      console.error('Error al guardar:', error)
      toast.error('Error al registrar pago')
    }
  }

  const resetForm = () => {
    setFormData({
      proveedorId: '',
      monto: 0,
      formaPagoId: '',
      chequeId: '',
      fecha: new Date().toISOString().split('T')[0],
      comprobante: '',
      observaciones: '',
    })
    setFacturasSeleccionadas(new Map())
    setFacturasPendientes([])
  }

  const verDetallePago = (pago: Pago) => {
    setPagoSeleccionado(pago)
    setDetalleDialogOpen(true)
  }

  const imprimirOrdenPago = (pago: Pago) => {
    // Crear contenido para imprimir
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Orden de Pago #${pago.numero}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
          .info-item { margin-bottom: 10px; }
          .label { font-weight: bold; color: #666; }
          .value { font-size: 16px; }
          .total { font-size: 24px; font-weight: bold; text-align: right; margin-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          @media print { body { print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">ORDEN DE PAGO</div>
          <div>N° ${String(pago.numero).padStart(8, '0')}</div>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <div class="label">Proveedor:</div>
            <div class="value">${pago.terceroNombre}</div>
          </div>
          <div class="info-item">
            <div class="label">CUIT:</div>
            <div class="value">${pago.terceroCuit || '-'}</div>
          </div>
          <div class="info-item">
            <div class="label">Fecha:</div>
            <div class="value">${new Date(pago.fecha).toLocaleDateString('es-AR')}</div>
          </div>
          <div class="info-item">
            <div class="label">Forma de Pago:</div>
            <div class="value">${pago.formaPago?.nombre || '-'}</div>
          </div>
        </div>
        <div class="total">
          MONTO: $${pago.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </div>
        ${pago.cheque ? `
          <div style="margin-top: 20px; padding: 10px; border: 1px solid #ddd;">
            <strong>Cheque:</strong> N° ${pago.cheque.numero} - Banco: ${pago.cheque.banco}
          </div>
        ` : ''}
        ${pago.observaciones ? `
          <div style="margin-top: 20px;">
            <strong>Observaciones:</strong> ${pago.observaciones}
          </div>
        ` : ''}
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'CONFIRMADO':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Confirmado</Badge>
      case 'PENDIENTE':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>
      case 'ANULADO':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Anulado</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  const pagosFiltrados = pagos.filter(p =>
    p.terceroNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(p.numero).includes(searchTerm)
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-stone-500">Cargando datos...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Pagados Hoy</p>
                <p className="text-xl font-bold">
                  ${pagos.filter(p => new Date(p.fecha).toDateString() === new Date().toDateString() && p.estado === 'CONFIRMADO')
                    .reduce((sum, p) => sum + p.monto, 0).toLocaleString('es-AR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-600 p-2 rounded-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Confirmados</p>
                <p className="text-xl font-bold">{pagos.filter(p => p.estado === 'CONFIRMADO').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-500 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Pendientes</p>
                <p className="text-xl font-bold">{pagos.filter(p => p.estado === 'PENDIENTE').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Proveedores</p>
                <p className="text-xl font-bold">{proveedores.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Pagos */}
      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Pagos a Proveedores
            </CardTitle>
            <CardDescription>Historial de pagos realizados</CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <Input
                className="pl-9 w-64"
                placeholder="Buscar por proveedor o número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Pago
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pagosFiltrados.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay pagos registrados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Pago</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Forma de Pago</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagosFiltrados.map((pago) => (
                  <TableRow key={pago.id}>
                    <TableCell className="font-mono font-medium">
                      #{String(pago.numero).padStart(6, '0')}
                    </TableCell>
                    <TableCell>
                      {new Date(pago.fecha).toLocaleDateString('es-AR')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{pago.terceroNombre}</p>
                        {pago.terceroCuit && (
                          <p className="text-xs text-stone-500">CUIT: {pago.terceroCuit}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{pago.formaPago?.nombre || '-'}</p>
                        {pago.cheque && (
                          <p className="text-xs text-stone-500">
                            Cheque: {pago.cheque.numero} - {pago.cheque.banco}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${pago.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{getEstadoBadge(pago.estado)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => verDetallePago(pago)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => imprimirOrdenPago(pago)}>
                        <Printer className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Nuevo Pago */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Nuevo Pago a Proveedor</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4 overflow-y-auto flex-1">
            {/* Selección de Proveedor */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Proveedor *</Label>
                <Select
                  value={formData.proveedorId}
                  onValueChange={handleProveedorChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {proveedores.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre} {p.cuit ? `(${p.cuit})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                />
              </div>
            </div>

            {/* Monto y Forma de Pago */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Monto *</Label>
                <Input
                  type="number"
                  value={formData.monto || ''}
                  onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Forma de Pago *</Label>
                <Select
                  value={formData.formaPagoId}
                  onValueChange={handleFormaPagoChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {formasPago.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selección de Cheque (si aplica) */}
            {formData.formaPagoId && formasPago.find(f => f.id === formData.formaPagoId)?.requiereCheque && (
              <div>
                <Label>Cheque</Label>
                <Select
                  value={formData.chequeId}
                  onValueChange={(v) => setFormData({ ...formData, chequeId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cheque" />
                  </SelectTrigger>
                  <SelectContent>
                    {chequesDisponibles.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        N° {c.numero} - {c.banco} - ${c.monto.toLocaleString()} - Venc: {new Date(c.fechaVencimiento).toLocaleDateString('es-AR')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Comprobante */}
            <div>
              <Label>N° Comprobante / Referencia</Label>
              <Input
                value={formData.comprobante}
                onChange={(e) => setFormData({ ...formData, comprobante: e.target.value })}
                placeholder="Número de transferencia, recibo, etc."
              />
            </div>

            {/* Observaciones */}
            <div>
              <Label>Observaciones</Label>
              <Textarea
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Notas adicionales..."
                rows={2}
              />
            </div>

            {/* Facturas Pendientes (si hay proveedor seleccionado) */}
            {formData.proveedorId && facturasPendientes.length > 0 && (
              <div>
                <Label className="mb-2 block">Aplicar a Facturas (Opcional)</Label>
                <ScrollArea className="h-48 border rounded-md">
                  <Table size="sm">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Factura</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                        <TableHead className="text-right">Aplicar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {facturasPendientes.map((factura) => (
                        <TableRow key={factura.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={facturasSeleccionadas.has(factura.id)}
                              onChange={() => toggleFacturaSeleccion(factura)}
                              className="rounded"
                            />
                          </TableCell>
                          <TableCell className="font-medium">{factura.numero}</TableCell>
                          <TableCell>{new Date(factura.fecha).toLocaleDateString('es-AR')}</TableCell>
                          <TableCell className="text-right">
                            ${factura.saldoPendiente.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right">
                            {facturasSeleccionadas.has(factura.id) && (
                              <Input
                                type="number"
                                className="w-24 ml-auto"
                                value={facturasSeleccionadas.get(factura.id) || 0}
                                onChange={(e) => actualizarMontoAplicado(factura.id, parseFloat(e.target.value) || 0)}
                                max={factura.saldoPendiente}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
                <div className="flex justify-between mt-2 text-sm">
                  <span>Total a aplicar:</span>
                  <span className="font-medium">${totalAplicado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePago} className="bg-amber-500 hover:bg-amber-600">
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalle Pago */}
      <Dialog open={detalleDialogOpen} onOpenChange={setDetalleDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle del Pago</DialogTitle>
          </DialogHeader>
          {pagoSeleccionado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-stone-500">N° Pago</Label>
                  <p className="font-mono font-bold text-lg">
                    #{String(pagoSeleccionado.numero).padStart(6, '0')}
                  </p>
                </div>
                <div>
                  <Label className="text-stone-500">Estado</Label>
                  <div>{getEstadoBadge(pagoSeleccionado.estado)}</div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-stone-500">Proveedor</Label>
                  <p className="font-medium">{pagoSeleccionado.terceroNombre}</p>
                  {pagoSeleccionado.terceroCuit && (
                    <p className="text-sm text-stone-500">CUIT: {pagoSeleccionado.terceroCuit}</p>
                  )}
                </div>
                <div>
                  <Label className="text-stone-500">Fecha</Label>
                  <p>{new Date(pagoSeleccionado.fecha).toLocaleDateString('es-AR')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-stone-500">Forma de Pago</Label>
                  <p>{pagoSeleccionado.formaPago?.nombre || '-'}</p>
                </div>
                <div>
                  <Label className="text-stone-500">Monto</Label>
                  <p className="text-xl font-bold text-green-600">
                    ${pagoSeleccionado.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {pagoSeleccionado.cheque && (
                <div className="bg-stone-50 p-3 rounded-lg">
                  <Label className="text-stone-500">Cheque</Label>
                  <p>N° {pagoSeleccionado.cheque.numero} - Banco: {pagoSeleccionado.cheque.banco}</p>
                </div>
              )}

              {pagoSeleccionado.comprobante && (
                <div>
                  <Label className="text-stone-500">Comprobante</Label>
                  <p>{pagoSeleccionado.comprobante}</p>
                </div>
              )}

              {pagoSeleccionado.observaciones && (
                <div>
                  <Label className="text-stone-500">Observaciones</Label>
                  <p className="text-sm">{pagoSeleccionado.observaciones}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => imprimirOrdenPago(pagoSeleccionado)}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PagosProveedores
