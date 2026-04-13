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
import { DoorOpen, Loader2, Search, Plus, Warehouse } from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  permisos: Record<string, boolean>
}

export function IngresoDesposteModule({ operador }: { operador: Operador }) {
  const [loading, setLoading] = useState(true)
  const [ingresos, setIngresos] = useState<any[]>([])
  const [camaras, setCamaras] = useState<any[]>([])
  const [cuartos, setCuartos] = useState<any[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Form state
  const [origenTipo, setOrigenTipo] = useState('CUARTO')
  const [origenIds, setOrigenIds] = useState<string[]>([])
  const [pesoEntrada, setPesoEntrada] = useState(0)
  const [camaraId, setCamaraId] = useState('')
  const [observaciones, setObservaciones] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [resIngresos, resCamaras, resCuartos] = await Promise.all([
        fetch('/api/ingreso-desposte'),
        fetch('/api/camaras'),
        fetch('/api/cuarteo/cuartos?estado=EN_CAMARA')
      ])
      
      const dataIngresos = await resIngresos.json()
      const dataCamaras = await resCamaras.json()
      const dataCuartos = await resCuartos.json()
      
      if (dataIngresos.success) setIngresos(dataIngresos.data || [])
      if (dataCamaras.success) setCamaras((dataCamaras.data || []).filter((c: any) => c.tipo === 'CUARTEO'))
      if (dataCuartos.success) setCuartos(dataCuartos.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGuardar = async () => {
    if (pesoEntrada <= 0 || !camaraId) {
      toast.error('Complete peso y cámara de destino')
      return
    }
    
    setProcessing(true)
    try {
      const res = await fetch('/api/ingreso-desposte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origenTipo,
          origenIds,
          pesoEntrada,
          camaraId,
          observaciones,
          operadorId: operador.id
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast.success('Ingreso a desposte registrado correctamente')
        setShowDialog(false)
        resetForm()
        fetchData()
      } else {
        toast.error(data.error || 'Error al registrar ingreso')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setProcessing(false)
    }
  }

  const resetForm = () => {
    setOrigenTipo('CUARTO')
    setOrigenIds([])
    setPesoEntrada(0)
    setCamaraId('')
    setObservaciones('')
  }

  const filteredIngresos = ingresos.filter(i => 
    i.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
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
              <DoorOpen className="w-8 h-8 text-amber-500" />
              Ingreso a Desposte
            </h1>
            <p className="text-stone-500 mt-1">
              Registro de mercadería que ingresa a sala de desposte
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
              Nuevo Ingreso
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500">Ingresos Hoy</p>
              <p className="text-2xl font-bold text-stone-800">
                {ingresos.filter(i => new Date(i.fecha).toDateString() === new Date().toDateString()).length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500">Peso Total Hoy</p>
              <p className="text-2xl font-bold text-stone-800">
                {ingresos
                  .filter(i => new Date(i.fecha).toDateString() === new Date().toDateString())
                  .reduce((acc, i) => acc + (i.pesoEntrada || 0), 0).toFixed(1)} kg
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500">Cuartos Disponibles</p>
              <p className="text-2xl font-bold text-stone-800">{cuartos.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-xs text-stone-500">Cámaras Desposte</p>
              <p className="text-2xl font-bold text-stone-800">{camaras.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de ingresos */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg font-semibold text-stone-800">
              Historial de Ingresos a Desposte
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredIngresos.length === 0 ? (
              <div className="p-12 text-center text-stone-400">
                <Warehouse className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay ingresos registrados</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredIngresos.map((ing) => (
                  <div key={ing.id} className="p-4 hover:bg-stone-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-stone-100 p-2 rounded-lg">
                        <DoorOpen className="w-5 h-5 text-stone-600" />
                      </div>
                      <div>
                        <p className="font-mono font-bold text-stone-800">{ing.codigo}</p>
                        <p className="text-sm text-stone-500">
                          {new Date(ing.fecha).toLocaleString('es-AR')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-stone-800">{ing.pesoEntrada?.toFixed(2)} kg</p>
                        <p className="text-xs text-stone-500">{ing.camara?.nombre}</p>
                      </div>
                      <Badge variant="outline" className="border-amber-300 text-amber-600">
                        {ing.estado || 'En proceso'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Nuevo Ingreso */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Ingreso a Desposte</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Origen</Label>
              <Select value={origenTipo} onValueChange={setOrigenTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUARTO">Cuartos</SelectItem>
                  <SelectItem value="MEDIA_RES">Medias Res</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Peso de Entrada (kg)</Label>
              <Input 
                type="number" 
                step="0.01" 
                value={pesoEntrada || ''} 
                onChange={(e) => setPesoEntrada(parseFloat(e.target.value) || 0)} 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Cámara de Desposte</Label>
              <Select value={camaraId} onValueChange={setCamaraId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cámara" />
                </SelectTrigger>
                <SelectContent>
                  {camaras.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button className="bg-amber-500 hover:bg-amber-600" onClick={handleGuardar} disabled={processing}>
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Registrar Ingreso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
