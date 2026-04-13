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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Users, Plus, Search, Printer, Eye, FileText,
  Building2, CheckCircle, Clock, XCircle, Calendar, DollarSign,
  Receipt, Banknote, CreditCard as CreditCardIcon, Landmark
} from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Cliente {
  id: string
  nombre: string
  cuit?: string
  telefono?: string
  email?: string
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

interface Cobranza {
  id: string
  numero: number
  terceroNombre: string
  terceroCuit?: string
  terceroTipo: string
  monto: number
  fecha: string
  estado: string
  formaPago?: { nombre: string; tipo: string }
  cheque?: { numero: string; banco: string; monto: number }
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

export function CobranzasClientes({ operador }: { operador: Operador }) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [facturasPendientes, setFacturasPendientes] = useState<FacturaPendiente[]>([])
  const [formasPago, setFormasPago] = useState<FormaPago[]>([])
  const [cobranzas, setCobranzas] = useState<Cobranza[]>([])
  const [chequesRecibidos, setChequesRecibidos] = useState<Cheque[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detalleDialogOpen, setDetalleDialogOpen] = useState(false)
  const [cobranzaSeleccionada, setCobranzaSeleccionada] = useState<Cobranza | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    clienteId: '',
    monto: 0,
    formaPagoId: '',
    numeroCheque: '',
    bancoCheque: '',
    montoCheque: 0,
    fechaVencimientoCheque: '',
    libradorNombre: '',
    libradorCuit: '',
    fecha: new Date().toISOString().split('T')[0],
    comprobante: '',
    observaciones: '',
  })

  // Facturas seleccionadas para aplicar la cobranza
  const [facturasSeleccionadas, setFacturasSeleccionadas] = useState<Map<string, number>>(new Map())

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [clientesRes, formasPagoRes, cobranzasRes, chequesRes] = await Promise.all([
        fetch('/api/usuarios'),
        fetch('/api/formas-pago'),
        fetch('/api/pagos?terceroTipo=CLIENTE'),
        fetch('/api/cheques?estado=RECIBIDO'),
      ])

      if (clientesRes.ok) {
        const data = await clientesRes.json()
        setClientes(data.data || data || [])
      }
      if (formasPagoRes.ok) {
        const data = await formasPagoRes.json()
        setFormasPago(data.data || data || [])
      }
      if (cobranzasRes.ok) {
        const data = await cobranzasRes.json()
        setCobranzas(data.data || data || [])
      }
      if (chequesRes.ok) {
        const data = await chequesRes.json()
        setChequesRecibidos(data.data || data || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFacturasCliente = async (clienteId: string) => {
    try {
      const res = await fetch(`/api/facturacion?clienteId=${clienteId}&estado=EMITIDA`)
      if (res.ok) {
        const data = await res.json()
        const pendientes = (data.data || data || []).map((f: FacturaPendiente) => ({
          ...f,
          saldoPendiente: f.total
        }))
        setFacturasPendientes(pendientes)
      }
    } catch (error) {
      console.error('Error fetching facturas:', error)
    }
  }

  const handleClienteChange = (clienteId: string) => {
    setFormData({ ...formData, clienteId })
    setFacturasSeleccionadas(new Map())
    if (clienteId) {
      fetchFacturasCliente(clienteId)
      const cliente = clientes.find(c => c.id === clienteId)
      if (cliente) {
        setFormData(prev => ({
          ...prev,
          clienteId,
          libradorNombre: cliente.nombre,
          libradorCuit: cliente.cuit || ''
        }))
      }
    } else {
      setFacturasPendientes([])
    }
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

  const handleSaveCobranza = async () => {
    if (!formData.clienteId) {
      toast.error('Seleccione un cliente')
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

    const cliente = clientes.find(c => c.id === formData.clienteId)
    if (!cliente) return

    try {
      // Si es cheque, primero crear el cheque
      let chequeId = null
      const formaPago = formasPago.find(f => f.id === formData.formaPagoId)
      
      if (formaPago?.requiereCheque && formData.numeroCheque) {
        const chequeRes = await fetch('/api/cheques', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            numero: formData.numeroCheque,
            banco: formData.bancoCheque,
            monto: formData.montoCheque || formData.monto,
            fechaEmision: formData.fecha,
            fechaVencimiento: formData.fechaVencimientoCheque || formData.fecha,
            libradorNombre: formData.libradorNombre,
            libradorCuit: formData.libradorCuit,
            estado: 'RECIBIDO'
          }),
        })
        
        const chequeData = await chequeRes.json()
        if (chequeData.success) {
          chequeId = chequeData.data.id
        }
      }

      const res = await fetch('/api/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          terceroId: formData.clienteId,
          terceroNombre: cliente.nombre,
          terceroCuit: cliente.cuit,
          terceroTipo: 'CLIENTE',
          monto: formData.monto,
          formaPagoId: formData.formaPagoId,
          chequeId,
          fecha: formData.fecha,
          comprobante: formData.comprobante,
          observaciones: formData.observaciones,
          operadorId: operador.id,
          estado: 'CONFIRMADO'
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Cobranza registrada correctamente')
        setDialogOpen(false)
        resetForm()
        fetchData()
      } else {
        toast.error(data.error || 'Error al registrar cobranza')
      }
    } catch (error) {
      console.error('Error al guardar:', error)
      toast.error('Error al registrar cobranza')
    }
  }

  const resetForm = () => {
    setFormData({
      clienteId: '',
      monto: 0,
      formaPagoId: '',
      numeroCheque: '',
      bancoCheque: '',
      montoCheque: 0,
      fechaVencimientoCheque: '',
      libradorNombre: '',
      libradorCuit: '',
      fecha: new Date().toISOString().split('T')[0],
      comprobante: '',
      observaciones: '',
    })
    setFacturasSeleccionadas(new Map())
    setFacturasPendientes([])
  }

  const verDetalleCobranza = (cobranza: Cobranza) => {
    setCobranzaSeleccionada(cobranza)
    setDetalleDialogOpen(true)
  }

  const imprimirRecibo = (cobranza: Cobranza) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Recibo de Cobranza #${cobranza.numero}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .title { font-size: 28px; font-weight: bold; text-transform: uppercase; }
          .recibo-numero { font-size: 18px; color: #666; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; }
          .info-item { margin-bottom: 8px; }
          .label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
          .value { font-size: 16px; }
          .total-box { background: #f5f5f5; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px; }
          .total-label { font-size: 14px; color: #666; }
          .total-value { font-size: 32px; font-weight: bold; color: #059669; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          @media print { body { print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Recibo de Cobranza</div>
          <div class="recibo-numero">N° ${String(cobranza.numero).padStart(8, '0')}</div>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <div class="label">Cliente</div>
            <div class="value">${cobranza.terceroNombre}</div>
          </div>
          <div class="info-item">
            <div class="label">CUIT</div>
            <div class="value">${cobranza.terceroCuit || '-'}</div>
          </div>
          <div class="info-item">
            <div class="label">Fecha</div>
            <div class="value">${new Date(cobranza.fecha).toLocaleDateString('es-AR')}</div>
          </div>
          <div class="info-item">
            <div class="label">Forma de Pago</div>
            <div class="value">${cobranza.formaPago?.nombre || '-'}</div>
          </div>
        </div>
        
        <div class="total-box">
          <div class="total-label">MONTO RECIBIDO</div>
          <div class="total-value">$${cobranza.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
        </div>
        
        ${cobranza.cheque ? `
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>Datos del Cheque:</strong><br>
            N° ${cobranza.cheque.numero} - Banco: ${cobranza.cheque.banco}<br>
            Monto: $${cobranza.cheque.monto?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) || '-'}
          </div>
        ` : ''}
        
        ${cobranza.observaciones ? `
          <div style="margin: 20px 0;">
            <strong>Observaciones:</strong><br>
            ${cobranza.observaciones}
          </div>
        ` : ''}
        
        <div class="footer">
          <p>Este documento constituye comprobante válido de pago</p>
          <p>Solemar Alimentaria - Frigorífico</p>
        </div>
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

  const cobranzasFiltradas = cobranzas.filter(c =>
    c.terceroNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(c.numero).includes(searchTerm)
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-stone-500">Cargando datos...</p>
        </CardContent>
      </Card>
    )
  }

  const formaPagoSeleccionada = formasPago.find(f => f.id === formData.formaPagoId)

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Cobrado Hoy</p>
                <p className="text-xl font-bold">
                  ${cobranzas.filter(c => new Date(c.fecha).toDateString() === new Date().toDateString() && c.estado === 'CONFIRMADO')
                    .reduce((sum, c) => sum + c.monto, 0).toLocaleString('es-AR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Confirmadas</p>
                <p className="text-xl font-bold">{cobranzas.filter(c => c.estado === 'CONFIRMADO').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Clientes</p>
                <p className="text-xl font-bold">{clientes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 p-2 rounded-lg">
                <CreditCardIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Cheques Pend.</p>
                <p className="text-xl font-bold">{chequesRecibidos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cobranzas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cobranzas">Cobranzas</TabsTrigger>
          <TabsTrigger value="cheques">Seguimiento de Cheques</TabsTrigger>
        </TabsList>

        <TabsContent value="cobranzas">
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Cobranzas de Clientes
                </CardTitle>
                <CardDescription>Historial de cobranzas realizadas</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <Input
                    className="pl-9 w-64"
                    placeholder="Buscar por cliente o número..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Cobranza
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {cobranzasFiltradas.length === 0 ? (
                <div className="text-center py-12 text-stone-400">
                  <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay cobranzas registradas</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Recibo</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Forma de Pago</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cobranzasFiltradas.map((cobranza) => (
                      <TableRow key={cobranza.id}>
                        <TableCell className="font-mono font-medium">
                          #{String(cobranza.numero).padStart(6, '0')}
                        </TableCell>
                        <TableCell>
                          {new Date(cobranza.fecha).toLocaleDateString('es-AR')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{cobranza.terceroNombre}</p>
                            {cobranza.terceroCuit && (
                              <p className="text-xs text-stone-500">CUIT: {cobranza.terceroCuit}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{cobranza.formaPago?.nombre || '-'}</p>
                            {cobranza.cheque && (
                              <p className="text-xs text-stone-500">
                                Cheque: {cobranza.cheque.numero}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          ${cobranza.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{getEstadoBadge(cobranza.estado)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => verDetalleCobranza(cobranza)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => imprimirRecibo(cobranza)}>
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
        </TabsContent>

        <TabsContent value="cheques">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCardIcon className="w-5 h-5" />
                Cheques Recibidos
              </CardTitle>
              <CardDescription>Seguimiento de cheques de terceros</CardDescription>
            </CardHeader>
            <CardContent>
              {chequesRecibidos.length === 0 ? (
                <div className="text-center py-12 text-stone-400">
                  <CreditCardIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay cheques recibidos pendientes</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Cheque</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead>Librador</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chequesRecibidos.map((cheque) => (
                      <TableRow key={cheque.id}>
                        <TableCell className="font-mono">{cheque.numero}</TableCell>
                        <TableCell>{cheque.banco}</TableCell>
                        <TableCell>
                          <div>
                            <p>{cheque.libradorNombre}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${cheque.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-stone-400" />
                            {new Date(cheque.fechaVencimiento).toLocaleDateString('es-AR')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-yellow-100 text-yellow-800">{cheque.estado}</Badge>
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

      {/* Dialog Nueva Cobranza */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Nueva Cobranza</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4 overflow-y-auto flex-1">
            {/* Selección de Cliente */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cliente *</Label>
                <Select
                  value={formData.clienteId}
                  onValueChange={handleClienteChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre} {c.cuit ? `(${c.cuit})` : ''}
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
                  onValueChange={(v) => setFormData({ ...formData, formaPagoId: v })}
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

            {/* Datos del Cheque (si aplica) */}
            {formaPagoSeleccionada?.requiereCheque && (
              <div className="border rounded-lg p-4 bg-amber-50 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCardIcon className="w-5 h-5 text-amber-600" />
                  <Label className="text-amber-800 font-medium">Datos del Cheque</Label>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>N° de Cheque</Label>
                    <Input
                      value={formData.numeroCheque}
                      onChange={(e) => setFormData({ ...formData, numeroCheque: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Banco</Label>
                    <Input
                      value={formData.bancoCheque}
                      onChange={(e) => setFormData({ ...formData, bancoCheque: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Monto del Cheque</Label>
                    <Input
                      type="number"
                      value={formData.montoCheque || formData.monto}
                      onChange={(e) => setFormData({ ...formData, montoCheque: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Fecha de Vencimiento</Label>
                    <Input
                      type="date"
                      value={formData.fechaVencimientoCheque}
                      onChange={(e) => setFormData({ ...formData, fechaVencimientoCheque: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Librador</Label>
                    <Input
                      value={formData.libradorNombre}
                      onChange={(e) => setFormData({ ...formData, libradorNombre: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Comprobante */}
            <div>
              <Label>N° Comprobante / Referencia</Label>
              <Input
                value={formData.comprobante}
                onChange={(e) => setFormData({ ...formData, comprobante: e.target.value })}
                placeholder="Número de transferencia, etc."
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

            {/* Facturas Pendientes */}
            {formData.clienteId && facturasPendientes.length > 0 && (
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
            <Button onClick={handleSaveCobranza} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Registrar Cobranza
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalle Cobranza */}
      <Dialog open={detalleDialogOpen} onOpenChange={setDetalleDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle de Cobranza</DialogTitle>
          </DialogHeader>
          {cobranzaSeleccionada && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-stone-500">N° Recibo</Label>
                  <p className="font-mono font-bold text-lg">
                    #{String(cobranzaSeleccionada.numero).padStart(6, '0')}
                  </p>
                </div>
                <div>
                  <Label className="text-stone-500">Estado</Label>
                  <div>{getEstadoBadge(cobranzaSeleccionada.estado)}</div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-stone-500">Cliente</Label>
                  <p className="font-medium">{cobranzaSeleccionada.terceroNombre}</p>
                  {cobranzaSeleccionada.terceroCuit && (
                    <p className="text-sm text-stone-500">CUIT: {cobranzaSeleccionada.terceroCuit}</p>
                  )}
                </div>
                <div>
                  <Label className="text-stone-500">Fecha</Label>
                  <p>{new Date(cobranzaSeleccionada.fecha).toLocaleDateString('es-AR')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-stone-500">Forma de Pago</Label>
                  <p>{cobranzaSeleccionada.formaPago?.nombre || '-'}</p>
                </div>
                <div>
                  <Label className="text-stone-500">Monto</Label>
                  <p className="text-xl font-bold text-green-600">
                    ${cobranzaSeleccionada.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {cobranzaSeleccionada.cheque && (
                <div className="bg-amber-50 p-3 rounded-lg">
                  <Label className="text-stone-500">Cheque</Label>
                  <p>N° {cobranzaSeleccionada.cheque.numero} - Banco: {cobranzaSeleccionada.cheque.banco}</p>
                  <p className="text-sm text-stone-500">
                    Monto: ${cobranzaSeleccionada.cheque.monto?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}

              {cobranzaSeleccionada.comprobante && (
                <div>
                  <Label className="text-stone-500">Comprobante</Label>
                  <p>{cobranzaSeleccionada.comprobante}</p>
                </div>
              )}

              {cobranzaSeleccionada.observaciones && (
                <div>
                  <Label className="text-stone-500">Observaciones</Label>
                  <p className="text-sm">{cobranzaSeleccionada.observaciones}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => imprimirRecibo(cobranzaSeleccionada)}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir Recibo
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CobranzasClientes
