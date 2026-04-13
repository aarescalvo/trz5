'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Building2, Phone, Mail, Calendar, Package, Calculator,
  Printer, Edit, XCircle, Clock, CheckCircle, Truck,
  AlertTriangle, FileText, Loader2
} from 'lucide-react'

// Types
interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Proveedor {
  id: string
  nombre: string
  cuit: string | null
  telefono: string | null
  email: string | null
  contacto: string | null
}

interface Insumo {
  id: string
  codigo: string
  nombre: string
  unidadMedida: string
}

interface DetalleOrden {
  id: string
  insumoId: string
  insumo: Insumo
  cantidadPedida: number
  cantidadRecibida: number
  precioUnitario: number
  subtotal: number
}

interface Recepcion {
  id: string
  numeroRemito: string | null
  fechaRecepcion: string
  estado: string
  observaciones: string | null
}

interface OrdenCompra {
  id: string
  numero: number
  proveedorId: string | null
  proveedor: Proveedor | null
  fechaEmision: string
  fechaEntrega: string | null
  fechaRecepcion: string | null
  estado: string
  subtotal: number
  iva: number
  total: number
  observaciones: string | null
  detalles: DetalleOrden[]
  recepciones: Recepcion[]
}

interface DetalleOrdenProps {
  orden: OrdenCompra
  operador: Operador
  onCerrar: () => void
  onActualizar: () => void
}

const ESTADOS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
  APROBADA: { label: 'Aprobada', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: CheckCircle },
  ENVIADA: { label: 'Enviada', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Truck },
  PARCIAL: { label: 'Parcial', color: 'bg-orange-100 text-orange-800 border-orange-300', icon: AlertTriangle },
  COMPLETADA: { label: 'Completada', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
  ANULADA: { label: 'Anulada', color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
}

export function DetalleOrden({ orden, operador, onCerrar, onActualizar }: DetalleOrdenProps) {
  const [loading, setLoading] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(value || 0)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const estadoConfig = ESTADOS_CONFIG[orden.estado] || { label: orden.estado, color: 'bg-gray-100 text-gray-800', icon: Clock }
  const EstadoIcon = estadoConfig.icon

  const handleAnular = async () => {
    if (!confirm('¿Está seguro de anular esta orden de compra? Esta acción no se puede deshacer.')) return
    
    try {
      setLoading(true)
      const res = await fetch('/api/ordenes-compra', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orden.id,
          estado: 'ANULADA',
          operadorId: operador.id
        })
      })
      
      if (res.ok) {
        toast.success('Orden anulada exitosamente')
        onActualizar()
        onCerrar()
      } else {
        toast.error('Error al anular la orden')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al anular la orden')
    } finally {
      setLoading(false)
    }
  }

  const handleImprimir = () => {
    // Crear ventana de impresión
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Orden de Compra #${orden.numero.toString().padStart(6, '0')}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 5px 0; color: #666; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .info-box { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
          .info-box h3 { margin: 0 0 10px; font-size: 14px; color: #666; }
          .info-box p { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #f5f5f5; }
          .totals { text-align: right; }
          .totals p { margin: 5px 0; }
          .total-final { font-size: 18px; font-weight: bold; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ORDEN DE COMPRA</h1>
          <p><strong>N° ${orden.numero.toString().padStart(6, '0')}</strong></p>
          <p>Fecha de Emisión: ${formatDate(orden.fechaEmision)}</p>
        </div>
        
        <div class="info-grid">
          <div class="info-box">
            <h3>PROVEEDOR</h3>
            <p><strong>${orden.proveedor?.nombre || 'Sin proveedor'}</strong></p>
            ${orden.proveedor?.cuit ? `<p>CUIT: ${orden.proveedor.cuit}</p>` : ''}
            ${orden.proveedor?.telefono ? `<p>Tel: ${orden.proveedor.telefono}</p>` : ''}
            ${orden.proveedor?.email ? `<p>Email: ${orden.proveedor.email}</p>` : ''}
          </div>
          <div class="info-box">
            <h3>ENTREGA</h3>
            <p><strong>Fecha Esperada:</strong> ${formatDate(orden.fechaEntrega)}</p>
            <p><strong>Estado:</strong> ${estadoConfig.label}</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th>Unidad</th>
              <th>Cantidad</th>
              <th>Precio Unit.</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${orden.detalles.map(d => `
              <tr>
                <td>${d.insumo.codigo}</td>
                <td>${d.insumo.nombre}</td>
                <td>${d.insumo.unidadMedida}</td>
                <td>${d.cantidadPedida}</td>
                <td>${formatCurrency(d.precioUnitario)}</td>
                <td>${formatCurrency(d.subtotal)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <p>Subtotal: ${formatCurrency(orden.subtotal)}</p>
          <p>IVA (21%): ${formatCurrency(orden.iva)}</p>
          <p class="total-final">TOTAL: ${formatCurrency(orden.total)}</p>
        </div>
        
        ${orden.observaciones ? `
          <div style="margin-top: 20px; border-top: 1px solid #ddd; padding-top: 15px;">
            <h4>Observaciones:</h4>
            <p>${orden.observaciones}</p>
          </div>
        ` : ''}
        
        <div class="footer">
          <p>Solemar Alimentaria - Sistema de Gestión Frigorífica</p>
          <p>Documento generado el ${new Date().toLocaleString('es-AR')}</p>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(content)
    printWindow.document.close()
    printWindow.print()
  }

  // Calcular progreso de recepción
  const totalPedida = orden.detalles.reduce((acc, d) => acc + d.cantidadPedida, 0)
  const totalRecibida = orden.detalles.reduce((acc, d) => acc + d.cantidadRecibida, 0)
  const porcentajeRecibido = totalPedida > 0 ? (totalRecibida / totalPedida) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Badge className={`${estadoConfig.color} border text-base px-4 py-1`}>
            <EstadoIcon className="w-4 h-4 mr-2" />
            {estadoConfig.label}
          </Badge>
          <span className="text-sm text-stone-500">
            Orden #{orden.numero.toString().padStart(6, '0')}
          </span>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleImprimir}
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          {orden.estado === 'PENDIENTE' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnular}
              disabled={loading}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Anular
            </Button>
          )}
        </div>
      </div>

      {/* Información del Proveedor y Fechas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-600" />
              Proveedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orden.proveedor ? (
              <div className="space-y-2">
                <p className="font-semibold text-lg">{orden.proveedor.nombre}</p>
                {orden.proveedor.cuit && (
                  <p className="text-stone-600">CUIT: {orden.proveedor.cuit}</p>
                )}
                {orden.proveedor.telefono && (
                  <p className="flex items-center gap-2 text-stone-600">
                    <Phone className="w-4 h-4" />
                    {orden.proveedor.telefono}
                  </p>
                )}
                {orden.proveedor.email && (
                  <p className="flex items-center gap-2 text-stone-600">
                    <Mail className="w-4 h-4" />
                    {orden.proveedor.email}
                  </p>
                )}
                {orden.proveedor.contacto && (
                  <p className="text-stone-600">
                    <span className="font-medium">Contacto:</span> {orden.proveedor.contacto}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-stone-400">Sin proveedor asignado</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              Fechas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-stone-500">Emisión:</span>
                <span className="font-medium">{formatDate(orden.fechaEmision)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Entrega esperada:</span>
                <span className="font-medium">{formatDate(orden.fechaEntrega)}</span>
              </div>
              {orden.fechaRecepcion && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Recepción:</span>
                  <span className="font-medium text-green-600">{formatDate(orden.fechaRecepcion)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progreso de Recepción */}
      {orden.estado !== 'PENDIENTE' && orden.estado !== 'ANULADA' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              Progreso de Recepción
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Recibido</span>
                <span className="font-medium">{porcentajeRecibido.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-stone-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(porcentajeRecibido, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-stone-500">
                <span>{totalRecibida} unidades recibidas</span>
                <span>{totalPedida} unidades pedidas</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items de la Orden */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600" />
            Items de la Orden
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-stone-600">Código</th>
                  <th className="text-left p-3 text-sm font-medium text-stone-600">Descripción</th>
                  <th className="text-center p-3 text-sm font-medium text-stone-600">Unidad</th>
                  <th className="text-center p-3 text-sm font-medium text-stone-600">Pedida</th>
                  <th className="text-center p-3 text-sm font-medium text-stone-600">Recibida</th>
                  <th className="text-right p-3 text-sm font-medium text-stone-600">Precio Unit.</th>
                  <th className="text-right p-3 text-sm font-medium text-stone-600">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orden.detalles.map((detalle) => {
                  const pendiente = detalle.cantidadPedida - detalle.cantidadRecibida
                  const completo = detalle.cantidadRecibida >= detalle.cantidadPedida
                  
                  return (
                    <tr key={detalle.id} className={`hover:bg-stone-50 ${completo ? 'bg-green-50' : ''}`}>
                      <td className="p-3 font-mono text-sm">{detalle.insumo.codigo}</td>
                      <td className="p-3 font-medium">{detalle.insumo.nombre}</td>
                      <td className="p-3 text-center">
                        <Badge variant="outline">{detalle.insumo.unidadMedida}</Badge>
                      </td>
                      <td className="p-3 text-center">{detalle.cantidadPedida}</td>
                      <td className="p-3 text-center">
                        <span className={completo ? 'text-green-600 font-medium' : pendiente > 0 ? 'text-orange-600' : ''}>
                          {detalle.cantidadRecibida}
                        </span>
                      </td>
                      <td className="p-3 text-right">{formatCurrency(detalle.precioUnitario)}</td>
                      <td className="p-3 text-right font-semibold">{formatCurrency(detalle.subtotal)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Historial de Recepciones */}
      {orden.recepciones && orden.recepciones.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-600" />
              Historial de Recepciones
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {orden.recepciones.map((recepcion, index) => (
                <div key={recepcion.id} className="p-4 hover:bg-stone-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        Recepción #{index + 1}
                        {recepcion.numeroRemito && (
                          <span className="ml-2 text-stone-500 text-sm">
                            Remito: {recepcion.numeroRemito}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-stone-500">
                        {formatDateTime(recepcion.fechaRecepcion)}
                      </p>
                      {recepcion.observaciones && (
                        <p className="text-sm text-stone-600 mt-1">
                          {recepcion.observaciones}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className={
                      recepcion.estado === 'COMPLETA' 
                        ? 'border-green-300 text-green-600' 
                        : 'border-orange-300 text-orange-600'
                    }>
                      {recepcion.estado === 'COMPLETA' ? 'Completa' : 'Parcial'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Totales */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-600" />
            Resumen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Subtotal:</span>
              <span>{formatCurrency(orden.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">IVA (21%):</span>
              <span>{formatCurrency(orden.iva)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-xl font-bold">
              <span>Total:</span>
              <span className="text-amber-600">{formatCurrency(orden.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observaciones */}
      {orden.observaciones && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-stone-600 whitespace-pre-wrap">{orden.observaciones}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default DetalleOrden
