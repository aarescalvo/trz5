// Módulo Pesaje - Fachada
// Este módulo centraliza toda la funcionalidad relacionada con pesaje de camiones

// Componentes
export { default as PesajeCamionesModule } from '@/components/pesaje-camiones-module'

// Tipos
export interface PesajeCamion {
  id: string
  tipo: 'INGRESO_HACIENDA' | 'PESAJE_PARTICULAR' | 'SALIDA_MERCADERIA'
  numeroTicket: number
  patenteChasis: string
  patenteAcoplado?: string
  choferNombre?: string
  choferDni?: string
  transportistaId?: string
  pesoBruto?: number
  pesoTara?: number
  pesoNeto?: number
  estado: 'ABIERTO' | 'CERRADO' | 'ANULADO'
  fecha: Date
  observaciones?: string
}

// Constantes del módulo
export const TIPOS_PESAJE = {
  INGRESO_HACIENDA: 'Ingreso Hacienda',
  PESAJE_PARTICULAR: 'Pesaje Particular',
  SALIDA_MERCADERIA: 'Salida Mercadería'
} as const

export const ESTADOS_PESAJE = {
  ABIERTO: { label: 'Abierto', color: 'bg-yellow-100 text-yellow-800' },
  CERRADO: { label: 'Cerrado', color: 'bg-green-100 text-green-800' },
  ANULADO: { label: 'Anulado', color: 'bg-red-100 text-red-800' }
} as const
