'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  Package, FileText, Calendar, CheckCircle, AlertTriangle,
  Loader2, Save, XCircle
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
  estado: string
  subtotal: number
  iva: number
  total: number
  observaciones: string | null
  detalles: DetalleOrden[]
  recepciones: Recepcion[]
}

interface ItemRecepcion {
  detalleId: string
  insumo: Insumo
  seleccionado: boolean
  cantidadPedida: number
  cantidadRecibidaPrevio: number
  cantidadRecibir: number
  pendiente: number
}

interface RecepcionOrdenProps {
  orden: OrdenCompra
  operador: Operador
  onCompletar: () => void
  onCancelar: () => void
}

export function RecepcionOrden({ orden, operador, onCompletar, onCancelar }: RecepcionOrdenProps) {
  const [numeroRemito, setNumeroRemito] = useState<string>('')
  const [fechaRecepcion, setFechaRecepcion] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [observaciones, setObservaciones] = useState<string>('')
  const [loading, setLoading] = useState(false)
  
  // Inicializar items de recepción
  const [items, setItems] = useState<ItemRecepcion[]>(() => 
    orden.detalles.map(detalle => ({
      detalleId: detalle.id,
      insumo: detalle.insumo,
      seleccionado: false,
      cantidadPedida: detalle.cantidadPedida,
      cantidadRecibidaPrevio: detalle.cantidadRecibida,
      cantidadRecibir: 0,
      pendiente: detalle.cantidadPedida - detalle.cantidadRecibida
    }))
  )

  const toggleSeleccion = (index: number) => {
    const nuevosItems = [...items]
    nuevosItems[index].seleccionado = !nuevosItems[index].seleccionado
    
    if (nuevosItems[index].seleccionado) {
      // Al seleccionar, poner cantidad pendiente por defecto
      nuevosItems[index].cantidadRecibir = nuevosItems[index].pendiente
    } else {
      nuevosItems[index].cantidadRecibir = 0
    }
    
    setItems(nuevosItems)
  }

  const actualizarCantidad = (index: number, cantidad: number) => {
    const nuevosItems = [...items]
    const maximo = nuevosItems[index].pendiente
    
    nuevosItems[index].cantidadRecibir = Math.min(Math.max(cantidad, 0), maximo)
    
    // Si la cantidad es mayor a 0, marcar como seleccionado
    if (nuevosItems[index].cantidadRecibir > 0) {
      nuevosItems[index].seleccionado = true
    }
    
    setItems(nuevosItems)
  }

  const seleccionarTodos = () => {
    const todosSeleccionados = items.every(item => item.seleccionado || item.pendiente === 0)
    
    setItems(items.map(item => {
      if (item.pendiente === 0) return item
      
      return {
        ...item,
        seleccionado: !todosSeleccionados,
        cantidadRecibir: !todosSeleccionados ? item.pendiente : 0
      }
    }))
  }

  const itemsSeleccionados = items.filter(item => item.seleccionado && item.cantidadRecibir > 0)
  const totalItems = itemsSeleccionados.length
  const hayPendientes = items.some(item => item.pendiente > 0)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(value || 0)
  }

  const validarFormulario = (): boolean => {
    if (itemsSeleccionados.length === 0) {
      toast.error('Debe seleccionar al menos un item para recibir')
      return false
    }
    if (!numeroRemito.trim()) {
      toast.error('Debe ingresar el número de remito del proveedor')
      return false
    }
    return true
  }

  const handleGuardar = async () => {
    if (!validarFormulario()) return
    
    try {
      setLoading(true)
      
      // Crear la recepción
      const recepcionData = {
        ordenCompraId: orden.id,
        numeroRemito: numeroRemito.trim(),
        fechaRecepcion,
        estado: items.every(item => item.pendiente === item.cantidadRecibir || item.pendiente === 0) 
          ? 'COMPLETA' 
          : 'PARCIAL',
        observaciones,
        operadorId: operador.id
      }
      
      // 1. Crear la recepción
      const resRecepcion = await fetch('/api/recepciones-compra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recepcionData)
      })
      
      if (!resRecepcion.ok) {
        const error = await resRecepcion.json()
        throw new Error(error.error || 'Error al crear la recepción')
      }
      
      // 2. Actualizar los detalles de la orden con las cantidades recibidas
      for (const item of itemsSeleccionados) {
        const detalle = orden.detalles.find(d => d.id === item.detalleId)
        if (detalle) {
          await fetch('/api/detalles-orden-compra', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: item.detalleId,
              cantidadRecibida: detalle.cantidadRecibida + item.cantidadRecibir
            })
          })
        }
      }
      
      // 3. Crear movimientos de stock para cada item recibido
      for (const item of itemsSeleccionados) {
        await fetch('/api/movimientos-insumos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            insumoId: item.insumo.id,
            tipo: 'INGRESO',
            cantidad: item.cantidadRecibir,
            motivo: `Recepción OC #${orden.numero} - Remito: ${numeroRemito}`,
            ordenCompraId: orden.id,
            operadorId: operador.id
          })
        })
      }
      
      onCompletar()
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al registrar la recepción')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Info de la orden */}
      <Card className="bg-stone-50">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-stone-500">Orden:</span>
              <span className="font-bold ml-1">#{orden.numero.toString().padStart(6, '0')}</span>
            </div>
            <div>
              <span className="text-stone-500">Proveedor:</span>
              <span className="font-medium ml-1">{orden.proveedor?.nombre || 'Sin proveedor'}</span>
            </div>
            <div>
              <span className="text-stone-500">Fecha emisión:</span>
              <span className="ml-1">
                {new Date(orden.fechaEmision).toLocaleDateString('es-AR')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos del remito */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600" />
            Datos del Remito
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Número de Remito del Proveedor *</Label>
              <Input
                placeholder="Ej: 0001-00012345"
                value={numeroRemito}
                onChange={(e) => setNumeroRemito(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha de Recepción</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  type="date"
                  value={fechaRecepcion}
                  onChange={(e) => setFechaRecepcion(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items a recibir */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              Items a Recibir
            </CardTitle>
            {hayPendientes && (
              <Button
                variant="outline"
                size="sm"
                onClick={seleccionarTodos}
              >
                Seleccionar todos
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50">
                <tr>
                  <th className="p-3 w-12"></th>
                  <th className="text-left p-3 text-sm font-medium text-stone-600">Insumo</th>
                  <th className="text-center p-3 text-sm font-medium text-stone-600">Unidad</th>
                  <th className="text-center p-3 text-sm font-medium text-stone-600">Pedido</th>
                  <th className="text-center p-3 text-sm font-medium text-stone-600">Recibido</th>
                  <th className="text-center p-3 text-sm font-medium text-stone-600">Pendiente</th>
                  <th className="text-center p-3 text-sm font-medium text-stone-600 w-32">A Recibir</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item, index) => (
                  <tr 
                    key={item.detalleId} 
                    className={`hover:bg-stone-50 transition-colors ${
                      item.pendiente === 0 ? 'bg-green-50 opacity-60' : ''
                    } ${item.seleccionado ? 'bg-amber-50' : ''}`}
                  >
                    <td className="p-3 text-center">
                      <Checkbox
                        checked={item.seleccionado}
                        onCheckedChange={() => toggleSeleccion(index)}
                        disabled={item.pendiente === 0}
                      />
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{item.insumo.nombre}</p>
                        <p className="text-xs text-stone-500 font-mono">{item.insumo.codigo}</p>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="outline">{item.insumo.unidadMedida}</Badge>
                    </td>
                    <td className="p-3 text-center">{item.cantidadPedida}</td>
                    <td className="p-3 text-center">
                      <span className="text-green-600 font-medium">
                        {item.cantidadRecibidaPrevio}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {item.pendiente > 0 ? (
                        <span className="text-orange-600 font-medium">{item.pendiente}</span>
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                      )}
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        min="0"
                        max={item.pendiente}
                        value={item.cantidadRecibir}
                        onChange={(e) => actualizarCantidad(index, parseFloat(e.target.value) || 0)}
                        className="w-24 text-center mx-auto"
                        disabled={item.pendiente === 0}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Observaciones */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Observaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Notas sobre la recepción (estado de los productos, observaciones, etc.)..."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Resumen */}
      {itemsSeleccionados.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">
                  {totalItems} item{totalItems !== 1 ? 's' : ''} seleccionado{totalItems !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-green-600">
                  Total a recibir: {itemsSeleccionados.reduce((acc, i) => acc + i.cantidadRecibir, 0)} unidades
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botones */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancelar}
          disabled={loading}
        >
          <XCircle className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button
          type="button"
          className="bg-green-600 hover:bg-green-700"
          onClick={handleGuardar}
          disabled={loading || itemsSeleccionados.length === 0}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Confirmar Recepción
        </Button>
      </div>
    </div>
  )
}

export default RecepcionOrden
