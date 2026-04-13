'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  RefreshCw,
  Users,
  Package,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { TropasList } from './TropasList'
import { TropaForm } from './TropaForm'
import { useTropas } from '../hooks/useTropas'
import {
  Tropa,
  TropaCreate,
  TropaUpdate,
  TropaWithDetails,
  TropaStats,
  Especie,
  EstadoTropa,
  ClienteBasico,
  CorralBasico,
} from '../types'

// Componente de estadísticas
function StatsCards({ stats }: { stats: TropaStats | null }) {
  if (!stats) return null

  const cards = [
    {
      title: 'Total Tropas',
      value: stats.total,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Pendientes Pesaje',
      value: stats.pendientesPesaje,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Pendientes Faena',
      value: stats.pendientesFaena,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Procesadas Hoy',
      value: stats.porEstado.FAENADO + stats.porEstado.DESPACHADO,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.color}`}>
              {card.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Componente de detalle de tropa
function TropaDetail({
  tropa,
  onClose,
  onEdit,
  onEstadoChange,
}: {
  tropa: TropaWithDetails
  onClose: () => void
  onEdit: () => void
  onEstadoChange: (estado: EstadoTropa) => void
}) {
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const ESTADOS_CONFIG: Record<EstadoTropa, { label: string; color: string }> = {
    RECIBIDO: { label: 'Recibido', color: 'bg-blue-500' },
    EN_CORRAL: { label: 'En Corral', color: 'bg-cyan-500' },
    EN_PESAJE: { label: 'En Pesaje', color: 'bg-yellow-500' },
    PESADO: { label: 'Pesado', color: 'bg-orange-500' },
    LISTO_FAENA: { label: 'Listo Faena', color: 'bg-purple-500' },
    EN_FAENA: { label: 'En Faena', color: 'bg-red-500' },
    FAENADO: { label: 'Faenado', color: 'bg-green-500' },
    DESPACHADO: { label: 'Despachado', color: 'bg-gray-500' },
  }

  return (
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Badge className={`${ESTADOS_CONFIG[tropa.estado].color} text-white`}>
            {tropa.codigo}
          </Badge>
        </DialogTitle>
        <DialogDescription>
          Detalles de la tropa
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        {/* Información general */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Información General</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Especie</p>
                <p className="font-medium">{tropa.especie === 'BOVINO' ? 'Bovino' : 'Equino'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cantidad de Cabezas</p>
                <p className="font-medium">{tropa.cantidadCabezas}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge className={`${ESTADOS_CONFIG[tropa.estado].color} text-white`}>
                  {ESTADOS_CONFIG[tropa.estado].label}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha Recepción</p>
                <p className="font-medium">{formatDate(tropa.fechaRecepcion)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documentos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Documentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">DTE</p>
                <p className="font-mono font-medium">{tropa.dte}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Guía</p>
                <p className="font-mono font-medium">{tropa.guia}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Origen */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Origen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Productor</p>
                <p className="font-medium">{tropa.productor?.nombre || 'Sin productor'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Usuario de Faena</p>
                <p className="font-medium">{tropa.usuarioFaena?.nombre || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Corral</p>
                <p className="font-medium">{tropa.corral?.nombre || 'Sin asignar'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pesos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pesos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Peso Bruto</p>
                <p className="font-medium">{tropa.pesoBruto ? `${tropa.pesoBruto} kg` : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Peso Tara</p>
                <p className="font-medium">{tropa.pesoTara ? `${tropa.pesoTara} kg` : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Peso Neto</p>
                <p className="font-medium">{tropa.pesoNeto ? `${tropa.pesoNeto} kg` : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Peso Individual</p>
                <p className="font-medium">{tropa.pesoTotalIndividual ? `${tropa.pesoTotalIndividual} kg` : '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tipos de animales */}
        {tropa.tiposAnimales && tropa.tiposAnimales.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tipos de Animales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tropa.tiposAnimales.map((ta, idx) => (
                  <Badge key={idx} variant="secondary">
                    {ta.tipo}: {ta.cantidad}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Observaciones */}
        {tropa.observaciones && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Observaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{tropa.observaciones}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
        <Button onClick={onEdit}>
          Editar
        </Button>
      </div>
    </DialogContent>
  )
}

// Componente principal
export function TropasModule() {
  const {
    tropas,
    tropaSeleccionada,
    stats,
    loading,
    error,
    page,
    totalPages,
    total,
    loadTropas,
    loadTropa,
    loadStats,
    createTropa,
    updateTropa,
    deleteTropa,
    cambiarEstado,
    previewCodigo,
    setPage,
    setFilters,
    clearError,
    refresh,
  } = useTropas({ autoLoad: true })

  // Estados locales
  const [formOpen, setFormOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tropaAEliminar, setTropaAEliminar] = useState<Tropa | null>(null)
  const [tropaAEditar, setTropaAEditar] = useState<Tropa | null>(null)
  const [codigoPreview, setCodigoPreview] = useState<{ numero: number; codigo: string } | null>(null)

  // Datos de clientes y corrales (se cargarían desde APIs)
  const [clientes, setClientes] = useState<ClienteBasico[]>([])
  const [corrales, setCorrales] = useState<CorralBasico[]>([])

  // Cargar datos auxiliares
  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientesRes, corralesRes] = await Promise.all([
          fetch('/api/clientes'),
          fetch('/api/corrales'),
        ])
        
        if (clientesRes.ok) {
          const data = await clientesRes.json()
          setClientes(data)
        }
        
        if (corralesRes.ok) {
          const data = await corralesRes.json()
          setCorrales(data)
        }
      } catch (err) {
        console.error('Error loading auxiliary data:', err)
      }
    }
    
    loadData()
  }, [])

  // Handlers
  const handleView = useCallback(async (tropa: Tropa) => {
    await loadTropa(tropa.id)
    setDetailOpen(true)
  }, [loadTropa])

  const handleEdit = useCallback((tropa: Tropa) => {
    setTropaAEditar(tropa)
    setFormOpen(true)
  }, [])

  const handleDelete = useCallback((tropa: Tropa) => {
    setTropaAEliminar(tropa)
    setDeleteDialogOpen(true)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (tropaAEliminar) {
      await deleteTropa(tropaAEliminar.id)
      setDeleteDialogOpen(false)
      setTropaAEliminar(null)
    }
  }, [tropaAEliminar, deleteTropa])

  const handleEstadoChange = useCallback(async (tropa: Tropa, nuevoEstado: EstadoTropa) => {
    await cambiarEstado(tropa.id, nuevoEstado)
  }, [cambiarEstado])

  const handleFormSubmit = useCallback(async (data: TropaCreate | TropaUpdate) => {
    if (tropaAEditar) {
      return !!(await updateTropa(tropaAEditar.id, data))
    } else {
      return !!(await createTropa(data as TropaCreate))
    }
  }, [tropaAEditar, createTropa, updateTropa])

  const handleSearch = useCallback((search: string) => {
    setFilters({ search })
  }, [setFilters])

  const handleFilterEspecie = useCallback((especie: Especie | 'TODAS') => {
    setFilters({ especie: especie === 'TODAS' ? undefined : especie })
  }, [setFilters])

  const handleFilterEstado = useCallback((estado: EstadoTropa | 'TODAS') => {
    setFilters({ estado: estado === 'TODAS' ? undefined : estado })
  }, [setFilters])

  // Cargar preview de código al abrir formulario nueva tropa
  useEffect(() => {
    if (formOpen && !tropaAEditar) {
      previewCodigo('BOVINO').then(setCodigoPreview)
    }
  }, [formOpen, tropaAEditar, previewCodigo])

  // Cerrar detalle
  const handleDetailClose = useCallback(() => {
    setDetailOpen(false)
  }, [])

  // Cerrar formulario
  const handleFormClose = useCallback(() => {
    setFormOpen(false)
    setTropaAEditar(null)
  }, [])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Tropas</h1>
          <p className="text-muted-foreground">
            Administre las tropas recibidas en el frigorífico
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Tropa
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Lista de tropas */}
      <TropasList
        tropas={tropas}
        loading={loading}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onEstadoChange={handleEstadoChange}
        onSearch={handleSearch}
        onFilterEspecie={handleFilterEspecie}
        onFilterEstado={handleFilterEstado}
        onRefresh={refresh}
      />

      {/* Modal de detalle */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        {tropaSeleccionada && (
          <TropaDetail
            tropa={tropaSeleccionada}
            onClose={handleDetailClose}
            onEdit={() => {
              setDetailOpen(false)
              setTropaAEditar(tropaSeleccionada)
              setFormOpen(true)
            }}
            onEstadoChange={() => {}}
          />
        )}
      </Dialog>

      {/* Formulario */}
      <TropaForm
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        tropa={tropaAEditar}
        clientes={clientes}
        corrales={corrales}
        previewCodigo={codigoPreview}
        loading={loading}
      />

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tropa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la tropa
              {tropaAEliminar && (
                <span className="font-bold"> {tropaAEliminar.codigo}</span>
              )}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
