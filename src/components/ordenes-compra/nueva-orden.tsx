'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  Plus, Trash2, Building2, Phone, Mail, Calendar, 
  Package, Calculator, Save, Send, Loader2, Search
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
  precioUnitario: number | null
  proveedorId: string | null
}

interface ItemOrden {
  insumoId: string
  insumo: Insumo | null
  cantidad: number
  precioUnitario: number
  subtotal: number
}

interface NuevaOrdenProps {
  operador: Operador
  proveedores: Proveedor[]
  onGuardar: () => void
  onCancelar: () => void
}

export function NuevaOrden({ operador, proveedores, onGuardar, onCancelar }: NuevaOrdenProps) {
  const [proveedorId, setProveedorId] = useState<string>('')
  const [fechaEmision, setFechaEmision] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [fechaEntrega, setFechaEntrega] = useState<string>('')
  const [observaciones, setObservaciones] = useState<string>('')
  const [items, setItems] = useState<ItemOrden[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [insumosFiltrados, setInsumosFiltrados] = useState<Insumo[]>([])
  const [busquedaInsumo, setBusquedaInsumo] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [loadingInsumos, setLoadingInsumos] = useState(false)

  // Cargar insumos cuando se selecciona un proveedor
  useEffect(() => {
    if (proveedorId) {
      fetchInsumosProveedor(proveedorId)
    } else {
      setInsumos([])
      setInsumosFiltrados([])
    }
  }, [proveedorId])

  // Filtrar insumos por búsqueda
  useEffect(() => {
    if (busquedaInsumo && insumos.length > 0) {
      const filtrados = insumos.filter(
        i => i.nombre.toLowerCase().includes(busquedaInsumo.toLowerCase()) ||
             i.codigo.toLowerCase().includes(busquedaInsumo.toLowerCase())
      )
      setInsumosFiltrados(filtrados)
    } else {
      setInsumosFiltrados(insumos)
    }
  }, [busquedaInsumo, insumos])

  const fetchInsumosProveedor = async (provId: string) => {
    try {
      setLoadingInsumos(true)
      // Primero intentamos obtener insumos del proveedor específico
      const res = await fetch(`/api/insumos?proveedorId=${provId}&activos=true`)
      const data = await res.json()
      
      if (Array.isArray(data) && data.length > 0) {
        setInsumos(data)
        setInsumosFiltrados(data)
      } else {
        // Si no hay insumos del proveedor, traemos todos
        const resAll = await fetch('/api/insumos?activos=true')
        const dataAll = await resAll.json()
        setInsumos(Array.isArray(dataAll) ? dataAll : [])
        setInsumosFiltrados(Array.isArray(dataAll) ? dataAll : [])
      }
    } catch (error) {
      console.error('Error al obtener insumos:', error)
      toast.error('Error al cargar los insumos')
    } finally {
      setLoadingInsumos(false)
    }
  }

  const proveedorSeleccionado = proveedores.find(p => p.id === proveedorId)

  const agregarItem = () => {
    setItems([
      ...items,
      {
        insumoId: '',
        insumo: null,
        cantidad: 1,
        precioUnitario: 0,
        subtotal: 0
      }
    ])
  }

  const eliminarItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const actualizarItem = (index: number, campo: keyof ItemOrden, valor: string | number) => {
    const nuevosItems = [...items]
    
    if (campo === 'insumoId') {
      const insumoSeleccionado = insumos.find(i => i.id === valor)
      nuevosItems[index] = {
        ...nuevosItems[index],
        insumoId: valor as string,
        insumo: insumoSeleccionado || null,
        precioUnitario: insumoSeleccionado?.precioUnitario || 0,
        subtotal: (insumoSeleccionado?.precioUnitario || 0) * nuevosItems[index].cantidad
      }
    } else if (campo === 'cantidad') {
      const cantidad = parseFloat(valor as string) || 0
      nuevosItems[index] = {
        ...nuevosItems[index],
        cantidad,
        subtotal: cantidad * nuevosItems[index].precioUnitario
      }
    } else if (campo === 'precioUnitario') {
      const precio = parseFloat(valor as string) || 0
      nuevosItems[index] = {
        ...nuevosItems[index],
        precioUnitario: precio,
        subtotal: precio * nuevosItems[index].cantidad
      }
    }
    
    setItems(nuevosItems)
  }

  // Cálculos
  const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0)
  const iva = subtotal * 0.21
  const total = subtotal + iva

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(value || 0)
  }

  const validarFormulario = (): boolean => {
    if (!proveedorId) {
      toast.error('Debe seleccionar un proveedor')
      return false
    }
    if (items.length === 0) {
      toast.error('Debe agregar al menos un item')
      return false
    }
    if (items.some(item => !item.insumoId || item.cantidad <= 0)) {
      toast.error('Todos los items deben tener insumo y cantidad válida')
      return false
    }
    return true
  }

  const handleGuardar = async (enviar: boolean = false) => {
    if (!validarFormulario()) return
    
    try {
      setLoading(true)
      
      const ordenData = {
        proveedorId,
        fechaEmision,
        fechaEntrega: fechaEntrega || null,
        estado: enviar ? 'APROBADA' : 'PENDIENTE',
        observaciones,
        operadorId: operador.id,
        detalles: items.map(item => ({
          insumoId: item.insumoId,
          cantidadPedida: item.cantidad,
          precioUnitario: item.precioUnitario
        }))
      }
      
      const res = await fetch('/api/ordenes-compra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ordenData)
      })
      
      if (res.ok) {
        onGuardar()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Error al crear la orden')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al crear la orden de compra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Datos del Proveedor */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-600" />
            Datos del Proveedor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Proveedor *</Label>
              <Select value={proveedorId} onValueChange={setProveedorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {proveedores.map(prov => (
                    <SelectItem key={prov.id} value={prov.id}>
                      {prov.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {proveedorSeleccionado && (
              <div className="space-y-2 p-3 bg-stone-50 rounded-lg">
                <Label className="text-xs text-stone-500">Información de contacto</Label>
                <div className="space-y-1 text-sm">
                  {proveedorSeleccionado.cuit && (
                    <p><span className="font-medium">CUIT:</span> {proveedorSeleccionado.cuit}</p>
                  )}
                  {proveedorSeleccionado.telefono && (
                    <p className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {proveedorSeleccionado.telefono}
                    </p>
                  )}
                  {proveedorSeleccionado.email && (
                    <p className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {proveedorSeleccionado.email}
                    </p>
                  )}
                  {proveedorSeleccionado.contacto && (
                    <p><span className="font-medium">Contacto:</span> {proveedorSeleccionado.contacto}</p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha de Emisión</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  type="date"
                  value={fechaEmision}
                  onChange={(e) => setFechaEmision(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fecha Esperada de Entrega</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  type="date"
                  value={fechaEntrega}
                  onChange={(e) => setFechaEntrega(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items de la Orden */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              Items de la Orden
            </CardTitle>
            <Button
              type="button"
              size="sm"
              onClick={agregarItem}
              disabled={!proveedorId}
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!proveedorId ? (
            <div className="text-center py-8 text-stone-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Seleccione un proveedor para agregar items</p>
            </div>
          ) : loadingInsumos ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500" />
              <p className="mt-2 text-stone-500">Cargando insumos...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-stone-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay items agregados</p>
              <p className="text-sm">Haga clic en "Agregar Item" para comenzar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Búsqueda de insumos */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  placeholder="Buscar insumo por nombre o código..."
                  value={busquedaInsumo}
                  onChange={(e) => setBusquedaInsumo(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              {/* Tabla de items */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-stone-50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium text-stone-600">Insumo</th>
                      <th className="text-center p-3 text-sm font-medium text-stone-600 w-24">Unidad</th>
                      <th className="text-center p-3 text-sm font-medium text-stone-600 w-28">Cantidad</th>
                      <th className="text-center p-3 text-sm font-medium text-stone-600 w-32">Precio Unit.</th>
                      <th className="text-right p-3 text-sm font-medium text-stone-600 w-32">Subtotal</th>
                      <th className="p-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((item, index) => (
                      <tr key={index} className="hover:bg-stone-50">
                        <td className="p-3">
                          <Select
                            value={item.insumoId}
                            onValueChange={(v) => actualizarItem(index, 'insumoId', v)}
                          >
                            <SelectTrigger className="w-full min-w-[200px]">
                              <SelectValue placeholder="Seleccionar insumo" />
                            </SelectTrigger>
                            <SelectContent>
                              {insumosFiltrados.map(ins => (
                                <SelectItem key={ins.id} value={ins.id}>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs text-stone-400">{ins.codigo}</span>
                                    <span>{ins.nombre}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="outline">
                            {item.insumo?.unidadMedida || '-'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.cantidad || ''}
                            onChange={(e) => actualizarItem(index, 'cantidad', e.target.value)}
                            className="w-24 text-center mx-auto"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.precioUnitario || ''}
                            onChange={(e) => actualizarItem(index, 'precioUnitario', e.target.value)}
                            className="w-28 text-center mx-auto"
                          />
                        </td>
                        <td className="p-3 text-right font-semibold">
                          {formatCurrency(item.subtotal)}
                        </td>
                        <td className="p-3">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => eliminarItem(index)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Totales */}
      {items.length > 0 && (
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
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">IVA (21%):</span>
                <span>{formatCurrency(iva)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-amber-600">{formatCurrency(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Observaciones */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Observaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Notas o instrucciones especiales para el proveedor..."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancelar}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleGuardar(false)}
          disabled={loading || items.length === 0}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Guardar Borrador
        </Button>
        <Button
          type="button"
          className="bg-amber-500 hover:bg-amber-600"
          onClick={() => handleGuardar(true)}
          disabled={loading || items.length === 0}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Enviar a Proveedor
        </Button>
      </div>
    </div>
  )
}

export default NuevaOrden
