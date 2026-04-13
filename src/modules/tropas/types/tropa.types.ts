// Tipos de especie
export type Especie = 'BOVINO' | 'EQUINO'

// Tipos de animal
export type TipoAnimal = 
  | 'TO'   // Toro
  | 'VA'   // Vaca
  | 'VQ'   // Vaquillona
  | 'MEJ'  // Torito/Mej
  | 'NO'   // Novillo
  | 'NT'   // Novillito
  | 'PADRILLO'
  | 'POTRILLO'
  | 'YEGUA'
  | 'CABALLO'
  | 'BURRO'
  | 'MULA'

// Estados de tropa
export type EstadoTropa = 
  | 'RECIBIDO'
  | 'EN_CORRAL'
  | 'EN_PESAJE'
  | 'PESADO'
  | 'LISTO_FAENA'
  | 'EN_FAENA'
  | 'FAENADO'
  | 'DESPACHADO'

// Interface para tipos de animales con cantidad
export interface TipoAnimalCantidad {
  tipo: TipoAnimal
  cantidad: number
}

// Interface principal de Tropa
export interface Tropa {
  id: string
  numero: number
  codigo: string
  codigoSimplificado?: string
  productorId?: string
  productor?: ClienteBasico
  usuarioFaenaId: string
  usuarioFaena?: ClienteBasico
  especie: Especie
  dte: string
  guia: string
  cantidadCabezas: number
  corralId?: string
  corral?: CorralBasico
  estado: EstadoTropa
  pesoBruto?: number
  pesoTara?: number
  pesoNeto?: number
  pesoTotalIndividual?: number
  observaciones?: string
  fechaRecepcion: Date
  operadorId?: string
  operador?: OperadorBasico
  pesajeCamionId?: string
  tiposAnimales?: TipoAnimalCantidad[]
  createdAt: Date
  updatedAt: Date
}

// Interface para crear una tropa
export interface TropaCreate {
  productorId?: string
  usuarioFaenaId: string
  especie: Especie
  dte: string
  guia: string
  cantidadCabezas: number
  corralId?: string
  tiposAnimales?: TipoAnimalCantidad[]
  observaciones?: string
  operadorId?: string
}

// Interface para actualizar una tropa
export interface TropaUpdate {
  productorId?: string
  usuarioFaenaId?: string
  dte?: string
  guia?: string
  cantidadCabezas?: number
  corralId?: string
  estado?: EstadoTropa
  pesoBruto?: number
  pesoTara?: number
  pesoNeto?: number
  pesoTotalIndividual?: number
  observaciones?: string
  tiposAnimales?: TipoAnimalCantidad[]
}

// Interface de Tropa con animales
export interface TropaWithAnimales extends Tropa {
  animales: AnimalBasico[]
}

// Interface de Tropa con detalles completos
export interface TropaWithDetails extends Tropa {
  productor?: ClienteBasico
  usuarioFaena: ClienteBasico
  corral?: CorralBasico
  operador?: OperadorBasico
  animales?: AnimalBasico[]
  tiposAnimales?: TipoAnimalCantidad[]
}

// Interfaces básicas para relaciones
export interface ClienteBasico {
  id: string
  nombre: string
  cuit?: string
  matricula?: string
  esProductor: boolean
  esUsuarioFaena: boolean
}

export interface CorralBasico {
  id: string
  nombre: string
  capacidad: number
  stockBovinos: number
  stockEquinos: number
}

export interface OperadorBasico {
  id: string
  nombre: string
  usuario: string
  rol: string
}

export interface AnimalBasico {
  id: string
  numero: number
  codigo: string
  caravana?: string
  tipoAnimal: TipoAnimal
  raza?: string
  pesoVivo?: number
  estado: string
  corralId?: string
}

// Interface para filtros de búsqueda
export interface TropaFilters {
  especie?: Especie
  estado?: EstadoTropa | EstadoTropa[]
  productorId?: string
  usuarioFaenaId?: string
  corralId?: string
  fechaDesde?: Date
  fechaHasta?: Date
  search?: string
}

// Interface para respuesta paginada
export interface TropaPaginatedResponse {
  data: Tropa[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Interface para estadísticas de tropa
export interface TropaStats {
  total: number
  porEstado: Record<EstadoTropa, number>
  porEspecie: Record<Especie, number>
  pendientesPesaje: number
  pendientesFaena: number
}

// Interface para stock por corral
export interface StockCorral {
  corralId: string
  corralNombre: string
  tropaId: string
  tropaCodigo: string
  especie: Especie
  cantidad: number
}

// Resultado de generación de código
export interface CodigoResult {
  numero: number
  codigo: string
}
