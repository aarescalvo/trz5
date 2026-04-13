// Módulo Tropas - Fachada
// Este módulo centraliza toda la funcionalidad relacionada con gestión de tropas

// Componentes existentes
export { default as PesajeIndividualModule } from '@/components/pesaje-individual-module'
export { default as MovimientoHaciendaModule } from '@/components/movimiento-hacienda-module'

// Tipos
export interface Tropa {
  id: string
  numero: number
  codigo: string
  codigoSimplificado?: string
  productorId?: string
  usuarioFaenaId: string
  especie: 'BOVINO' | 'EQUINO'
  dte: string
  guia: string
  cantidadCabezas: number
  corralId?: string
  estado: string
  pesoBruto?: number
  pesoTara?: number
  pesoNeto?: number
  observaciones?: string
  fechaRecepcion: Date
}

export interface TropaWithRelations extends Tropa {
  productor?: { nombre: string }
  usuarioFaena: { nombre: string }
  corral?: { nombre: string }
}

// Estados de tropa
export const ESTADOS_TROPA = {
  RECIBIDO: { label: 'Recibido', color: 'bg-blue-100 text-blue-800' },
  EN_CORRAL: { label: 'En Corral', color: 'bg-yellow-100 text-yellow-800' },
  EN_PESAJE: { label: 'En Pesaje', color: 'bg-orange-100 text-orange-800' },
  PESADO: { label: 'Pesado', color: 'bg-green-100 text-green-800' },
  LISTO_FAENA: { label: 'Listo Faena', color: 'bg-purple-100 text-purple-800' },
  EN_FAENA: { label: 'En Faena', color: 'bg-red-100 text-red-800' },
  FAENADO: { label: 'Faenado', color: 'bg-gray-100 text-gray-800' },
  DESPACHADO: { label: 'Despachado', color: 'bg-stone-100 text-stone-800' }
} as const

// Especies
export const ESPECIES = {
  BOVINO: { label: 'Bovino', codigo: 'B' },
  EQUINO: { label: 'Equino', codigo: 'E' }
} as const
