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
  FileCheck, Building2, CheckCircle, X, AlertCircle,
  CreditCard, ArrowRightLeft, Clock, DollarSign, Printer
} from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface CuentaBancaria {
  id: string
  banco: string
  tipoCuenta: string
  numeroCuenta: string
  saldoActual: number
  saldoConciliado: number
}

interface Cheque {
  id: string
  numero: string
  banco: string
  monto: number
  fechaEmision: string
  fechaVencimiento: string
  fechaCobro?: string
  estado: string
  libradorNombre: string
  destino?: string
}

interface MovimientoBancario {
  id: string
  fecha: string
  tipo: 'DEBITO' | 'CREDITO'
  concepto: string
  monto: number
  saldo: number
  conciliado: boolean
  referencia?: string
}

export function Conciliaciones({ operador }: { operador: Operador }) {
  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancaria[]>([])
  const [cheques, setCheques] = useState<Cheque[]>([])
  const [loading, setLoading] = useState(true)
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [ajusteDialogOpen, setAjusteDialogOpen] = useState(false)

  // Form state para ajustes
  const [formData, setFormData] = useState({
    tipo: 'DEBITO',
    monto: 0,
    concepto: '',
    fecha: new Date().toISOString().split('T')[0],
  })

  // Movimientos simulados para demostración
  const [movimientos, setMovimientos] = useState<MovimientoBancario[]>([
    { id: '1', fecha: '2025-01-15', tipo: 'CREDITO', concepto: 'Depósito de cheques', monto: 150000, saldo: 150000, conciliado: true },
    { id: '2', fecha: '2025-01-16', tipo: 'DEBITO', concepto: 'Transferencia a proveedor', monto: 45000, saldo: 105000, conciliado: true },
    { id: '3', fecha: '2025-01-17', tipo: 'CREDITO', concepto: 'Cobranza de clientes', monto: 85000, saldo: 190000, conciliado: false },
    { id: '4', fecha: '2025-01-18', tipo: 'DEBITO', concepto: 'Pago de servicios', monto: 12000, saldo: 178000, conciliado: false },
    { id: '5', fecha: '2025-01-19', tipo: 'DEBITO', concepto: 'Cheque cobrado', monto: 25000, saldo: 153000, conciliado: true },
  ])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [cuentasRes, chequesRes] = await Promise.all([
        fetch('/api/cuentas-bancarias'),
        fetch('/api/cheques'),
      ])

      if (cuentasRes.ok) {
        const data = await cuentasRes.json()
        setCuentasBancarias(data.data || data || [])
        if ((data.data || data || []).length > 0) {
          setCuentaSeleccionada((data.data || data)[0].id)
        }
      }
      if (chequesRes.ok) {
        const data = await chequesRes.json()
        setCheques(data.data || data || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConciliarMovimiento = (movimientoId: string) => {
    setMovimientos(prev => prev.map(m =>
      m.id === movimientoId ? { ...m, conciliado: !m.conciliado } : m
    ))
    toast.success('Movimiento actualizado')
  }

  const handleMarcarChequeCobrado = async (chequeId: string) => {
    try {
      const res = await fetch('/api/cheques', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: chequeId,
          estado: 'COBRADO',
          fechaCobro: new Date().toISOString()
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Cheque marcado como cobrado')
        fetchData()
      }
    } catch (error) {
      console.error('Error al actualizar cheque:', error)
      toast.error('Error al actualizar cheque')
    }
  }

  const handleDepositarCheque = async (chequeId: string, cuentaId: string) => {
    try {
      const res = await fetch('/api/cheques', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: chequeId,
          estado: 'DEPOSITADO',
          cuentaBancariaId: cuentaId
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Cheque depositado correctamente')
        fetchData()
      }
    } catch (error) {
      console.error('Error al depositar cheque:', error)
      toast.error('Error al depositar cheque')
    }
  }

  const handleEntregarCheque = async (chequeId: string) => {
    try {
      const res = await fetch('/api/cheques', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: chequeId,
          estado: 'ENTREGADO'
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Cheque entregado a proveedor')
        fetchData()
      }
    } catch (error) {
      console.error('Error al entregar cheque:', error)
      toast.error('Error al entregar cheque')
    }
  }

  const handleSaveAjuste = async () => {
    if (formData.monto <= 0) {
      toast.error('Ingrese un monto válido')
      return
    }
    if (!formData.concepto) {
      toast.error('Ingrese un concepto')
      return
    }

    // Agregar movimiento de ajuste
    const nuevoMovimiento: MovimientoBancario = {
      id: Date.now().toString(),
      fecha: formData.fecha,
      tipo: formData.tipo as 'DEBITO' | 'CREDITO',
      concepto: `[AJUSTE] ${formData.concepto}`,
      monto: formData.monto,
      saldo: 0,
      conciliado: true
    }

    setMovimientos(prev => [...prev, nuevoMovimiento])
    setAjusteDialogOpen(false)
    setFormData({ tipo: 'DEBITO', monto: 0, concepto: '', fecha: new Date().toISOString().split('T')[0] })
    toast.success('Ajuste registrado correctamente')
  }

  const imprimirEstadoCuenta = () => {
    const cuenta = cuentasBancarias.find(c => c.id === cuentaSeleccionada)
    if (!cuenta) return

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Estado de Cuenta - ${cuenta.banco}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
          .title { font-size: 24px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .conciliado { background-color: #f0fdf4; }
          .no-conciliado { background-color: #fef3c7; }
          .total-row { font-weight: bold; background-color: #f9f9f9; }
          @media print { body { print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Estado de Cuenta Bancario</div>
          <div>${cuenta.banco} - ${cuenta.tipoCuenta}</div>
          <div>Cuenta N°: ${cuenta.numeroCuenta}</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Concepto</th>
              <th class="text-right">Monto</th>
              <th class="text-right">Saldo</th>
              <th class="text-center">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${movimientos.map(m => `
              <tr class="${m.conciliado ? 'conciliado' : 'no-conciliado'}">
                <td>${new Date(m.fecha).toLocaleDateString('es-AR')}</td>
                <td>${m.tipo}</td>
                <td>${m.concepto}</td>
                <td class="text-right ${m.tipo === 'CREDITO' ? 'text-green-600' : 'text-red-600'}">
                  ${m.tipo === 'CREDITO' ? '+' : '-'}$${m.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
                <td class="text-right">$${m.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                <td class="text-center">${m.conciliado ? 'Conciliado' : 'Pendiente'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
          <p><strong>Saldo según banco:</strong> $${cuenta.saldoActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
          <p><strong>Saldo conciliado:</strong> $${cuenta.saldoConciliado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
          <p><strong>Diferencia:</strong> $${(cuenta.saldoActual - cuenta.saldoConciliado).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
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

  const cuentaActual = cuentasBancarias.find(c => c.id === cuentaSeleccionada)

  // Cheques por estado
  const chequesRecibidos = cheques.filter(c => c.estado === 'RECIBIDO')
  const chequesDepositados = cheques.filter(c => c.estado === 'DEPOSITADO')
  const chequesPorCobrar = cheques.filter(c => c.estado === 'DEPOSITADO' || c.estado === 'RECIBIDO')

  // Estadísticas
  const totalChequesPorCobrar = chequesPorCobrar.reduce((sum, c) => sum + c.monto, 0)
  const movimientosConciliados = movimientos.filter(m => m.conciliado).length
  const movimientosPendientes = movimientos.filter(m => !m.conciliado).length
  const diferencia = cuentaActual ? cuentaActual.saldoActual - cuentaActual.saldoConciliado : 0

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-stone-500">Cargando datos...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Saldo Banco</p>
                <p className="text-xl font-bold">
                  ${cuentaActual?.saldoActual.toLocaleString('es-AR') || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 p-2 rounded-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Conciliado</p>
                <p className="text-xl font-bold">
                  ${cuentaActual?.saldoConciliado.toLocaleString('es-AR') || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${diferencia !== 0 ? 'bg-red-500' : 'bg-emerald-500'}`}>
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Diferencia</p>
                <p className={`text-xl font-bold ${diferencia !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${Math.abs(diferencia).toLocaleString('es-AR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 p-2 rounded-lg">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Cheques por Cobrar</p>
                <p className="text-xl font-bold">{chequesPorCobrar.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-stone-500">Total Cheques</p>
                <p className="text-xl font-bold">${totalChequesPorCobrar.toLocaleString('es-AR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="conciliacion" className="space-y-4">
        <TabsList>
          <TabsTrigger value="conciliacion">Conciliación Bancaria</TabsTrigger>
          <TabsTrigger value="cheques">Gestión de Cheques</TabsTrigger>
        </TabsList>

        <TabsContent value="conciliacion">
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5" />
                  Estado de Cuenta Bancario
                </CardTitle>
                <CardDescription>Conciliación de movimientos bancarios</CardDescription>
              </div>
              <div className="flex gap-2">
                <Select value={cuentaSeleccionada} onValueChange={setCuentaSeleccionada}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Seleccionar cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    {cuentasBancarias.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.banco} - {c.tipoCuenta} ({c.numeroCuenta})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={imprimirEstadoCuenta}>
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
                <Button onClick={() => setAjusteDialogOpen(true)}>
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  Nuevo Ajuste
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Leyenda */}
              <div className="flex gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 rounded" />
                  <span>Conciliado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-100 rounded" />
                  <span>Pendiente</span>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientos.map((mov) => (
                    <TableRow key={mov.id} className={mov.conciliado ? 'bg-green-50' : 'bg-yellow-50'}>
                      <TableCell>
                        {new Date(mov.fecha).toLocaleDateString('es-AR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={mov.tipo === 'CREDITO' ? 'default' : 'secondary'}>
                          {mov.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>{mov.concepto}</TableCell>
                      <TableCell className="text-right">
                        <span className={mov.tipo === 'CREDITO' ? 'text-green-600' : 'text-red-600'}>
                          {mov.tipo === 'CREDITO' ? '+' : '-'}
                          ${mov.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        ${mov.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {mov.conciliado ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Conciliado
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Pendiente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleConciliarMovimiento(mov.id)}
                        >
                          {mov.conciliado ? 'Desconciliar' : 'Conciliar'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Resumen */}
              <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-stone-50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-stone-500">Movimientos Conciliados</p>
                  <p className="text-2xl font-bold text-green-600">{movimientosConciliados}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-stone-500">Movimientos Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-600">{movimientosPendientes}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-stone-500">Diferencia</p>
                  <p className={`text-2xl font-bold ${diferencia === 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${Math.abs(diferencia).toLocaleString('es-AR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cheques">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cheques Recibidos */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="w-5 h-5 text-amber-500" />
                  Cheques Recibidos ({chequesRecibidos.length})
                </CardTitle>
                <CardDescription>Cheques de clientes pendientes de depósito</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  {chequesRecibidos.length === 0 ? (
                    <div className="text-center py-8 text-stone-400">
                      No hay cheques recibidos pendientes
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {chequesRecibidos.map((cheque) => (
                        <div key={cheque.id} className="border rounded-lg p-3 hover:bg-stone-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-mono font-medium">N° {cheque.numero}</p>
                              <p className="text-sm text-stone-500">{cheque.banco}</p>
                              <p className="text-sm">{cheque.libradorNombre}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">
                                ${cheque.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-stone-500">
                                Vence: {new Date(cheque.fechaVencimiento).toLocaleDateString('es-AR')}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => handleDepositarCheque(cheque.id, cuentaSeleccionada)}
                            >
                              Depositar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleEntregarCheque(cheque.id)}
                            >
                              Entregar a Prov.
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Cheques Depositados */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="w-5 h-5 text-blue-500" />
                  Cheques Depositados ({chequesDepositados.length})
                </CardTitle>
                <CardDescription>Cheques en banco pendientes de acreditación</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  {chequesDepositados.length === 0 ? (
                    <div className="text-center py-8 text-stone-400">
                      No hay cheques depositados pendientes
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {chequesDepositados.map((cheque) => (
                        <div key={cheque.id} className="border rounded-lg p-3 hover:bg-stone-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-mono font-medium">N° {cheque.numero}</p>
                              <p className="text-sm text-stone-500">{cheque.banco}</p>
                              <p className="text-sm">{cheque.libradorNombre}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">
                                ${cheque.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </p>
                              <Badge className="bg-blue-100 text-blue-800">Depositado</Badge>
                            </div>
                          </div>
                          <div className="mt-2">
                            <Button
                              size="sm"
                              className="w-full bg-green-600 hover:bg-green-700"
                              onClick={() => handleMarcarChequeCobrado(cheque.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Marcar como Cobrado
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Todos los Cheques */}
          <Card className="border-0 shadow-md mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="w-5 h-5" />
                Todos los Cheques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Cheque</TableHead>
                    <TableHead>Banco</TableHead>
                    <TableHead>Librador</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cheques.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-stone-400">
                        No hay cheques registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    cheques.map((cheque) => (
                      <TableRow key={cheque.id}>
                        <TableCell className="font-mono">{cheque.numero}</TableCell>
                        <TableCell>{cheque.banco}</TableCell>
                        <TableCell>{cheque.libradorNombre}</TableCell>
                        <TableCell className="text-right font-medium">
                          ${cheque.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          {new Date(cheque.fechaVencimiento).toLocaleDateString('es-AR')}
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            cheque.estado === 'COBRADO' ? 'bg-green-100 text-green-800' :
                            cheque.estado === 'DEPOSITADO' ? 'bg-blue-100 text-blue-800' :
                            cheque.estado === 'ENTREGADO' ? 'bg-purple-100 text-purple-800' :
                            cheque.estado === 'RECHAZADO' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {cheque.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {cheque.estado === 'RECIBIDO' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDepositarCheque(cheque.id, cuentaSeleccionada)}
                            >
                              Depositar
                            </Button>
                          )}
                          {cheque.estado === 'DEPOSITADO' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarcarChequeCobrado(cheque.id)}
                            >
                              Cobrado
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Nuevo Ajuste */}
      <Dialog open={ajusteDialogOpen} onOpenChange={setAjusteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Ajuste</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Tipo de Ajuste</Label>
              <Select
                value={formData.tipo}
                onValueChange={(v) => setFormData({ ...formData, tipo: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREDITO">Crédito (Depósito)</SelectItem>
                  <SelectItem value="DEBITO">Débito (Extracción)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Monto</Label>
              <Input
                type="number"
                value={formData.monto || ''}
                onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Fecha</Label>
              <Input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              />
            </div>
            <div>
              <Label>Concepto</Label>
              <Textarea
                value={formData.concepto}
                onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                placeholder="Descripción del ajuste..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAjusteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAjuste}>
              Registrar Ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Conciliaciones
