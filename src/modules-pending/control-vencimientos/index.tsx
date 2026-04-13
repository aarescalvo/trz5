'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { 
  Clock, AlertTriangle, CheckCircle, Package, Calendar,
  Filter, Download, RefreshCw, ArrowUpRight, Trash2
} from 'lucide-react'

interface Props {
  operador?: { id: string; nombre: string; rol: string }
}

interface ItemStock {
  id: string
  tipo: string
  codigo: string
  producto: string
  peso: number
  fechaIngreso: string
  fechaVencimiento: string
  diasRestantes: number
  camara?: string
  prioridad: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA'
}

export function ControlVencimientosModule({ operador }: Props) {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<ItemStock[]>([])
  const [tabActivo, setTabActivo] = useState<'criticos' | 'proximos' | 'todos'>('criticos')

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stock/vencimientos')
      const data = await res.json()
      if (data.success) {
        setItems(data.data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getItemsFiltrados = () => {
    switch (tabActivo) {
      case 'criticos':
        return items.filter(i => i.diasRestantes <= 7)
      case 'proximos':
        return items.filter(i => i.diasRestantes > 7 && i.diasRestantes <= 15)
      default:
        return items
    }
  }

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'CRITICA': return 'bg-red-100 text-red-700 border-red-300'
      case 'ALTA': return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'MEDIA': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      default: return 'bg-green-100 text-green-700 border-green-300'
    }
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR')
  }

  const itemsFiltrados = getItemsFiltrados()

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Control de Vencimientos</h1>
            <p className="text-stone-500 mt-1">Gestión FIFO y alertas de vencimiento</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchItems}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Críticos (≤7d)</p>
                  <p className="text-xl font-bold text-red-600">
                    {items.filter(i => i.diasRestantes <= 7).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Próximos (8-15d)</p>
                  <p className="text-xl font-bold text-orange-600">
                    {items.filter(i => i.diasRestantes > 7 && i.diasRestantes <= 15).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Normales (16-30d)</p>
                  <p className="text-xl font-bold text-yellow-600">
                    {items.filter(i => i.diasRestantes > 15 && i.diasRestantes <= 30).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">OK (&gt;30d)</p>
                  <p className="text-xl font-bold text-green-600">
                    {items.filter(i => i.diasRestantes > 30).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={tabActivo} onValueChange={(v) => setTabActivo(v as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="criticos" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Críticos
            </TabsTrigger>
            <TabsTrigger value="proximos" className="flex items-center gap-2">
              <Clock className="w-4 h-4" /> Próximos
            </TabsTrigger>
            <TabsTrigger value="todos" className="flex items-center gap-2">
              <Package className="w-4 h-4" /> Todos
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tabActivo}>
            <Card className="border-0 shadow-md">
              <CardContent className="p-0">
                <div className="divide-y">
                  {itemsFiltrados.length === 0 ? (
                    <div className="p-8 text-center text-stone-400">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                      <p>No hay items en esta categoría</p>
                    </div>
                  ) : (
                    itemsFiltrados.map(item => (
                      <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-stone-50">
                        <div className={`p-2 rounded-lg ${getPrioridadColor(item.prioridad).split(' ')[0]}`}>
                          <Package className={`w-5 h-5 ${getPrioridadColor(item.prioridad).split(' ')[1]}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{item.producto}</p>
                            <Badge variant="outline">{item.tipo}</Badge>
                          </div>
                          <p className="text-sm text-stone-500">
                            {item.codigo} • {item.peso} kg • Cámara: {item.camara || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-stone-500">Vence: {formatearFecha(item.fechaVencimiento)}</p>
                          <p className={`text-lg font-bold ${
                            item.diasRestantes <= 7 ? 'text-red-600' : 
                            item.diasRestantes <= 15 ? 'text-orange-600' : 'text-stone-600'
                          }`}>
                            {item.diasRestantes} días
                          </p>
                        </div>
                        <Badge className={getPrioridadColor(item.prioridad)}>
                          {item.prioridad}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default ControlVencimientosModule
