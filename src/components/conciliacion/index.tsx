'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Upload, FileCheck, AlertTriangle, History, Building2, DollarSign
} from 'lucide-react'
import { ImportarExtracto } from './importar-extracto'
import { ConciliacionAutomatica } from './conciliacion-automatica'
import { ResolucionDiferencias } from './resolucion-diferencias'

interface Operador {
  id: string
  nombre: string
  rol: string
}

export function ConciliacionModule({ operador }: { operador: Operador }) {
  const [activeTab, setActiveTab] = useState('importar')
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-500" />
              Conciliación Bancaria Automática
            </h1>
            <p className="text-stone-500 mt-1">
              Importe extractos, procese conciliaciones y resuelva diferencias
            </p>
          </div>
        </div>
        
        {/* Resumen rápido */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Importar</p>
                  <p className="font-medium text-sm">Extracto CSV</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-500 p-2 rounded-lg">
                  <FileCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Procesar</p>
                  <p className="font-medium text-sm">Conciliación Auto</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-red-500 p-2 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Resolver</p>
                  <p className="font-medium text-sm">Diferencias</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500 p-2 rounded-lg">
                  <History className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Ver</p>
                  <p className="font-medium text-sm">Historial</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs principales */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-xl">
            <TabsTrigger value="importar" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span className="hidden md:inline">Importar</span>
            </TabsTrigger>
            <TabsTrigger value="procesar" className="flex items-center gap-2">
              <FileCheck className="w-4 h-4" />
              <span className="hidden md:inline">Procesar</span>
            </TabsTrigger>
            <TabsTrigger value="diferencias" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden md:inline">Diferencias</span>
            </TabsTrigger>
            <TabsTrigger value="historial" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span className="hidden md:inline">Historial</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="importar">
            <ImportarExtracto operador={operador} />
          </TabsContent>
          
          <TabsContent value="procesar">
            <ConciliacionAutomatica operador={operador} />
          </TabsContent>
          
          <TabsContent value="diferencias">
            <ResolucionDiferencias operador={operador} />
          </TabsContent>
          
          <TabsContent value="historial">
            <HistorialConciliaciones operador={operador} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Componente de historial
function HistorialConciliaciones({ operador }: { operador: Operador }) {
  const [conciliaciones, setConciliaciones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  useState(() => {
    fetchHistorial()
  })
  
  const fetchHistorial = async () => {
    try {
      const res = await fetch('/api/conciliacion/importar')
      const data = await res.json()
      setConciliaciones(data.data || [])
    } catch (error) {
      console.error('Error fetching historial:', error)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-stone-500">Cargando historial...</p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Historial de Conciliaciones
        </CardTitle>
        <CardDescription>
          Todas las conciliaciones realizadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {conciliaciones.length === 0 ? (
          <div className="text-center py-8 text-stone-400">
            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay conciliaciones en el historial</p>
          </div>
        ) : (
          <div className="space-y-4">
            {conciliaciones.map((conc: any) => (
              <div 
                key={conc.id} 
                className="border rounded-lg p-4 hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium">{conc.nombreArchivo}</p>
                    <p className="text-sm text-stone-500">
                      {conc.cuentaBancaria?.banco} - {conc.cuentaBancaria?.numeroCuenta}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    conc.estado === 'CONFIRMADA' ? 'bg-green-100 text-green-800' :
                    conc.estado === 'PROCESADA' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {conc.estado}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-4 text-center text-sm">
                  <div>
                    <p className="text-stone-400">Registros</p>
                    <p className="font-medium">{conc.totalRegistros}</p>
                  </div>
                  <div>
                    <p className="text-stone-400">Conciliados</p>
                    <p className="font-medium text-green-600">{conc.conciliados}</p>
                  </div>
                  <div>
                    <p className="text-stone-400">Diferencias</p>
                    <p className="font-medium text-red-600">{conc.diferencias}</p>
                  </div>
                  <div>
                    <p className="text-stone-400">Fecha</p>
                    <p className="font-medium">
                      {new Date(conc.fecha).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ConciliacionModule
