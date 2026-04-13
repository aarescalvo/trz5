'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Scale, TrendingUp, Target } from 'lucide-react'
import { BalancesFaena } from './balances-faena'
import { RendimientosHistorico } from './rendimientos-historico'
import { Indicadores } from './indicadores'

interface Operador {
  id: string
  nombre: string
  nivel: string
}

export function BalancesModule({ operador }: { operador: Operador }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Balances y Rendimientos</h1>
          <p className="text-stone-500">Control de rindes, análisis históricos e indicadores de gestión</p>
        </div>

        <Tabs defaultValue="balances" className="space-y-6">
          <TabsList className="flex flex-wrap w-full gap-1 h-auto">
            <TabsTrigger value="balances" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-3">
              <Scale className="w-4 h-4" />
              <span className="hidden sm:inline">Balances Faena</span>
            </TabsTrigger>
            <TabsTrigger value="rendimientos" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-3">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Rendimientos</span>
            </TabsTrigger>
            <TabsTrigger value="indicadores" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-3">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Indicadores</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="balances">
            <BalancesFaena operador={operador} />
          </TabsContent>
          <TabsContent value="rendimientos">
            <RendimientosHistorico operador={operador} />
          </TabsContent>
          <TabsContent value="indicadores">
            <Indicadores operador={operador} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default BalancesModule
