'use client'

import { useState, useEffect, useCallback } from 'react'
import { eventBus, EventTypes } from '@/core/events/event-bus'
import {
  Tropa,
  TropaCreate,
  TropaUpdate,
  TropaWithDetails,
  TropaFilters,
  TropaStats,
  TropaPaginatedResponse,
  Especie,
  EstadoTropa,
  CodigoResult,
  TipoAnimalCantidad,
} from '../types'

interface UseTropasOptions {
  autoLoad?: boolean
  filters?: TropaFilters
  pageSize?: number
}

interface UseTropasReturn {
  // Estado
  tropas: Tropa[]
  tropaSeleccionada: TropaWithDetails | null
  stats: TropaStats | null
  loading: boolean
  error: string | null
  
  // Paginación
  page: number
  totalPages: number
  total: number
  
  // Acciones
  loadTropas: (newFilters?: TropaFilters) => Promise<void>
  loadTropa: (id: string) => Promise<void>
  loadStats: () => Promise<void>
  createTropa: (data: TropaCreate) => Promise<Tropa | null>
  updateTropa: (id: string, data: TropaUpdate) => Promise<Tropa | null>
  deleteTropa: (id: string) => Promise<boolean>
  cambiarEstado: (id: string, estado: EstadoTropa) => Promise<Tropa | null>
  asignarCorral: (id: string, corralId: string) => Promise<Tropa | null>
  actualizarPesos: (id: string, pesos: {
    pesoBruto?: number
    pesoTara?: number
    pesoNeto?: number
    pesoTotalIndividual?: number
  }) => Promise<Tropa | null>
  previewCodigo: (especie: Especie) => Promise<CodigoResult | null>
  setPage: (page: number) => void
  setFilters: (filters: TropaFilters) => void
  clearError: () => void
  refresh: () => Promise<void>
}

export function useTropas(options: UseTropasOptions = {}): UseTropasReturn {
  const {
    autoLoad = true,
    filters: initialFilters = {},
    pageSize = 20
  } = options

  // Estado
  const [tropas, setTropas] = useState<Tropa[]>([])
  const [tropaSeleccionada, setTropaSeleccionada] = useState<TropaWithDetails | null>(null)
  const [stats, setStats] = useState<TropaStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Paginación
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<TropaFilters>(initialFilters)

  // Cargar tropas
  const loadTropas = useCallback(async (newFilters?: TropaFilters) => {
    setLoading(true)
    setError(null)
    
    try {
      const filtersToUse = newFilters || filters
      const response = await fetch('/api/tropas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'list',
          filters: filtersToUse,
          page,
          pageSize
        })
      })

      if (!response.ok) {
        throw new Error('Error al cargar tropas')
      }

      const data: TropaPaginatedResponse = await response.json()
      setTropas(data.data)
      setTotal(data.total)
      setTotalPages(data.totalPages)
      
      if (newFilters) {
        setFilters(newFilters)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [filters, page, pageSize])

  // Cargar una tropa específica
  const loadTropa = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/tropas/${id}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar la tropa')
      }

      const data = await response.json()
      setTropaSeleccionada(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar estadísticas
  const loadStats = useCallback(async () => {
    try {
      const response = await fetch('/api/tropas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stats' })
      })

      if (!response.ok) {
        throw new Error('Error al cargar estadísticas')
      }

      const data: TropaStats = await response.json()
      setStats(data)
    } catch (err) {
      console.error('Error loading stats:', err)
    }
  }, [])

  // Crear tropa
  const createTropa = useCallback(async (data: TropaCreate): Promise<Tropa | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/tropas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', data })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear tropa')
      }

      const nuevaTropa: Tropa = await response.json()
      
      // Actualizar lista
      setTropas(prev => [nuevaTropa, ...prev])
      setTotal(prev => prev + 1)
      
      return nuevaTropa
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Actualizar tropa
  const updateTropa = useCallback(async (id: string, data: TropaUpdate): Promise<Tropa | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/tropas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Error al actualizar tropa')
      }

      const tropaActualizada: Tropa = await response.json()
      
      // Actualizar lista
      setTropas(prev => prev.map(t => t.id === id ? tropaActualizada : t))
      
      // Actualizar tropa seleccionada
      if (tropaSeleccionada?.id === id) {
        setTropaSeleccionada(prev => prev ? { ...prev, ...tropaActualizada } : null)
      }
      
      return tropaActualizada
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      return null
    } finally {
      setLoading(false)
    }
  }, [tropaSeleccionada])

  // Eliminar tropa
  const deleteTropa = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/tropas/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar tropa')
      }

      // Actualizar lista
      setTropas(prev => prev.filter(t => t.id !== id))
      setTotal(prev => prev - 1)
      
      // Limpiar tropa seleccionada
      if (tropaSeleccionada?.id === id) {
        setTropaSeleccionada(null)
      }
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      return false
    } finally {
      setLoading(false)
    }
  }, [tropaSeleccionada])

  // Cambiar estado
  const cambiarEstado = useCallback(async (id: string, estado: EstadoTropa): Promise<Tropa | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/tropas/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al cambiar estado')
      }

      const tropaActualizada: Tropa = await response.json()
      
      // Actualizar lista
      setTropas(prev => prev.map(t => t.id === id ? tropaActualizada : t))
      
      // Actualizar estadísticas
      loadStats()
      
      return tropaActualizada
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      return null
    } finally {
      setLoading(false)
    }
  }, [loadStats])

  // Asignar corral
  const asignarCorral = useCallback(async (id: string, corralId: string): Promise<Tropa | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/tropas/${id}/corral`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corralId })
      })

      if (!response.ok) {
        throw new Error('Error al asignar corral')
      }

      const tropaActualizada: Tropa = await response.json()
      
      // Actualizar lista
      setTropas(prev => prev.map(t => t.id === id ? tropaActualizada : t))
      
      return tropaActualizada
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Actualizar pesos
  const actualizarPesos = useCallback(async (id: string, pesos: {
    pesoBruto?: number
    pesoTara?: number
    pesoNeto?: number
    pesoTotalIndividual?: number
  }): Promise<Tropa | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/tropas/${id}/pesos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pesos)
      })

      if (!response.ok) {
        throw new Error('Error al actualizar pesos')
      }

      const tropaActualizada: Tropa = await response.json()
      
      // Actualizar lista
      setTropas(prev => prev.map(t => t.id === id ? tropaActualizada : t))
      
      return tropaActualizada
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Preview de código
  const previewCodigo = useCallback(async (especie: Especie): Promise<CodigoResult | null> => {
    try {
      const response = await fetch('/api/tropas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'preview-codigo', especie })
      })

      if (!response.ok) {
        throw new Error('Error al generar código')
      }

      return await response.json()
    } catch (err) {
      console.error('Error previewing code:', err)
      return null
    }
  }, [])

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Refrescar datos
  const refresh = useCallback(async () => {
    await Promise.all([loadTropas(), loadStats()])
  }, [loadTropas, loadStats])

  // Cambiar página
  const handleSetPage = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  // Cargar datos automáticamente
  useEffect(() => {
    if (autoLoad) {
      loadTropas()
      loadStats()
    }
  }, [autoLoad, loadTropas, loadStats, page])

  // Escuchar eventos de tropas
  useEffect(() => {
    const unsubscribeCreada = eventBus.on(EventTypes.TROPA_CREADA, () => {
      loadTropas()
      loadStats()
    })

    const unsubscribeActualizada = eventBus.on(EventTypes.TROPA_ACTUALIZADA, () => {
      loadTropas()
    })

    const unsubscribeEliminada = eventBus.on(EventTypes.TROPA_ELIMINADA, () => {
      loadTropas()
      loadStats()
    })

    return () => {
      unsubscribeCreada()
      unsubscribeActualizada()
      unsubscribeEliminada()
    }
  }, [loadTropas, loadStats])

  return {
    // Estado
    tropas,
    tropaSeleccionada,
    stats,
    loading,
    error,
    
    // Paginación
    page,
    totalPages,
    total,
    
    // Acciones
    loadTropas,
    loadTropa,
    loadStats,
    createTropa,
    updateTropa,
    deleteTropa,
    cambiarEstado,
    asignarCorral,
    actualizarPesos,
    previewCodigo,
    setPage: handleSetPage,
    setFilters,
    clearError,
    refresh,
  }
}
