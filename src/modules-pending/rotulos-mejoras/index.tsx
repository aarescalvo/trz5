'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { 
  Tag, Plus, Edit, Trash2, Copy, Eye, Download, Upload, 
  Settings, Palette, Layout, QrCode, Printer, Save, RotateCcw,
  Move, Type, Square, ImageIcon, Barcode
} from 'lucide-react'

// Tipos
interface RotuloElement {
  id: string
  tipo: 'TEXTO' | 'CODIGO_BARRAS' | 'LINEA' | 'RECTANGULO' | 'IMAGEN' | 'QR'
  campo?: string
  textoFijo?: string
  posX: number
  posY: number
  ancho: number
  alto: number
  fuente: string
  tamano: number
  negrita: boolean
  alineacion: 'LEFT' | 'CENTER' | 'RIGHT'
  tipoCodigo?: string
  altoCodigo?: number
  mostrarTexto?: boolean
  grosorLinea?: number
  color?: string
  orden: number
}

interface Rotulo {
  id: string
  nombre: string
  codigo: string
  tipo: string
  ancho: number
  alto: number
  dpi: number
  tipoImpresora: 'ZEBRA' | 'DATAMAX'
  modeloImpresora: string
  contenido: string
  elementos: RotuloElement[]
  esDefault: boolean
  activo: boolean
}

interface Props {
  operador?: {
    id: string
    nombre: string
    rol: string
  }
}

// Variables disponibles
const VARIABLES_DISPONIBLES = [
  { id: 'NUMERO', nombre: 'Número de Animal', ejemplo: '15' },
  { id: 'TROPA', nombre: 'Código de Tropa', ejemplo: 'B 2026 0012' },
  { id: 'TIPO', nombre: 'Tipo de Animal', ejemplo: 'VA' },
  { id: 'PESO', nombre: 'Peso', ejemplo: '452' },
  { id: 'CODIGO', nombre: 'Código Completo', ejemplo: 'B20260012-015' },
  { id: 'RAZA', nombre: 'Raza', ejemplo: 'Angus' },
  { id: 'FECHA', nombre: 'Fecha', ejemplo: '20/03/2026' },
  { id: 'FECHA_VENC', nombre: 'Fecha Vencimiento', ejemplo: '19/04/2026' },
  { id: 'PRODUCTO', nombre: 'Producto', ejemplo: 'MEDIA RES' },
  { id: 'GARRON', nombre: 'Garrón', ejemplo: '42' },
  { id: 'LADO', nombre: 'Lado', ejemplo: 'I' },
  { id: 'SIGLA', nombre: 'Sigla', ejemplo: 'A' },
  { id: 'PESO_NETO', nombre: 'Peso Neto', ejemplo: '118.5' },
  { id: 'USUARIO_FAENA', nombre: 'Usuario Faena', ejemplo: 'Juan Pérez' },
  { id: 'MATRICULA', nombre: 'Matrícula', ejemplo: '12345' },
  { id: 'CODIGO_BARRAS', nombre: 'Código de Barras', ejemplo: 'B202600120151' },
]

// Modelos de impresora disponibles
const MODELOS_IMPRESORA = {
  ZEBRA: [
    { id: 'ZT410', nombre: 'Zebra ZT410', dpi: 300 },
    { id: 'ZT230', nombre: 'Zebra ZT230', dpi: 203 },
    { id: 'ZD420', nombre: 'Zebra ZD420', dpi: 203 },
    { id: 'ZD620', nombre: 'Zebra ZD620', dpi: 300 },
    { id: 'GK420', nombre: 'Zebra GK420', dpi: 203 },
  ],
  DATAMAX: [
    { id: 'MARK_II', nombre: 'Datamax Mark II', dpi: 203 },
    { id: 'I-4208', nombre: 'Datamax I-4208', dpi: 203 },
    { id: 'I-4212', nombre: 'Datamax I-4212', dpi: 203 },
    { id: 'I-4406', nombre: 'Datamax I-4406', dpi: 203 },
  ]
}

export function RotulosMejorasModule({ operador }: Props) {
  const [rotulos, setRotulos] = useState<Rotulo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRotulo, setSelectedRotulo] = useState<Rotulo | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [previewData, setPreviewData] = useState<Record<string, string>>({})
  
  // Estado para nuevo elemento
  const [nuevoElemento, setNuevoElemento] = useState<Partial<RotuloElement>>({
    tipo: 'TEXTO',
    posX: 0,
    posY: 0,
    ancho: 100,
    alto: 30,
    fuente: '0',
    tamano: 10,
    negrita: false,
    alineacion: 'LEFT',
    orden: 0
  })

  useEffect(() => {
    fetchRotulos()
  }, [])

  const fetchRotulos = async () => {
    try {
      const res = await fetch('/api/rotulos')
      const data = await res.json()
      if (data.success) {
        setRotulos(data.data)
      }
    } catch (error) {
      console.error('Error fetching rotulos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Editor visual de arrastrar y soltar
  const EditorVisual = () => (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layout className="w-5 h-5" />
          Editor Visual
        </CardTitle>
        <CardDescription>
          Arrastra elementos para diseñar tu etiqueta
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Canvas de edición */}
        <div 
          className="relative border-2 border-dashed border-stone-300 bg-white mx-auto"
          style={{ 
            width: `${selectedRotulo?.ancho || 80}mm`,
            height: `${selectedRotulo?.alto || 50}mm`,
            minWidth: '200px',
            minHeight: '100px'
          }}
        >
          {selectedRotulo?.elementos.map((el, idx) => (
            <div
              key={el.id}
              className="absolute cursor-move hover:ring-2 hover:ring-amber-500"
              style={{
                left: `${el.posX}pt`,
                top: `${el.posY}pt`,
                width: `${el.ancho}pt`,
                height: el.tipo === 'LINEA' ? `${el.grosorLinea || 2}pt` : `${el.alto}pt`,
                fontSize: `${el.tamano}pt`,
                fontWeight: el.negrita ? 'bold' : 'normal',
                textAlign: el.alineacion.toLowerCase() as 'left' | 'center' | 'right',
                border: el.tipo === 'RECTANGULO' ? `${el.grosorLinea || 1}px solid black` : 'none',
                backgroundColor: el.tipo === 'RECTANGULO' ? 'transparent' : 'transparent'
              }}
            >
              {el.tipo === 'TEXTO' && (
                <span>{el.textoFijo || `{{${el.campo}}}`}</span>
              )}
              {el.tipo === 'CODIGO_BARRAS' && (
                <div className="flex flex-col items-center">
                  <Barcode className="w-full h-4" />
                  {el.mostrarTexto && <span className="text-xs">{`{{${el.campo}}}`}</span>}
                </div>
              )}
              {el.tipo === 'QR' && (
                <QrCode className="w-full h-full" />
              )}
              {el.tipo === 'LINEA' && (
                <div className="w-full bg-black" style={{ height: `${el.grosorLinea || 2}pt` }} />
              )}
              {el.tipo === 'IMAGEN' && (
                <ImageIcon className="w-full h-full text-stone-400" />
              )}
            </div>
          ))}
        </div>

        {/* Controles de elementos */}
        <div className="mt-4 grid grid-cols-5 gap-2">
          <Button variant="outline" size="sm" onClick={() => agregarElemento('TEXTO')}>
            <Type className="w-4 h-4 mr-1" /> Texto
          </Button>
          <Button variant="outline" size="sm" onClick={() => agregarElemento('CODIGO_BARRAS')}>
            <Barcode className="w-4 h-4 mr-1" /> Cód. Barras
          </Button>
          <Button variant="outline" size="sm" onClick={() => agregarElemento('QR')}>
            <QrCode className="w-4 h-4 mr-1" /> QR
          </Button>
          <Button variant="outline" size="sm" onClick={() => agregarElemento('LINEA')}>
            <Square className="w-4 h-4 mr-1" /> Línea
          </Button>
          <Button variant="outline" size="sm" onClick={() => agregarElemento('RECTANGULO')}>
            <Square className="w-4 h-4 mr-1" /> Rectángulo
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  // Agregar elemento
  const agregarElemento = (tipo: RotuloElement['tipo']) => {
    if (!selectedRotulo) return
    
    const nuevoEl: RotuloElement = {
      id: `el-${Date.now()}`,
      tipo,
      posX: 10,
      posY: 10 + selectedRotulo.elementos.length * 30,
      ancho: tipo === 'LINEA' ? 200 : 100,
      alto: tipo === 'CODIGO_BARRAS' ? 60 : 30,
      fuente: '0',
      tamano: 10,
      negrita: false,
      alineacion: 'LEFT',
      tipoCodigo: 'CODE128',
      altoCodigo: 60,
      mostrarTexto: true,
      grosorLinea: 2,
      color: 'B',
      orden: selectedRotulo.elementos.length
    }

    setSelectedRotulo({
      ...selectedRotulo,
      elementos: [...selectedRotulo.elementos, nuevoEl]
    })
    toast.success('Elemento agregado')
  }

  // Panel de propiedades
  const PanelPropiedades = () => (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Propiedades
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dimensiones */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Ancho (mm)</Label>
            <Input 
              type="number" 
              value={selectedRotulo?.ancho || 80}
              onChange={(e) => setSelectedRotulo(prev => prev ? {...prev, ancho: parseInt(e.target.value)} : null)}
            />
          </div>
          <div>
            <Label>Alto (mm)</Label>
            <Input 
              type="number" 
              value={selectedRotulo?.alto || 50}
              onChange={(e) => setSelectedRotulo(prev => prev ? {...prev, alto: parseInt(e.target.value)} : null)}
            />
          </div>
        </div>

        {/* Impresora */}
        <div className="space-y-2">
          <Label>Tipo de Impresora</Label>
          <Select 
            value={selectedRotulo?.tipoImpresora || 'ZEBRA'}
            onValueChange={(v) => setSelectedRotulo(prev => prev ? {...prev, tipoImpresora: v as 'ZEBRA' | 'DATAMAX'} : null)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ZEBRA">Zebra (ZPL)</SelectItem>
              <SelectItem value="DATAMAX">Datamax (DPL)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Modelo</Label>
          <Select 
            value={selectedRotulo?.modeloImpresora || 'ZT410'}
            onValueChange={(v) => {
              const modelo = [...MODELOS_IMPRESORA.ZEBRA, ...MODELOS_IMPRESORA.DATAMAX].find(m => m.id === v)
              setSelectedRotulo(prev => prev ? {...prev, modeloImpresora: v, dpi: modelo?.dpi || 203} : null)
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODELOS_IMPRESORA.ZEBRA.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.nombre} ({m.dpi} DPI)</SelectItem>
              ))}
              {MODELOS_IMPRESORA.DATAMAX.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.nombre} ({m.dpi} DPI)</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lista de variables */}
        <div>
          <Label className="mb-2 block">Variables Disponibles</Label>
          <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
            {VARIABLES_DISPONIBLES.map(v => (
              <div 
                key={v.id}
                className="flex justify-between text-xs p-1 hover:bg-stone-100 rounded cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(`{{${v.id}}}`)
                  toast.success(`Variable {{${v.id}}} copiada`)
                }}
              >
                <span className="font-mono text-amber-600">{'{{' + v.id + '}}'}</span>
                <span className="text-stone-500">{v.nombre}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          <Button className="flex-1" onClick={handleGuardarRotulo}>
            <Save className="w-4 h-4 mr-1" /> Guardar
          </Button>
          <Button variant="outline" onClick={() => setSelectedRotulo(null)}>
            <RotateCcw className="w-4 h-4 mr-1" /> Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  // Vista previa
  const VistaPrevia = () => (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Vista Previa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="bg-white border shadow-inner mx-auto p-4"
          style={{ 
            width: `${selectedRotulo?.ancho || 80}mm`,
            height: `${selectedRotulo?.alto || 50}mm`
          }}
        >
          {/* Simulación de contenido */}
          <div className="text-center">
            <p className="font-bold text-lg">{selectedRotulo?.nombre || 'Etiqueta'}</p>
            <p className="text-xs text-stone-500">{selectedRotulo?.codigo}</p>
            <div className="mt-2 flex justify-center">
              <Barcode className="w-32 h-12 text-stone-800" />
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1">
            <Printer className="w-4 h-4 mr-1" /> Imprimir Prueba
          </Button>
          <Button variant="outline" className="flex-1">
            <Download className="w-4 h-4 mr-1" /> Exportar ZPL
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  // Guardar rótulo
  const handleGuardarRotulo = async () => {
    if (!selectedRotulo) return

    try {
      const res = await fetch('/api/rotulos', {
        method: selectedRotulo.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedRotulo)
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Rótulo guardado correctamente')
        fetchRotulos()
        setEditMode(false)
      }
    } catch (error) {
      toast.error('Error al guardar el rótulo')
    }
  }

  // Lista de rótulos
  const ListaRotulos = () => (
    <Card className="border-0 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Plantillas de Rótulos
        </CardTitle>
        <Button size="sm" onClick={() => {
          setSelectedRotulo({
            id: '',
            nombre: 'Nuevo Rótulo',
            codigo: `ROT-${Date.now()}`,
            tipo: 'MEDIA_RES',
            ancho: 80,
            alto: 50,
            dpi: 203,
            tipoImpresora: 'ZEBRA',
            modeloImpresora: 'ZT410',
            contenido: '',
            elementos: [],
            esDefault: false,
            activo: true
          })
          setEditMode(true)
        }}>
          <Plus className="w-4 h-4 mr-1" /> Nueva Plantilla
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {rotulos.map(rotulo => (
            <div 
              key={rotulo.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-stone-50 cursor-pointer"
              onClick={() => {
                setSelectedRotulo(rotulo)
                setEditMode(true)
              }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded">
                  <Tag className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium">{rotulo.nombre}</p>
                  <p className="text-xs text-stone-500">
                    {rotulo.tipoImpresora} • {rotulo.ancho}x{rotulo.alto}mm • {rotulo.dpi} DPI
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {rotulo.esDefault && (
                  <Badge className="bg-amber-500">Default</Badge>
                )}
                <Badge variant="outline">{rotulo.tipo}</Badge>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDuplicarRotulo(rotulo)
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  // Duplicar rótulo
  const handleDuplicarRotulo = async (rotulo: Rotulo) => {
    try {
      const nuevoRotulo = {
        ...rotulo,
        id: '',
        nombre: `${rotulo.nombre} (copia)`,
        codigo: `${rotulo.codigo}-copia`,
        esDefault: false
      }
      const res = await fetch('/api/rotulos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoRotulo)
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Rótulo duplicado')
        fetchRotulos()
      }
    } catch (error) {
      toast.error('Error al duplicar')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">
              Diseñador de Etiquetas
            </h1>
            <p className="text-stone-500 mt-1">
              Editor visual avanzado para rótulos ZPL/DPL
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-1" /> Importar
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-1" /> Exportar Todo
            </Button>
          </div>
        </div>

        {/* Contenido principal */}
        {editMode && selectedRotulo ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Editor visual */}
            <div className="lg:col-span-2">
              <EditorVisual />
            </div>
            {/* Panel de propiedades */}
            <div className="space-y-4">
              <PanelPropiedades />
              <VistaPrevia />
            </div>
          </div>
        ) : (
          <ListaRotulos />
        )}
      </div>
    </div>
  )
}

export default RotulosMejorasModule
