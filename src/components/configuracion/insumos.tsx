'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import { Package, Plus, Pencil, Trash2 } from 'lucide-react'

interface Insumo {
  id: string
  nombre: string
  codigo?: string
  descripcion?: string
  unidadMedida: string
  stockMinimo: number
  categoriaId?: string
  proveedorId?: string
  activo: boolean
  categoria?: { id: string; nombre: string }
  proveedor?: { id: string; nombre: string }
}

interface Categoria {
  id: string
  nombre: string
}

interface Proveedor {
  id: string
  nombre: string
}

interface Props {
  operador: { id: string; nombre: string; nivel: string }
}

const UNIDADES_MEDIDA = [
  'Unidad',
  'Kilogramo',
  'Gramo',
  'Litro',
  'Mililitro',
  'Metro',
  'Centímetro',
  'Metro cuadrado',
  'Metro cúbico',
  'Caja',
  'Bolsa',
  'Rollos',
  'Bidón',
  'Tambor',
  'Otro',
]

export function Insumos({ operador }: Props) {
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null)
  const [formData, setFormData] = useState<Partial<Insumo>>({
    nombre: '',
    codigo: '',
    descripcion: '',
    unidadMedida: 'Unidad',
    stockMinimo: 0,
    categoriaId: '',
    proveedorId: '',
    activo: true,
  })

  useEffect(() => {
    fetchInsumos()
    fetchCategorias()
    fetchProveedores()
  }, [])

  const fetchInsumos = async () => {
    try {
      const res = await fetch('/api/insumos')
      if (res.ok) {
        const data = await res.json()
        setInsumos(data)
      }
    } catch (error) {
      console.error('Error al cargar insumos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategorias = async () => {
    try {
      const res = await fetch('/api/categorias-insumos')
      if (res.ok) {
        const data = await res.json()
        setCategorias(data.filter((c: Categoria & { activo: boolean }) => c.activo))
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error)
    }
  }

  const fetchProveedores = async () => {
    try {
      const res = await fetch('/api/proveedores')
      if (res.ok) {
        const data = await res.json()
        setProveedores(data.filter((p: Proveedor & { activo: boolean }) => p.activo))
      }
    } catch (error) {
      console.error('Error al cargar proveedores:', error)
    }
  }

  const handleSave = async () => {
    try {
      const url = '/api/insumos'
      const method = editingInsumo ? 'PUT' : 'POST'
      const body = editingInsumo
        ? { ...formData, id: editingInsumo.id }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        fetchInsumos()
        setDialogOpen(false)
        setEditingInsumo(null)
        resetForm()
      }
    } catch (error) {
      console.error('Error al guardar insumo:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este insumo?')) return

    try {
      const res = await fetch(`/api/insumos?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchInsumos()
      }
    } catch (error) {
      console.error('Error al eliminar insumo:', error)
    }
  }

  const handleEdit = (insumo: Insumo) => {
    setEditingInsumo(insumo)
    setFormData({
      ...insumo,
      categoriaId: insumo.categoriaId || '',
      proveedorId: insumo.proveedorId || '',
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      codigo: '',
      descripcion: '',
      unidadMedida: 'Unidad',
      stockMinimo: 0,
      categoriaId: '',
      proveedorId: '',
      activo: true,
    })
  }

  const handleNew = () => {
    setEditingInsumo(null)
    resetForm()
    setDialogOpen(true)
  }

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Insumos
        </CardTitle>
        <Button onClick={handleNew} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Nuevo Insumo
        </Button>
      </CardHeader>
      <CardContent>
        {insumos.length === 0 ? (
          <div className="text-center py-8 text-stone-500">
            No hay insumos registrados
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Stock Mín.</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {insumos.map((insumo) => (
                  <TableRow key={insumo.id}>
                    <TableCell className="font-mono">{insumo.codigo || '-'}</TableCell>
                    <TableCell className="font-medium">{insumo.nombre}</TableCell>
                    <TableCell>{insumo.categoria?.nombre || '-'}</TableCell>
                    <TableCell>{insumo.proveedor?.nombre || '-'}</TableCell>
                    <TableCell>{insumo.unidadMedida}</TableCell>
                    <TableCell>{insumo.stockMinimo}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        insumo.activo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {insumo.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(insumo)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(insumo.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingInsumo ? 'Editar Insumo' : 'Nuevo Insumo'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Código</Label>
                <Input
                  value={formData.codigo || ''}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="Código interno"
                />
              </div>
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={formData.nombre || ''}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre del insumo"
                />
              </div>
            </div>

            <div>
              <Label>Descripción</Label>
              <Textarea
                value={formData.descripcion || ''}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción del insumo"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoría</Label>
                <Select
                  value={formData.categoriaId || ''}
                  onValueChange={(value) => setFormData({ ...formData, categoriaId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Proveedor</Label>
                <Select
                  value={formData.proveedorId || ''}
                  onValueChange={(value) => setFormData({ ...formData, proveedorId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {proveedores.map((prov) => (
                      <SelectItem key={prov.id} value={prov.id}>{prov.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Unidad de Medida *</Label>
                <Select
                  value={formData.unidadMedida || 'Unidad'}
                  onValueChange={(value) => setFormData({ ...formData, unidadMedida: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIDADES_MEDIDA.map((unidad) => (
                      <SelectItem key={unidad} value={unidad}>{unidad}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Stock Mínimo *</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.stockMinimo ?? 0}
                  onChange={(e) => setFormData({ ...formData, stockMinimo: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.activo ?? true}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
              />
              <Label>Activo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!formData.nombre || !formData.unidadMedida}>
              {editingInsumo ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default Insumos
