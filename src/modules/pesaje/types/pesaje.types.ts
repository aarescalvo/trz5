// Tipos principales del módulo Pesaje Camiones

export type TipoPesaje = 'INGRESO_HACIENDA' | 'PESAJE_PARTICULAR' | 'SALIDA_MERCADERIA'
export type EstadoPesaje = 'ABIERTO' | 'CERRADO' | 'ANULADO'
export type Especie = 'BOVINO' | 'EQUINO' | 'OVINO' | 'PORCINO'
export type TipoAnimal = 'TO' | 'VA' | 'VQ' | 'MEJ' | 'NO' | 'NT' | 'PADRILLO' | 'POTRILLO' | 'YEGUA' | 'CABALLO' | 'BURRO' | 'MULA'

// Interfaces principales
export interface PesajeCamion {
  id: string
  tipo: TipoPesaje
  numeroTicket: number
  patenteChasis: string
  patenteAcoplado?: string
  choferNombre?: string
  choferDni?: string
  transportistaId?: string
  transportista?: Transportista
  destino?: string
  remito?: string
  pesoBruto?: number
  pesoTara?: number
  pesoNeto?: number
  estado: EstadoPesaje
  fecha: Date
  fechaTara?: Date
  observaciones?: string
  operadorId?: string
  operador?: Operador
  tropa?: TropaInfo
}

export interface PesajeCreate {
  tipo: TipoPesaje
  patenteChasis: string
  patenteAcoplado?: string
  choferNombre?: string
  choferDni?: string
  transportistaId?: string
  pesoBruto?: number
  pesoTara?: number
  pesoNeto?: number
  observaciones?: string
  destino?: string
  remito?: string
  operadorId?: string
  // Campos específicos para ingreso de hacienda
  dte?: string
  guia?: string
  productorId?: string
  usuarioFaenaId?: string
  especie?: Especie
  tiposAnimales?: TipoAnimalCantidad[]
  cantidadCabezas?: number
  corralId?: string
}

export interface PesajeUpdate {
  pesoBruto?: number
  pesoTara?: number
  pesoNeto?: number
  observaciones?: string
  estado?: EstadoPesaje
  destino?: string
  remito?: string
}

// Interfaces de relación
export interface Transportista {
  id: string
  nombre: string
}

export interface Operador {
  id: string
  nombre: string
  nivel: string
  permisos: Record<string, boolean>
}

export interface Cliente {
  id: string
  nombre: string
  esProductor: boolean
  esUsuarioFaena: boolean
}

export interface Corral {
  id: string
  nombre: string
  capacidad: number
  stockBovinos: number
  stockEquinos: number
}

export interface TipoAnimalCantidad {
  tipoAnimal: string
  cantidad: number
}

export interface TropaInfo {
  id: string
  codigo: string
  productor?: { nombre: string }
  usuarioFaena?: { nombre: string }
  especie: Especie
  cantidadCabezas: number
  corral?: string
  corralId?: string
  dte?: string
  guia?: string
  tiposAnimales?: TipoAnimalCantidad[]
  animales?: Array<{ id: string; numero: number; codigo: string; tipoAnimal: string; estado: string }>
  observaciones?: string
}

// Interface para respuesta de API
export interface PesajeApiResponse {
  success: boolean
  data?: PesajeCamion | PesajeCamion[]
  error?: string
  nextTicketNumber?: number
  animalesCreados?: number
}

// Interface para filtros
export interface PesajeFiltros {
  fechaDesde?: string
  fechaHasta?: string
  estado?: EstadoPesaje
  tipo?: TipoPesaje
}

// Interface para el contexto del hook
export interface UsePesajeOptions {
  operadorId: string
  onTropaCreada?: () => void
}
