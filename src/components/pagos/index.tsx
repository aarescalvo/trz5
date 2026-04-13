'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreditCard, Users, Building2, FileCheck } from 'lucide-react'
import { PagosProveedores } from './pagos-proveedores'
import { CobranzasClientes } from './cobranzas-clientes'
import { CuentasCorrientes } from './cuentas-corrientes'
import { Conciliaciones } from './conciliaciones'

interface Operador {
  id: string
  nombre: string
  rol: string
}

export function PagosModule({ operador }: { operador: Operador }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Pagos y Cobranzas</h1>
          <p className="text-stone-500">Gestión de pagos a proveedores, cobranzas de clientes y conciliaciones bancarias</p>
        </div>

        <Tabs defaultValue="proveedores" className="space-y-6">
          <TabsList className="flex flex-wrap w-full gap-1 h-auto">
            <TabsTrigger value="proveedores" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-3">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Pagos a Proveedores</span>
            </TabsTrigger>
            <TabsTrigger value="clientes" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-3">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Cobranzas de Clientes</span>
            </TabsTrigger>
            <TabsTrigger value="cuentas" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-3">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Cuentas Corrientes</span>
            </TabsTrigger>
            <TabsTrigger value="conciliaciones" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-3">
              <FileCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Conciliaciones</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proveedores">
            <PagosProveedores operador={operador} />
          </TabsContent>
          <TabsContent value="clientes">
            <CobranzasClientes operador={operador} />
          </TabsContent>
          <TabsContent value="cuentas">
            <CuentasCorrientes operador={operador} />
          </TabsContent>
          <TabsContent value="conciliaciones">
            <Conciliaciones operador={operador} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default PagosModule
