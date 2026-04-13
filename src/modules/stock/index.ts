// Módulo Stock - Fachada
export { StocksCorralesModule } from '@/components/stocks-corrales'
export { StockCamarasModule } from '@/components/stock-camaras'
export { StocksInsumosModule } from '@/components/stocks-insumos'

export interface StockCorral {
  corralId: string
  corralNombre: string
  especie: 'BOVINO' | 'EQUINO'
  totalAnimales: number
}
