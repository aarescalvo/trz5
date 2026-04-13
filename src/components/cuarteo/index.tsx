'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { 
  Scissors, Loader2, RefreshCw, Plus, Package, CheckCircle
} from 'lucide-react'
import { TextoEditable, EditableBlock, useEditor } from '@/components/ui/editable-screen'

interface Operador {
  id: string
  nombre: string
  rol: string
  permisos?: Record<string, boolean>
}

interface Camara {
  id: string
  nombre: string
  tipo: string
}

interface Cuarteo {
  id: string
  fecha: string
  mediaResId: string | null
  tipoCorte: string
  pesoTotal: number
  pesoDelantero: number | null
  pesoTrasero: number | null
  camara: { id: string; nombre: string } | null
  operador: { id: string; nombre: string } | null
  observaciones: string | null
}

interface Props {
  operador: Operador
}

export function CuarteoModule({ operador }: Props) {
  const { editMode, getTexto, setTexto, getBloque, updateBloque } = useEditor()
  const [cuarteos, setCuarteos] = useState<Cuarteo[]>([])
  const [camaras, setCameras] = useState<Camara[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'TODOS' | 'EN_PROCESO' | 'COMPLETADO'>('TODOS')
  
  const [mediaResId, setMediaResId] = useState('')
  const [tipoCorte, setTipoCorte] = useState<string>('DELANTERO_TRASERO')
  const [pesoTotal, setPesoTotal] = useState('')
  const [pesoDelantero, setPesoDelantero] = useState('')
  const [pesoTrasero, setPesoTrasero] = useState('')
  const [camaraDestino, setCamaraDestino] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCuarteos()
    fetchCameras()
  }, [])

  const fetchCameras = async () => {
    try {
      const res = await fetch('/api/camaras')
      const data = await res.json()
      if (data.success) {
        setCameras(data.data.filter((c: Camara) => c.activo !== false))
      }
    } catch (error) {
      console.error('Error fetching cámaras:', error)
    }
  }

  const fetchCuarteos = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cuarteo')
      const data = await res.json()
      if (data.success) {
        setCuarteos(data.data)
      } else {
        toast.error('Error al cargar cuarteos')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar cuarteos')
    } finally {
      setLoading(false)
    }
  }

  const handleIniciarCuarteo = async () => {
    if (!pesoTotal) {
      toast.error('El peso total es obligatorio')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/cuarteo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaResId: mediaResId || null,
          tipoCorte,
          pesoTotal: parseFloat(pesoTotal),
          pesoDelantero: pesoDelantero ? parseFloat(pesoDelantero) : null,
          pesoTrasero: pesoTrasero ? parseFloat(pesoTrasero) : null,
          camaraId: camaraDestino || null,
          operadorId: operador.id
        })
      })

      const data = await res.json()
      if (data.success) {
        setCuarteos([data.data, ...cuarteos])
        setMediaResId('')
        setPesoTotal('')
        setPesoDelantero('')
        setPesoTrasero('')
        setCamaraDestino('')
        toast.success('Cuarteo registrado correctamente')
      } else {
        toast.error(data.error || 'Error al registrar cuarteo')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al registrar cuarteo')
    } finally {
      setSaving(false)
    }
  }

  const getTipoCorteLabel = (tipo: string) => {
    switch (tipo) {
      case 'DELANTERO_TRASERO': return 'Delantero/Trasero'
      case 'CUARTOS_IGUALES': return 'Cuartos Iguales'
      default: return tipo
    }
  }

  const cuarteosFiltrados = cuarteos.filter(c => {
    if (filtro === 'TODOS') return true
    return true // Por ahora no hay estado en el modelo
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <EditableBlock bloqueId="header" label="Encabezado">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
                <Scissors className="w-8 h-8 text-amber-500" />
                <TextoEditable id="cuarteo-titulo" original="Cuarteo" tag="span" />
              </h1>
              <p className="text-stone-500 mt-1">
                <TextoEditable id="cuarteo-subtitulo" original="División de medias en cuartos" tag="span" />
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchCuarteos} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                <TextoEditable id="btn-actualizar" original="Actualizar" tag="span" />
              </Button>
            </div>
          </div>
        </EditableBlock>

        {/* Resumen */}
        <EditableBlock bloqueId="resumenCards" label="Tarjetas de Resumen">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('TODOS')}>
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-total" original="Total" tag="span" /></p>
                <p className="text-3xl font-bold text-stone-800">{cuarteos.length}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-peso-total" original="Peso Total" tag="span" /></p>
                <p className="text-3xl font-bold text-amber-600">{cuarteos.reduce((acc, c) => acc + (c.pesoTotal || 0), 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })} kg</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-delantero" original="Delantero" tag="span" /></p>
                <p className="text-3xl font-bold text-emerald-600">{cuarteos.reduce((acc, c) => acc + (c.pesoDelantero || 0), 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })} kg</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-trasero" original="Trasero" tag="span" /></p>
                <p className="text-3xl font-bold text-blue-600">{cuarteos.reduce((acc, c) => acc + (c.pesoTrasero || 0), 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })} kg</p>
              </CardContent>
            </Card>
          </div>
        </EditableBlock>

        {/* Formulario */}
        <EditableBlock bloqueId="formulario" label="Formulario">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-500" />
                <TextoEditable id="titulo-registrar-cuarteo" original="Registrar Cuarteo" tag="span" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label><TextoEditable id="label-media-res" original="Media Res ID" tag="span" /></Label>
                  <Input value={mediaResId} onChange={(e) => setMediaResId(e.target.value)} placeholder="Opcional" />
                </div>
                <div className="space-y-2">
                  <Label><TextoEditable id="label-tipo-corte" original="Tipo Corte" tag="span" /></Label>
                  <Select value={tipoCorte} onValueChange={setTipoCorte}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DELANTERO_TRASERO">Delantero/Trasero</SelectItem>
                      <SelectItem value="CUARTOS_IGUALES">Cuartos Iguales</SelectItem>
                      <SelectItem value="OTRO">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label><TextoEditable id="label-peso-total" original="Peso Total (kg)" tag="span" /> *</Label>
                  <Input type="number" step="0.1" value={pesoTotal} onChange={(e) => setPesoTotal(e.target.value)} placeholder="0.0" />
                </div>
                <div className="space-y-2">
                  <Label><TextoEditable id="label-peso-delantero" original="Peso Delantero (kg)" tag="span" /></Label>
                  <Input type="number" step="0.1" value={pesoDelantero} onChange={(e) => setPesoDelantero(e.target.value)} placeholder="0.0" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="space-y-2">
                  <Label><TextoEditable id="label-peso-trasero" original="Peso Trasero (kg)" tag="span" /></Label>
                  <Input type="number" step="0.1" value={pesoTrasero} onChange={(e) => setPesoTrasero(e.target.value)} placeholder="0.0" />
                </div>
                <div className="space-y-2">
                  <Label><TextoEditable id="label-camara-destino" original="Cámara Destino" tag="span" /></Label>
                  <Select value={camaraDestino} onValueChange={setCamaraDestino}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {camaras.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleIniciarCuarteo} className="w-full bg-amber-500 hover:bg-amber-600" disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Scissors className="w-4 h-4 mr-2" />}
                    <TextoEditable id="btn-registrar" original="Registrar" tag="span" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </EditableBlock>

        {/* Tabla */}
        <EditableBlock bloqueId="tablaCuarteos" label="Tabla de Cuarteos">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                <TextoEditable id="titulo-cuarteos" original="Registros de Cuarteo" tag="span" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
              ) : cuarteosFiltrados.length === 0 ? (
                <div className="py-12 text-center text-stone-400">
                  <Scissors className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p><TextoEditable id="msg-no-hay-cuarteos" original="No hay registros de cuarteo" tag="span" /></p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead><TextoEditable id="th-fecha" original="Fecha" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-tipo-corte" original="Tipo Corte" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-peso-total" original="Peso Total" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-peso-delantero" original="Peso Delantero" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-peso-trasero" original="Peso Trasero" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-camara" original="Cámara" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-operador" original="Operador" tag="span" /></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cuarteosFiltrados.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{new Date(c.fecha).toLocaleDateString('es-AR')}</TableCell>
                        <TableCell>{getTipoCorteLabel(c.tipoCorte)}</TableCell>
                        <TableCell className="font-medium">{c.pesoTotal?.toLocaleString('es-AR', { maximumFractionDigits: 1 })} kg</TableCell>
                        <TableCell>{c.pesoDelantero?.toLocaleString('es-AR', { maximumFractionDigits: 1 }) || '-'} kg</TableCell>
                        <TableCell>{c.pesoTrasero?.toLocaleString('es-AR', { maximumFractionDigits: 1 }) || '-'} kg</TableCell>
                        <TableCell>{c.camara?.nombre || '-'}</TableCell>
                        <TableCell>{c.operador?.nombre || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </EditableBlock>
      </div>
    </div>
  )
}

export default CuarteoModule
