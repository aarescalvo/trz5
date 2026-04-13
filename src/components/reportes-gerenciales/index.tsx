'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, TrendingUp, Package, DollarSign, Warehouse, 
  BarChart3, PieChart, FileBarChart, Download, Calendar,
  Beef, Scale, Building2, CreditCard, Receipt
} from 'lucide-react'
import { ReporteFaena } from './reporte-faena'
import { ReporteCostos } from './reporte-costos'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface ReportesGerencialesProps {
  operador: Operador
}

const reportesMenu = [
  {
    id: 'faena',
    titulo: 'Reporte de Faena',
    descripcion: 'Producción por período, tropa y tipo animal',
    icon: Beef,
    color: 'bg-amber-500',
    badge: null
  },
  {
    id: 'rendimientos',
    titulo: 'Reporte de Rendimientos',
    descripcion: 'Histórico y comparativo de rindes',
    icon: TrendingUp,
    color: 'bg-green-500',
    badge: 'Nuevo'
  },
  {
    id: 'insumos',
    titulo: 'Consumo de Insumos',
    descripcion: 'Por centro de costo y período',
    icon: Package,
    color: 'bg-blue-500',
    badge: null
  },
  {
    id: 'costos',
    titulo: 'Reporte de Costos',
    descripcion: 'Por kg producido, por cabeza y centro',
    icon: DollarSign,
    color: 'bg-purple-500',
    badge: null
  },
  {
    id: 'cuentas',
    titulo: 'Cuentas Corrientes',
    descripcion: 'Saldos y antigüedad de deudas',
    icon: Building2,
    color: 'bg-cyan-500',
    badge: '3 pendientes'
  },
  {
    id: 'cajas',
    titulo: 'Reporte de Cajas',
    descripcion: 'Movimientos y arqueos',
    icon: CreditCard,
    color: 'bg-rose-500',
    badge: null
  }
]

export function ReportesGerenciales({ operador }: ReportesGerencialesProps) {
  const [activeReport, setActiveReport] = useState<string | null>(null)
  
  const renderReport = () => {
    switch (activeReport) {
      case 'faena':
        return <ReporteFaena operador={operador} />
      case 'costos':
        return <ReporteCostos operador={operador} />
      default:
        return null
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <FileBarChart className="w-8 h-8 text-amber-500" />
              Reportes Gerenciales
            </h1>
            <p className="text-stone-500 mt-1">Informes ejecutivos y análisis de gestión</p>
          </div>
          {activeReport && (
            <Button variant="outline" onClick={() => setActiveReport(null)}>
              ← Volver al menú
            </Button>
          )}
        </div>
        
        {activeReport ? (
          // Vista de reporte específico
          renderReport()
        ) : (
          // Menú de reportes
          <>
            {/* Resumen rápido */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500 rounded-lg">
                      <Beef className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Faena Mes</p>
                      <p className="text-xl font-bold text-stone-800">--</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Rinde Prom.</p>
                      <p className="text-xl font-bold text-stone-800">--%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Costo/Kg</p>
                      <p className="text-xl font-bold text-stone-800">$--</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <Receipt className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Facturado</p>
                      <p className="text-xl font-bold text-stone-800">$--</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Grid de reportes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportesMenu.map((reporte) => (
                <Card 
                  key={reporte.id}
                  className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => setActiveReport(reporte.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg ${reporte.color}`}>
                        <reporte.icon className="w-6 h-6 text-white" />
                      </div>
                      {reporte.badge && (
                        <Badge className="bg-red-100 text-red-700 text-xs">
                          {reporte.badge}
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-stone-800 mb-1 group-hover:text-amber-600 transition-colors">
                      {reporte.titulo}
                    </h3>
                    <p className="text-sm text-stone-500">{reporte.descripcion}</p>
                    
                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-stone-400">
                        <Calendar className="w-3 h-3" />
                        <span>Último: --</span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-amber-600">
                        Ver <Download className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Accesos rápidos a exportaciones */}
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Download className="w-5 h-5 text-amber-500" />
                  Exportaciones Rápidas
                </CardTitle>
                <CardDescription>
                  Descargue reportes predefinidos en formato CSV o PDF
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-1">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <span className="text-xs">Faena Mensual</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-1">
                    <BarChart3 className="w-5 h-5 text-green-500" />
                    <span className="text-xs">Rindes</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-1">
                    <Package className="w-5 h-5 text-purple-500" />
                    <span className="text-xs">Stock Actual</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-1">
                    <DollarSign className="w-5 h-5 text-amber-500" />
                    <span className="text-xs">Ctas. Ctes.</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

export default ReportesGerenciales
