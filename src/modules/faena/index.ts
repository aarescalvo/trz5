// Módulo Faena - Fachada
// Este módulo centraliza toda la funcionalidad del ciclo de faena

// Componentes existentes
export { ListaFaenaModule } from '@/components/lista-faena'
export { IngresoCajonModule } from '@/components/ingreso-cajon'
export { RomaneoModule } from '@/components/romaneo'
export { VBRomaneoModule } from '@/components/vb-romaneo'
export { ExpedicionModule } from '@/components/expedicion'

// Tipos
export interface ListaFaena {
  id: string
  numero: number
  fecha: Date
  estado: 'ABIERTA' | 'EN_PROCESO' | 'CERRADA' | 'ANULADA'
  cantidadTotal: number
  supervisorId?: string
  observaciones?: string
}

export interface AsignacionGarron {
  id: string
  listaFaenaId?: string
  garron: number
  animalId?: string
  tropaCodigo?: string
  animalNumero?: number
  tipoAnimal?: string
  pesoVivo?: number
  tieneMediaDer: boolean
  tieneMediaIzq: boolean
  completado: boolean
  horaIngreso: Date
}

export interface Romaneo {
  id: string
  listaFaenaId?: string
  fecha: Date
  garron: number
  tropaCodigo?: string
  numeroAnimal?: number
  tipoAnimal?: string
  raza?: string
  pesoVivo?: number
  denticion?: string
  tipificadorId?: string
  pesoMediaIzq?: number
  pesoMediaDer?: number
  pesoTotal?: number
  rinde?: number
  estado: 'PENDIENTE' | 'CONFIRMADO' | 'ANULADO'
}

// Estados
export const ESTADOS_LISTA_FAENA = {
  ABIERTA: { label: 'Abierta', color: 'bg-yellow-100 text-yellow-800' },
  EN_PROCESO: { label: 'En Proceso', color: 'bg-blue-100 text-blue-800' },
  CERRADA: { label: 'Cerrada', color: 'bg-green-100 text-green-800' },
  ANULADA: { label: 'Anulada', color: 'bg-red-100 text-red-800' }
} as const

export const ESTADOS_ROMANEO = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  CONFIRMADO: { label: 'Confirmado', color: 'bg-green-100 text-green-800' },
  ANULADO: { label: 'Anulado', color: 'bg-red-100 text-red-800' }
} as const
