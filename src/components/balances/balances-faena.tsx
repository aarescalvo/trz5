'use client'

import { useState, useEffect, useMemo } from 'react'
import { Scale, Plus, Edit, Trash2, Save, X, TrendingUp, TrendingDown, Minus, Calendar, Search } from 'lucide-react'
import { ExportButton } from '@/components/ui/export-button'
import { PDFExporter } from '@/lib/export-pdf'
import { ExcelExporter } from '@/lib/export-excel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

interface BalanceFaena {
  id: string
  tropaId: string
  tropa?: {
    id: string
    numero: number
    productor?: { nombre: string }
  }
  fecha: string
  pesoVivoTotal: number
  pesoFrioTotal: number
  rinde: number
  observaciones?: string
  createdAt: string
}

interface Tropa {
  id: string
  numero: number
  productor?: { nombre: string }
  fechaIngreso: string
}

interface Operador {
  id: string
  nombre: string
  nivel: string
}

// Función para obtener el color del rinde
const getRindeColor = (rinde: number) => {
  if (rinde >= 55) return 'text-green-600 bg-green-50 border-green-200'
  if (rinde >= 50) return 'text-amber-600 bg-amber-50 border-amber-200'
  return 'text-red-600 bg-red-50 border-red-200'
}

const getRindeIcon = (rinde: number) => {
  if (rinde >= 55) return <TrendingUp className="w-4 h-4" />
  if (rinde >= 50) return <Minus className="w-4 h-4" />
  return <TrendingDown className="w-4 h-4" />
}

export function BalancesFaena({ operador }: { operador: Operador }) {
  const [balances, setBalances] = useState<BalanceFaena[]>([])
  const [tropas, setTropas] = useState<Tropa[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [balanceEditando, setBalanceEditando] = useState<BalanceFaena | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [formData, setFormData] = useState({
    tropaId: '',
    fecha: new Date().toISOString().split('T')[0],
    pesoVivoTotal: 0,
    pesoFrioTotal: 0,
    observaciones: ''
  })

  // Calcular rinde automáticamente
  const rindeCalculado = useMemo(() => {
    if (formData.pesoVivoTotal <= 0) return 0
    return Number(((formData.pesoFrioTotal / formData.pesoVivoTotal) * 100).toFixed(2))
  }, [formData.pesoVivoTotal, formData.pesoFrioTotal])

  useEffect(() => {
    fetchBalances()
    fetchTropas()
  }, [])

  const fetchBalances = async () => {
    try {
      const res = await fetch('/api/balances-faena')
      const data = await res.json()
      if (data.success) {
        setBalances(data.data)
      }
    } catch (error) {
      console.error('Error fetching balances:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTropas = async () => {
    try {
      const res = await fetch('/api/tropas?estado=FAENADA')
      const data = await res.json()
      if (data.success) {
        setTropas(data.data)
      }
    } catch (error) {
      console.error('Error fetching tropas:', error)
    }
  }

  const handleNuevo = () => {
    setBalanceEditando(null)
    setFormData({
      tropaId: '',
      fecha: new Date().toISOString().split('T')[0],
      pesoVivoTotal: 0,
      pesoFrioTotal: 0,
      observaciones: ''
    })
    setDialogOpen(true)
  }

  const handleEditar = (balance: BalanceFaena) => {
    setBalanceEditando(balance)
    setFormData({
      tropaId: balance.tropaId,
      fecha: balance.fecha.split('T')[0],
      pesoVivoTotal: balance.pesoVivoTotal,
      pesoFrioTotal: balance.pesoFrioTotal,
      observaciones: balance.observaciones || ''
    })
    setDialogOpen(true)
  }

  const handleEliminar = (balance: BalanceFaena) => {
    setBalanceEditando(balance)
    setDeleteOpen(true)
  }

  const handleGuardar = async () => {
    if (!formData.tropaId) {
      toast.error('Seleccione una tropa')
      return
    }
    if (formData.pesoVivoTotal <= 0) {
      toast.error('Ingrese el peso vivo total')
      return
    }
    if (formData.pesoFrioTotal <= 0) {
      toast.error('Ingrese el peso frío total')
      return
    }

    setSaving(true)
    try {
      const url = '/api/balances-faena'
      const method = balanceEditando ? 'PUT' : 'POST'
      const body = balanceEditando 
        ? { ...formData, id: balanceEditando.id, rinde: rindeCalculado }
        : { ...formData, rinde: rindeCalculado }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        toast.success(balanceEditando ? 'Balance actualizado' : 'Balance registrado')
        setDialogOpen(false)
        fetchBalances()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmarEliminar = async () => {
    if (!balanceEditando) return

    setSaving(true)
    try {
      const res = await fetch(`/api/balances-faena?id=${balanceEditando.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Balance eliminado')
        setDeleteOpen(false)
        fetchBalances()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  // Filtrar balances
  const balancesFiltrados = balances.filter(b => {
    const search = searchTerm.toLowerCase()
    const tropaNumero = b.tropa?.numero?.toString() || ''
    const productor = b.tropa?.productor?.nombre?.toLowerCase() || ''
    return tropaNumero.includes(search) || productor.includes(search)
  })

  // Estadísticas
  const promedioRinde = balances.length > 0 
    ? (balances.reduce((acc, b) => acc + b.rinde, 0) / balances.length).toFixed(2)
    : '0.00'

  const mejorRinde = balances.length > 0 
    ? Math.max(...balances.map(b => b.rinde)).toFixed(2)
    : '0.00'

  const peorRinde = balances.length > 0 
    ? Math.min(...balances.map(b => b.rinde)).toFixed(2)
    : '0.00'

  // Funciones de exportación
  const handleExportPDF = () => {
    const data = balancesFiltrados.map(b => ({
      fecha: b.fecha,
      tropaNumero: b.tropa?.numero || 0,
      productor: b.tropa?.productor?.nombre || 'Sin productor',
      cantidadAnimales: 0, // No disponible en este modelo
      pesoVivoTotal: b.pesoVivoTotal,
      pesoFrioTotal: b.pesoFrioTotal,
      rinde: b.rinde,
      observaciones: b.observaciones,
    }))
    const doc = PDFExporter.generateFaenaReport(data)
    PDFExporter.downloadPDF(doc, `reporte_faena_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const handleExportExcel = () => {
    const data = balancesFiltrados.map(b => ({
      fecha: b.fecha,
      tropaNumero: b.tropa?.numero || 0,
      productor: b.tropa?.productor?.nombre || 'Sin productor',
      cantidadAnimales: 0,
      pesoVivoTotal: b.pesoVivoTotal,
      pesoFrioTotal: b.pesoFrioTotal,
      rinde: b.rinde,
      observaciones: b.observaciones,
    }))
    ExcelExporter.exportFaenaReport(data, `reporte_faena_${new Date().toISOString().split('T')[0]}`)
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Total Registros</p>
                <p className="text-2xl font-bold text-stone-800">{balances.length}</p>
              </div>
              <Scale className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Promedio Rinde</p>
                <p className="text-2xl font-bold text-green-600">{promedioRinde}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Mejor Rinde</p>
                <p className="text-2xl font-bold text-green-700">{mejorRinde}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Peor Rinde</p>
                <p className="text-2xl font-bold text-red-600">{peorRinde}%</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla principal */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-stone-50 rounded-t-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-600" />
                Balances de Faena
              </CardTitle>
              <CardDescription>
                Registro de pesos vivos y fríos con cálculo de rinde
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  placeholder="Buscar por tropa o productor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <ExportButton
                onExportPDF={handleExportPDF}
                onExportExcel={handleExportExcel}
                filename={`reporte_faena_${new Date().toISOString().split('T')[0]}`}
                showPrint={false}
                size="sm"
              />
              <Button onClick={handleNuevo} className="bg-amber-500 hover:bg-amber-600 shrink-0">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <Scale className="w-8 h-8 animate-pulse mx-auto text-amber-500" />
            </div>
          ) : balancesFiltrados.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              <Scale className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay balances registrados</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tropa</TableHead>
                    <TableHead>Productor</TableHead>
                    <TableHead className="text-right">Peso Vivo</TableHead>
                    <TableHead className="text-right">Peso Frío</TableHead>
                    <TableHead className="text-right">Rinde</TableHead>
                    <TableHead>Observaciones</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balancesFiltrados.map((balance) => (
                    <TableRow key={balance.id}>
                      <TableCell>
                        {new Date(balance.fecha).toLocaleDateString('es-AR')}
                      </TableCell>
                      <TableCell className="font-mono font-medium">
                        T-{balance.tropa?.numero || '-'}
                      </TableCell>
                      <TableCell>{balance.tropa?.productor?.nombre || '-'}</TableCell>
                      <TableCell className="text-right font-mono">
                        {balance.pesoVivoTotal.toLocaleString('es-AR')} kg
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {balance.pesoFrioTotal.toLocaleString('es-AR')} kg
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={`flex items-center gap-1 w-fit ml-auto ${getRindeColor(balance.rinde)}`}>
                          {getRindeIcon(balance.rinde)}
                          {balance.rinde.toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-32 truncate text-stone-500">
                        {balance.observaciones || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditar(balance)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEliminar(balance)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Nuevo/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {balanceEditando ? 'Editar Balance' : 'Nuevo Balance de Faena'}
            </DialogTitle>
            <DialogDescription>
              Registre los pesos para calcular el rinde automáticamente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tropa *</Label>
                <Select 
                  value={formData.tropaId} 
                  onValueChange={(v) => setFormData({ ...formData, tropaId: v })}
                  disabled={!!balanceEditando}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tropa" />
                  </SelectTrigger>
                  <SelectContent>
                    {tropas.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        T-{t.numero} - {t.productor?.nombre || 'Sin productor'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Peso Vivo Total (kg) *</Label>
                <Input
                  type="number"
                  value={formData.pesoVivoTotal || ''}
                  onChange={(e) => setFormData({ ...formData, pesoVivoTotal: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>Peso Frío Total (kg) *</Label>
                <Input
                  type="number"
                  value={formData.pesoFrioTotal || ''}
                  onChange={(e) => setFormData({ ...formData, pesoFrioTotal: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="font-mono"
                />
              </div>
            </div>

            {/* Rinde calculado */}
            <div className="p-4 rounded-lg bg-stone-50 border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-stone-600">Rinde Calculado:</span>
                <Badge className={`text-lg px-4 py-1 ${getRindeColor(rindeCalculado)}`}>
                  {getRindeIcon(rindeCalculado)}
                  {rindeCalculado.toFixed(2)}%
                </Badge>
              </div>
              <div className="mt-2 text-xs text-stone-500">
                Fórmula: (Peso Frío / Peso Vivo) × 100
              </div>
              <div className="mt-1 flex gap-2 text-xs">
                <span className="text-green-600">≥55%: Óptimo</span>
                <span className="text-amber-600">50-55%: Regular</span>
                <span className="text-red-600">&lt;50%: Bajo</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Input
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Notas adicionales..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleGuardar} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              Eliminar Balance
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar este balance de faena?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmarEliminar} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BalancesFaena
