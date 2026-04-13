'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Bell, AlertTriangle, CheckCircle, Package, Settings, RefreshCw } from 'lucide-react'

interface Props {
  operador?: { id: string; nombre: string; rol: string }
}

export function AlertasStockModule({ operador }: Props) {
  const [loading, setLoading] = useState(true)
  const [alertas, setAlertas] = useState<any[]>([])

  useEffect(() => {
    fetchAlertas()
  }, [])

  const fetchAlertas = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/alertas/stock')
      const data = await res.json()
      setAlertas(data.alertas || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Alertas de Stock</h1>
            <p className="text-stone-500 mt-1">Notificaciones de stock bajo y crítico</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchAlertas}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Alertas Activas ({alertas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alertas.length === 0 ? (
              <div className="text-center py-8 text-stone-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                <p>No hay alertas de stock</p>
              </div>
            ) : (
              <div className="divide-y">
                {alertas.map((alerta, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-4">
                    <AlertTriangle className={`w-5 h-5 ${
                      alerta.nivel === 'CRITICO' ? 'text-red-500' : 'text-amber-500'
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium">{alerta.producto}</p>
                      <p className="text-sm text-stone-500">
                        Stock actual: {alerta.stockActual} | Mínimo: {alerta.stockMinimo}
                      </p>
                    </div>
                    <Badge className={alerta.nivel === 'CRITICO' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                      {alerta.nivel}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AlertasStockModule
