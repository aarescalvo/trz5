'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Building2, Search, Printer, Download, Calendar,
  TrendingUp, TrendingDown, AlertCircle, Clock, FileSpreadsheet, FileText
} from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Tercero {
  id: string
  nombre: string
  cuit?: string
  tipo: 'CLIENTE' | 'PROVEEDOR'
}

interface MovimientoCC {
  id: string
  fecha: string
  tipo: 'FACTURA' | 'PAGO' | 'NOTA_CREDITO' | 'NOTA_DEBITO'
  comprobante: string
  debe: number
  haber: number
  saldo: number
  observaciones?: string
}

interface ResumenSaldos {
  total: number
  dias30: number
  dias60: number
  dias90: number
  masDe90: number
}

export function CuentasCorrientes({ operador }: { operador: Operador }) {
  const [terceros, setTerceros] = useState<Tercero[]>([])
  const [loading, setLoading] = useState(true)
  const [tipoFiltro, setTipoFiltro] = useState<'CLIENTE' | 'PROVEEDOR'>('CLIENTE')
  const [searchTerm, setSearchTerm] = useState('')
  const [terceroSeleccionado, setTerceroSeleccionado] = useState<Tercero | null>(null)
  const [movimientos, setMovimientos] = useState<MovimientoCC[]>([])
  const [resumenSaldos, setResumenSaldos] = useState<ResumenSaldos>({ total: 0, dias30: 0, dias60: 0, dias90: 0, masDe90: 0 })
  const [detalleDialogOpen, setDetalleDialogOpen] = useState(false)
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  useEffect(() => {
    fetchTerceros()
  }, [tipoFiltro])

  const fetchTerceros = async () => {
    setLoading(true)
    try {
      const endpoint = tipoFiltro === 'CLIENTE' ? '/api/usuarios' : '/api/proveedores'
      const res = await fetch(endpoint)
      if (res.ok) {
        const data = await res.json()
        const tercerosData = (data.data || data || []).map((t: Tercero) => ({
          ...t,
          tipo: tipoFiltro
        }))
        setTerceros(tercerosData)
      }
    } catch (error) {
      console.error('Error fetching terceros:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCuentaCorriente = async (tercero: Tercero) => {
    setTerceroSeleccionado(tercero)
    setDetalleDialogOpen(true)

    try {
      // Fetch facturas y pagos del tercero
      const [facturasRes, pagosRes] = await Promise.all([
        fetch(`/api/facturacion?clienteId=${tercero.id}`),
        fetch(`/api/pagos?terceroId=${tercero.id}&terceroTipo=${tercero.tipo}`)
      ])

      const movimientosData: MovimientoCC[] = []
      let saldoAcumulado = 0

      if (facturasRes.ok) {
        const facturas = await facturasRes.json()
        for (const f of (facturas.data || facturas || [])) {
          saldoAcumulado += f.total
          movimientosData.push({
            id: f.id,
            fecha: f.fecha,
            tipo: 'FACTURA',
            comprobante: `Factura ${f.numero}`,
            debe: f.total,
            haber: 0,
            saldo: saldoAcumulado,
            observaciones: f.observaciones
          })
        }
      }

      if (pagosRes.ok) {
        const pagos = await pagosRes.json()
        for (const p of (pagos.data || pagos || [])) {
          if (p.estado !== 'ANULADO') {
            saldoAcumulado -= p.monto
            movimientosData.push({
              id: p.id,
              fecha: p.fecha,
              tipo: 'PAGO',
              comprobante: `Pago #${p.numero}`,
              debe: 0,
              haber: p.monto,
              saldo: saldoAcumulado,
              observaciones: p.observaciones
            })
          }
        }
      }

      // Ordenar por fecha
      movimientosData.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())

      // Recalcular saldos
      let saldo = 0
      for (const mov of movimientosData) {
        saldo += mov.debe - mov.haber
        mov.saldo = saldo
      }

      setMovimientos(movimientosData)

      // Calcular resumen de saldos por antigüedad
      const hoy = new Date()
      const resumen: ResumenSaldos = { total: 0, dias30: 0, dias60: 0, dias90: 0, masDe90: 0 }

      for (const mov of movimientosData.filter(m => m.debe > 0)) {
        const dias = Math.floor((hoy.getTime() - new Date(mov.fecha).getTime()) / (1000 * 60 * 60 * 24))
        const montoPendiente = mov.debe - mov.haber

        if (dias <= 30) resumen.dias30 += montoPendiente
        else if (dias <= 60) resumen.dias60 += montoPendiente
        else if (dias <= 90) resumen.dias90 += montoPendiente
        else resumen.masDe90 += montoPendiente

        resumen.total += montoPendiente
      }

      setResumenSaldos(resumen)

    } catch (error) {
      console.error('Error fetching cuenta corriente:', error)
    }
  }

  const exportarExcel = () => {
    if (!terceroSeleccionado || movimientos.length === 0) return

    // Crear CSV
    const headers = ['Fecha', 'Tipo', 'Comprobante', 'Debe', 'Haber', 'Saldo']
    const rows = movimientos.map(m => [
      new Date(m.fecha).toLocaleDateString('es-AR'),
      m.tipo,
      m.comprobante,
      m.debe.toFixed(2),
      m.haber.toFixed(2),
      m.saldo.toFixed(2)
    ])

    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cuenta_corriente_${terceroSeleccionado.nombre.replace(/\s+/g, '_')}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Archivo exportado correctamente')
  }

  const exportarPDF = () => {
    if (!terceroSeleccionado) return

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cuenta Corriente - ${terceroSeleccionado.nombre}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
          .title { font-size: 24px; font-weight: bold; }
          .subtitle { color: #666; margin-top: 5px; }
          .info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
          .info-item { margin-bottom: 10px; }
          .label { font-weight: bold; color: #666; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .text-right { text-align: right; }
          .total-row { font-weight: bold; background-color: #f9f9f9; }
          .summary { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-top: 30px; padding: 15px; background: #f5f5f5; border-radius: 8px; }
          .summary-item { text-align: center; }
          .summary-value { font-size: 18px; font-weight: bold; color: #059669; }
          .summary-label { font-size: 11px; color: #666; }
          @media print { body { print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Cuenta Corriente</div>
          <div class="subtitle">${terceroSeleccionado.tipo === 'CLIENTE' ? 'Cliente' : 'Proveedor'}: ${terceroSeleccionado.nombre}</div>
        </div>
        
        <div class="info">
          <div class="info-item">
            <div class="label">CUIT</div>
            <div>${terceroSeleccionado.cuit || '-'}</div>
          </div>
          <div class="info-item">
            <div class="label">Fecha de Emisión</div>
            <div>${new Date().toLocaleDateString('es-AR')}</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Comprobante</th>
              <th class="text-right">Debe</th>
              <th class="text-right">Haber</th>
              <th class="text-right">Saldo</th>
            </tr>
          </thead>
          <tbody>
            ${movimientos.map(m => `
              <tr>
                <td>${new Date(m.fecha).toLocaleDateString('es-AR')}</td>
                <td>${m.tipo}</td>
                <td>${m.comprobante}</td>
                <td class="text-right">${m.debe > 0 ? '$' + m.debe.toLocaleString('es-AR', { minimumFractionDigits: 2 }) : '-'}</td>
                <td class="text-right">${m.haber > 0 ? '$' + m.haber.toLocaleString('es-AR', { minimumFractionDigits: 2 }) : '-'}</td>
                <td class="text-right ${m.saldo < 0 ? 'text-green-600' : m.saldo > 0 ? 'text-red-600' : ''}">$${Math.abs(m.saldo).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="5">Saldo Final</td>
              <td class="text-right">$${Math.abs(movimientos[movimientos.length - 1]?.saldo || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="summary">
          <div class="summary-item">
            <div class="summary-value">$${resumenSaldos.dias30.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</div>
            <div class="summary-label">0-30 días</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">$${resumenSaldos.dias60.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</div>
            <div class="summary-label">31-60 días</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">$${resumenSaldos.dias90.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</div>
            <div class="summary-label">61-90 días</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">$${resumenSaldos.masDe90.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</div>
            <div class="summary-label">+90 días</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">$${resumenSaldos.total.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</div>
            <div class="summary-label">Total</div>
          </div>
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

  const tercerosFiltrados = terceros.filter(t =>
    t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.cuit?.includes(searchTerm)
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-stone-500">Cargando datos...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-stone-500">{tipoFiltro === 'CLIENTE' ? 'Clientes' : 'Proveedores'}</p>
                <p className="text-xl font-bold">{terceros.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 p-2 rounded-lg">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-stone-500">0-30 días</p>
                <p className="text-xl font-bold">${resumenSaldos.dias30.toLocaleString('es-AR')}</p>
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
                <p className="text-xs text-stone-500">31-60 días</p>
                <p className="text-xl font-bold">${resumenSaldos.dias60.toLocaleString('es-AR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-500 p-2 rounded-lg">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-stone-500">+90 días</p>
                <p className="text-xl font-bold">${resumenSaldos.masDe90.toLocaleString('es-AR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selector de Tipo y Lista */}
      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Cuentas Corrientes
            </CardTitle>
            <CardDescription>Consulta de saldos y movimientos por cliente/proveedor</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select
              value={tipoFiltro}
              onValueChange={(v) => setTipoFiltro(v as 'CLIENTE' | 'PROVEEDOR')}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CLIENTE">Clientes</SelectItem>
                <SelectItem value="PROVEEDOR">Proveedores</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <Input
                className="pl-9 w-64"
                placeholder="Buscar por nombre o CUIT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tercerosFiltrados.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay {tipoFiltro.toLowerCase()}s registrados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>CUIT</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tercerosFiltrados.map((tercero) => (
                  <TableRow key={tercero.id} className="cursor-pointer hover:bg-stone-50">
                    <TableCell className="font-medium">{tercero.nombre}</TableCell>
                    <TableCell>{tercero.cuit || '-'}</TableCell>
                    <TableCell className="text-right font-medium">
                      $0.00 {/* Placeholder - en implementación real calcular saldo */}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700">Al día</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => fetchCuentaCorriente(tercero)}>
                        Ver Cuenta
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Detalle Cuenta Corriente */}
      <Dialog open={detalleDialogOpen} onOpenChange={setDetalleDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                Cuenta Corriente - {terceroSeleccionado?.nombre}
              </DialogTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportarExcel}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Excel
                </Button>
                <Button variant="outline" size="sm" onClick={exportarPDF}>
                  <FileText className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Resumen de saldos */}
            <div className="grid grid-cols-5 gap-4 p-4 bg-stone-50 rounded-lg">
              <div className="text-center">
                <p className="text-xs text-stone-500">0-30 días</p>
                <p className="text-lg font-bold text-green-600">
                  ${resumenSaldos.dias30.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-stone-500">31-60 días</p>
                <p className="text-lg font-bold text-yellow-600">
                  ${resumenSaldos.dias60.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-stone-500">61-90 días</p>
                <p className="text-lg font-bold text-orange-600">
                  ${resumenSaldos.dias90.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-stone-500">+90 días</p>
                <p className="text-lg font-bold text-red-600">
                  ${resumenSaldos.masDe90.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                </p>
              </div>
              <div className="text-center border-l">
                <p className="text-xs text-stone-500">TOTAL</p>
                <p className="text-xl font-bold text-blue-600">
                  ${resumenSaldos.total.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>

            {/* Filtros de fecha */}
            <div className="flex gap-4 items-end">
              <div>
                <Label>Desde</Label>
                <Input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-40"
                />
              </div>
              <div>
                <Label>Hasta</Label>
                <Input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button variant="outline" onClick={() => { setFechaDesde(''); setFechaHasta('') }}>
                Limpiar
              </Button>
            </div>

            {/* Tabla de movimientos */}
            <ScrollArea className="flex-1 border rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-white">
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Comprobante</TableHead>
                    <TableHead className="text-right">Debe</TableHead>
                    <TableHead className="text-right">Haber</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-stone-400">
                        No hay movimientos registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    movimientos
                      .filter(m => {
                        if (fechaDesde && new Date(m.fecha) < new Date(fechaDesde)) return false
                        if (fechaHasta && new Date(m.fecha) > new Date(fechaHasta + 'T23:59:59')) return false
                        return true
                      })
                      .map((mov) => (
                        <TableRow key={mov.id}>
                          <TableCell>
                            {new Date(mov.fecha).toLocaleDateString('es-AR')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              mov.tipo === 'FACTURA' ? 'default' :
                              mov.tipo === 'PAGO' ? 'secondary' :
                              mov.tipo === 'NOTA_CREDITO' ? 'outline' : 'destructive'
                            }>
                              {mov.tipo}
                            </Badge>
                          </TableCell>
                          <TableCell>{mov.comprobante}</TableCell>
                          <TableCell className="text-right">
                            {mov.debe > 0 && (
                              <span className="text-red-600">
                                ${mov.debe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {mov.haber > 0 && (
                              <span className="text-green-600">
                                ${mov.haber.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            <span className={mov.saldo < 0 ? 'text-green-600' : mov.saldo > 0 ? 'text-red-600' : ''}>
                              ${Math.abs(mov.saldo).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Saldo final */}
            {movimientos.length > 0 && (
              <div className="flex justify-between items-center p-4 bg-stone-100 rounded-lg">
                <span className="font-medium">Saldo Final:</span>
                <span className={`text-xl font-bold ${movimientos[movimientos.length - 1]?.saldo < 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(movimientos[movimientos.length - 1]?.saldo || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CuentasCorrientes
