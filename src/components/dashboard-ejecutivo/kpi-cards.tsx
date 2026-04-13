'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Beef, Scale, TrendingUp, TrendingDown, Weight, DollarSign, 
  Package, AlertTriangle, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react'

interface KPIData {
  animalesFaenadosHoy: number
  animalesFaenadosAyer: number
  rindePromedio: number
  rindeSemaforo: 'verde' | 'amarillo' | 'rojo'
  pesoTotalFaenado: number
  ingresosDia: number
  cobranzasDia: number
  stockCritico: number
  chequesAVencer: number
}

interface KPICardsProps {
  data: KPIData
  loading?: boolean
}

export function KPICards({ data, loading }: KPICardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="border-0 shadow-md animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-stone-200 rounded w-1/2 mb-2" />
              <div className="h-8 bg-stone-200 rounded w-3/4 mb-1" />
              <div className="h-3 bg-stone-200 rounded w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const variacionAnimales = data.animalesFaenadosAyer > 0 
    ? parseFloat(((data.animalesFaenadosHoy - data.animalesFaenadosAyer) / data.animalesFaenadosAyer * 100).toFixed(1))
    : 0

  const getRindeColor = () => {
    switch (data.rindeSemaforo) {
      case 'verde': return 'text-green-600 bg-green-50 border-green-200'
      case 'amarillo': return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'rojo': return 'text-red-600 bg-red-50 border-red-200'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('es-AR').format(value)
  }

  const cards = [
    {
      title: 'Faena Hoy',
      value: data.animalesFaenadosHoy,
      unit: 'animales',
      icon: Beef,
      iconColor: 'bg-amber-500',
      trend: variacionAnimales,
      trendLabel: 'vs ayer',
      highlight: false
    },
    {
      title: 'Rinde Promedio',
      value: `${data.rindePromedio.toFixed(1)}%`,
      unit: '',
      icon: Scale,
      iconColor: data.rindeSemaforo === 'verde' ? 'bg-green-500' : data.rindeSemaforo === 'amarillo' ? 'bg-amber-500' : 'bg-red-500',
      customBadge: true,
      semaforo: data.rindeSemaforo,
      highlight: true
    },
    {
      title: 'Peso Total',
      value: formatNumber(data.pesoTotalFaenado),
      unit: 'kg',
      icon: Weight,
      iconColor: 'bg-blue-500',
      highlight: false
    },
    {
      title: 'Ingresos Hoy',
      value: formatCurrency(data.ingresosDia + data.cobranzasDia),
      unit: '',
      icon: DollarSign,
      iconColor: 'bg-emerald-500',
      subItems: [
        { label: 'Facturado', value: formatCurrency(data.ingresosDia) },
        { label: 'Cobranzas', value: formatCurrency(data.cobranzasDia) }
      ],
      highlight: false
    },
    {
      title: 'Stock Crítico',
      value: data.stockCritico,
      unit: 'items',
      icon: Package,
      iconColor: data.stockCritico > 0 ? 'bg-red-500' : 'bg-stone-400',
      alertLevel: data.stockCritico > 5 ? 'high' : data.stockCritico > 0 ? 'medium' : 'none',
      highlight: data.stockCritico > 0
    },
    {
      title: 'Cheques a Vencer',
      value: data.chequesAVencer,
      unit: 'esta semana',
      icon: AlertTriangle,
      iconColor: data.chequesAVencer > 0 ? 'bg-amber-500' : 'bg-stone-400',
      highlight: false
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <Card 
          key={index} 
          className={`border-0 shadow-md hover:shadow-lg transition-shadow ${card.highlight ? 'ring-2 ring-amber-200' : ''}`}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className={`p-2 rounded-lg ${card.iconColor}`}>
                <card.icon className="w-4 h-4 text-white" />
              </div>
              {card.trend !== undefined && (
                <div className={`flex items-center text-xs ${card.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {card.trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : 
                   card.trend < 0 ? <ArrowDownRight className="w-3 h-3" /> : 
                   <Minus className="w-3 h-3" />}
                  <span>{Math.abs(card.trend)}%</span>
                </div>
              )}
              {card.alertLevel && card.alertLevel !== 'none' && (
                <Badge variant="outline" className={`text-xs ${card.alertLevel === 'high' ? 'border-red-300 text-red-600' : 'border-amber-300 text-amber-600'}`}>
                  !
                </Badge>
              )}
            </div>
            
            <p className="text-xs text-stone-500 mb-1">{card.title}</p>
            <p className="text-xl font-bold text-stone-800">
              {card.value}
              {card.unit && <span className="text-sm font-normal text-stone-500 ml-1">{card.unit}</span>}
            </p>
            
            {card.customBadge && card.semaforo && (
              <div className="mt-2">
                <Badge className={`text-xs ${getRindeColor()}`}>
                  {card.semaforo === 'verde' ? '>55%' : card.semaforo === 'amarillo' ? '50-55%' : '<50%'}
                </Badge>
              </div>
            )}
            
            {card.trendLabel && (
              <p className="text-xs text-stone-400 mt-1">{card.trendLabel}</p>
            )}
            
            {card.subItems && (
              <div className="mt-2 space-y-1 text-xs text-stone-500">
                {card.subItems.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{item.label}:</span>
                    <span className="font-medium text-stone-700">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default KPICards
