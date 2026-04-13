import { ArrowDownToLine, ArrowUpFromLine, Weight } from 'lucide-react'
import { TipoPesaje, Especie } from '../types'

// Tipos de animales organizados por especie
export const TIPOS_ANIMALES: Record<string, { codigo: string; label: string; siglas: string }[]> = {
  BOVINO: [
    { codigo: 'TO', label: 'Toro', siglas: 'TORO' },
    { codigo: 'VA', label: 'Vaca', siglas: 'VACA' },
    { codigo: 'VQ', label: 'Vaquillona', siglas: 'VAQU' },
    { codigo: 'MEJ', label: 'Torito/Mej', siglas: 'MEJ' },
    { codigo: 'NO', label: 'Novillo', siglas: 'NOVI' },
    { codigo: 'NT', label: 'Novillito', siglas: 'NOVT' },
  ],
  EQUINO: [
    { codigo: 'PADRILLO', label: 'Padrillo', siglas: 'PADR' },
    { codigo: 'POTRILLO', label: 'Potrillo/Potranca', siglas: 'POTR' },
    { codigo: 'YEGUA', label: 'Yegua', siglas: 'YEGU' },
    { codigo: 'CABALLO', label: 'Caballo', siglas: 'CAB' },
    { codigo: 'BURRO', label: 'Burro', siglas: 'BURR' },
    { codigo: 'MULA', label: 'Mula', siglas: 'MULA' },
  ]
}

// Especies disponibles
export const ESPECIES: { id: Especie; label: string; letra: string }[] = [
  { id: 'BOVINO', label: 'Bovino', letra: 'B' },
  { id: 'EQUINO', label: 'Equino', letra: 'E' },
]

// Tipos de pesaje
export const TIPOS_PESAJE: { 
  id: TipoPesaje; 
  label: string; 
  icon: typeof ArrowDownToLine; 
  color: string; 
  desc: string 
}[] = [
  { 
    id: 'INGRESO_HACIENDA', 
    label: 'Ingreso de Hacienda', 
    icon: ArrowDownToLine, 
    color: 'text-green-600', 
    desc: 'Recepción de animales - Bruto' 
  },
  { 
    id: 'PESAJE_PARTICULAR', 
    label: 'Pesaje Particular', 
    icon: Weight, 
    color: 'text-blue-600', 
    desc: 'Pesaje general' 
  },
  { 
    id: 'SALIDA_MERCADERIA', 
    label: 'Salida de Mercadería', 
    icon: ArrowUpFromLine, 
    color: 'text-orange-600', 
    desc: 'Tara → Carga → Bruto' 
  },
]

// Estados de pesaje
export const ESTADOS_PESAJE: { id: string; label: string; color: string }[] = [
  { id: 'ABIERTO', label: 'Abierto', color: 'bg-orange-100 text-orange-700' },
  { id: 'CERRADO', label: 'Cerrado', color: 'bg-green-100 text-green-700' },
  { id: 'ANULADO', label: 'Anulado', color: 'bg-red-100 text-red-700' },
]

// Configuración de impresión de tickets
export const TICKET_CONFIG = {
  empresa: 'SOLEMAR ALIMENTARIA',
  ancho: '80mm',
  padding: '10mm',
  fontFamily: 'monospace',
  fontSize: '12px',
}

// Mensajes de validación
export const VALIDATION_MESSAGES = {
  PATENTE_REQUERIDA: 'Ingrese la patente del chasis',
  USUARIO_FAENA_REQUERIDO: 'Seleccione el usuario de faena',
  CANTIDAD_ANIMALES_REQUERIDA: 'Indique la cantidad de animales',
  CORRAL_REQUERIDO: 'Seleccione el corral',
  PESO_BRUTO_REQUERIDO: 'Ingrese el peso bruto',
  DESTINO_REQUERIDO: 'Ingrese el destino',
  PESO_TARA_REQUERIDO: 'Ingrese el peso tara',
}

// Mensajes de éxito
export const SUCCESS_MESSAGES = {
  PESAJE_CREADO: 'Pesaje creado correctamente',
  TROPAC_READA: 'Tropa creada correctamente',
  PESAJE_CERRADO: 'Pesaje cerrado correctamente',
  PESAJE_ELIMINADO: 'Pesaje eliminado correctamente',
}

// Mensajes de error
export const ERROR_MESSAGES = {
  ERROR_CREAR: 'Error al crear el pesaje',
  ERROR_CERRAR: 'Error al cerrar el pesaje',
  ERROR_ELIMINAR: 'Error al eliminar el pesaje',
  ERROR_CONEXION: 'Error de conexión',
  PESAJE_NO_ENCONTRADO: 'Pesaje no encontrado',
}
