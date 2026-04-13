'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { ArrowRightLeft, Loader2, Search, Plus, Scale } from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  permisos: Record<string, boolean>
}

export function MovimientosDesposteModule({ operador }: { operador: Operador }) {
  const [loading, setLoading] = useState(true)
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Form state
  const [tipoMovimiento, setTipoMovimiento] = useState('DECOMISO')
  const [descripcion, setDescripcion] = useState('')
  const [kilos, setKilos] = useState(0)
  const [observaciones, setObservaciones] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/movimientos-desposte')
      const data = await res.json()
      if (data.success) {
        setMovimientos(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGuardar = async () => {
    if (!tipoMovimiento || kilos <= 0) {
      toast.error('Complete todos los campos obligatorios')
      return
    }
    
    setProcessing(true)
    try {
      const res = await fetch('/api/movimientos-desposte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoMovimiento,
          descripcion,
          kilos,
          observaciones,
          operadorId: operador.id
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast.success('Movimiento registrado correctamente')
        setShowDialog(false)
        resetForm()
        fetchData()
      } else {
        toast.error(data.error || 'Error al registrar movimiento')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setProcessing(false)
    }
  }

  const resetForm = () => {
    setTipoMovimiento('DECOMISO')
    setDescripcion('')
    setKilos(0)
    setObservaciones('')
  }

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'DECOMISO': return 'border-red-300 text-red-600'
      case 'CORTE_GOLPEADO': return 'border-orange-300 text-orange-600'
      case 'HUESO': return 'border-stone-300 text-stone-600'
      case 'GRASA': return 'border-yellow-300 text-yellow-600'
      case 'PRODUCTO_INCOMESTIBLE': return 'border-purple-300 text-purple-600'
      default: return 'border-gray-300 text-gray-600'
    }
  }

  const filteredMovimientos = movimientos.filter(m => 
    m.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.tipoMovimiento?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-3">
              <ArrowRightLeft className="w-8 h-8 text-amber-500" />
              Movimientos Desposte
            </h1>
            <p className="text-stone-500 mt-1">
              Registro de decomisos, pérdidas y productos incomestibles en sala
            </p>
          </div>
          
          <div className="flex gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button className="bg-amber-500 hover:bg-amber-600" onClick={() => setShowDialog(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Nuevo
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500">Total Movimientos</p>
              <p className="text-2xl font-bold text-stone-800">{movimientos.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500">Decomisos</p>
              <p className="text-2xl font-bold text-red-600">
                {movimientos.filter(m => m.tipoMovimiento === 'DECOMISO').reduce((acc, m) => acc + m.kilos, 0).toFixed(1)} kg
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500">Huesos</p>
              <p className="text-2xl font-bold text-stone-600">
                {movimientos.filter(m => m.tipoMovimiento === 'HUESO').reduce((acc, m) => acc + m.kilos, 0).toFixed(1)} kg
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500">Grasas</p>
              <p className="text-2xl font-bold text-yellow-600">
                {movimientos.filter(m => m.tipoMovimiento === 'GRASA').reduce((acc, m) => acc + m.kilos, 0).toFixed(1)} kg
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500">Total Pérdidas</p>
              <p className="text-2xl font-bold text-stone-800">
                {movimientos.reduce((acc, m) => acc + m.kilos, 0).toFixed(1)} kg
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de movimientos */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg font-semibold text-stone-800">
              Registro de Movimientos en Sala de Desposte
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredMovimientos.length === 0 ? (
              <div className="p-12 text-center text-stone-400">
                <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay movimientos registrados</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredMovimientos.map((mov) => (
                  <div key={mov.id} className="p-4 hover:bg-stone-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-stone-100 p-2 rounded-lg">
                        <Scale className="w-5 h-5 text-stone-600" />
                      </div>
                      <div>
                        <p className="font-bold text-stone-800">{mov.descripcion || mov.tipoMovimiento}</p>
                        <p className="text-sm text-stone-500">
                          {new Date(mov.fecha).toLocaleString('es-AR')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-stone-800">{mov.kilos?.toFixed(2)} kg</p>
                      <Badge variant="outline" className={getTipoBadgeColor(mov.tipoMovimiento)}>
                        {mov.tipoMovimiento?.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Nuevo Movimiento */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Movimiento</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Movimiento</Label>
              <Select value={tipoMovimiento} onValueChange={setTipoMovimiento}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DECOMISO">Decomiso</SelectItem>
                  <SelectItem value="CORTE_GOLPEADO">Corte Golpeado</SelectItem>
                  <SelectItem value="KILOS_AFECTADOS">Kilos Afectados</SelectItem>
                  <SelectItem value="HUESO">Hueso</SelectItem>
                  <SelectItem value="GRASA">Grasa</SelectItem>
                  <SelectItem value="PRODUCTO_INCOMESTIBLE">Producto Incomestible</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Detalle del movimiento" />
            </div>
            
            <div className="space-y-2">
              <Label>Kilos</Label>
              <Input type="number" step="0.01" value={kilos || ''} onChange={(e) => setKilos(parseFloat(e.target.value) || 0)} />
            </div>
            
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button className="bg-amber-500 hover:bg-amber-600" onClick={handleGuardar} disabled={processing}>
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
