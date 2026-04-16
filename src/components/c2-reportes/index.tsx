'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  FileText, TrendingUp, BarChart3, Loader2, RefreshCw,
  ArrowUpRight, ArrowDownRight, Minus, AlertTriangle, Package
} from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  rol: string
}

export default function C2ReportesModule({ operador }: { operador: Operador }) {
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'mermaCuarteo' | 'resumenDiario' | 'trazabilidad'>('mermaCuarteo')
  const [filtroFecha, setFiltroFecha] = useState(new Date().toISOString().split('T')[0])

  // Merma de Cuarteo
  const [mermaData, setMermaData] = useState<any[]>([])
  // Resumen diario
  const [resumenDiario, setResumenDiario] = useState<any>(null)
  // Trazabilidad
  const [trazabilidadCodigo, setTrazabilidadCodigo] = useState('')
  const [trazabilidadData, setTrazabilidadData] = useState<any>(null)

  useEffect(() => {
    if (tab === 'mermaCuarteo') cargarMermaCuarteo()
    if (tab === 'resumenDiario') cargarResumenDiario()
  }, [tab, filtroFecha])

  const cargarMermaCuarteo = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cuarteo?limit=200')
      const data = await res.json()
      if (data.success) {
        setMermaData(data.data || [])
      }
    } catch (error) {
      console.error('Error cargando merma cuarteo:', error)
    } finally {
      setLoading(false)
    }
  }

  const cargarResumenDiario = async () => {
    setLoading(true)
    try {
      const [rendRes, stockRes, degradRes] = await Promise.all([
        fetch(`/api/c2-rendimiento?tipo=global&fecha=${filtroFecha}`),
        fetch(`/api/c2-stock?agrupar=estado`),
        fetch('/api/c2-degradacion?limit=100')
      ])

      const rendData = await rendRes.json()
      const stockData = await stockRes.json()
      const degradData = await degradRes.json()

      setResumenDiario({
        rendimiento: rendData.success ? rendData.data : null,
        stock: stockData.success ? stockData.data : [],
        degradaciones: degradData.success ? degradData.data : []
      })
    } catch (error) {
      console.error('Error cargando resumen diario:', error)
    } finally {
      setLoading(false)
    }
  }

  const buscarTrazabilidad = async () => {
    if (!trazabilidadCodigo) return
    setLoading(true)
    try {
      // Buscar en cajas
      const res = await fetch(`/api/c2-produccion-cajas?limit=10`)
      const data = await res.json()
      if (data.success) {
        const caja = (data.data || []).find(
          (c: any) => c.numero === trazabilidadCodigo || c.codigoBarras === trazabilidadCodigo || c.barcodeGs1_128?.includes(trazabilidadCodigo)
        )
        if (caja) {
          setTrazabilidadData({ tipo: 'caja', data: caja })
        } else {
          setTrazabilidadData(null)
          toast.error('No se encontró el código')
        }
      }
    } catch (error) {
      toast.error('Error de búsqueda')
    } finally {
      setLoading(false)
    }
  }

  const getRendimientoColor = (v: number) => v >= 80 ? 'text-green-600' : v >= 60 ? 'text-amber-600' : 'text-red-600'

  // Calcular merma de cuarteo
  const mermaCuarteoStats = mermaData.map((r: any) => {
    const pesos = r.pesos || []
    const sumaCuartos = pesos.reduce((s: number, p: any) => s + (p.peso || 0), 0)
    const pesoMedia = r.pesoMediaRes || r.pesoMedia || 0
    const merma = pesoMedia - sumaCuartos
    const porcentaje = pesoMedia > 0 ? (merma / pesoMedia * 100) : 0
    return { ...r, sumaCuartos, pesoMedia, merma, porcentaje }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <FileText className="w-8 h-8 text-amber-500" />
              Reportes C2
            </h1>
            <p className="text-stone-500 mt-1">Reportes de merma, resumen diario y trazabilidad</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'mermaCuarteo' as const, label: 'Merma Cuarteo', icon: BarChart3 },
            { key: 'resumenDiario' as const, label: 'Resumen Diario', icon: FileText },
            { key: 'trazabilidad' as const, label: 'Trazabilidad', icon: Package }
          ].map(t => (
            <Button
              key={t.key}
              variant={tab === t.key ? 'default' : 'outline'}
              className={tab === t.key ? 'bg-amber-500' : ''}
              onClick={() => setTab(t.key)}
            >
              <t.icon className="w-4 h-4 mr-2" />
              {t.label}
            </Button>
          ))}
        </div>

        {/* TAB: Merma de Cuarteo */}
        {tab === 'mermaCuarteo' && (
          <div className="space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-500" />
                  Reporte de Merma por Oreo en Cuarteo
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {mermaCuarteoStats.length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No hay registros de cuarteo</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    <div className="grid grid-cols-7 gap-2 p-3 bg-stone-50 text-xs font-medium text-stone-500">
                      <span>Fecha</span>
                      <span>Tropa</span>
                      <span className="text-right">Peso Media</span>
                      <span className="text-right">Suma Cuartos</span>
                      <span className="text-right">Merma (kg)</span>
                      <span className="text-right">% Merma</span>
                      <span className="text-right">Estado</span>
                    </div>
                    {mermaCuarteoStats.map((r: any, i: number) => (
                      <div key={i} className="grid grid-cols-7 gap-2 p-3 items-center hover:bg-stone-50 text-sm">
                        <span>{new Date(r.fecha || r.createdAt).toLocaleDateString('es-AR')}</span>
                        <span className="font-mono">{r.tropaCodigo || r.tropa?.codigo || '-'}</span>
                        <span className="text-right font-medium">{r.pesoMedia.toFixed(1)}</span>
                        <span className="text-right font-medium">{r.sumaCuartos.toFixed(1)}</span>
                        <span className={`text-right font-bold ${r.merma >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {r.merma.toFixed(1)}
                        </span>
                        <span className={`text-right font-bold ${getRendimientoColor(100 - r.porcentaje)}`}>
                          {r.porcentaje.toFixed(1)}%
                        </span>
                        <div className="text-right">
                          {r.porcentaje > 5 ? (
                            <Badge className="bg-red-100 text-red-800 text-xs">Alta merma</Badge>
                          ) : r.porcentaje > 2 ? (
                            <Badge className="bg-amber-100 text-amber-800 text-xs">Normal</Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800 text-xs">OK</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB: Resumen Diario */}
        {tab === 'resumenDiario' && (
          <div className="space-y-4">
            <div className="flex gap-3 mb-2">
              <Input
                type="date"
                value={filtroFecha}
                onChange={e => setFiltroFecha(e.target.value)}
                className="w-48"
              />
              <Button variant="outline" onClick={cargarResumenDiario}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
            </div>

            {resumenDiario?.rendimiento && (
              <Card className="border-0 shadow-md">
                <CardHeader className="bg-amber-50 rounded-t-lg py-3">
                  <CardTitle className="text-base">Rendimiento del día</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-stone-500">Ingresado</p>
                      <p className="text-lg font-bold text-blue-700">{resumenDiario.rendimiento.totalIngresado.toFixed(1)} kg</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-stone-500">Producido</p>
                      <p className="text-lg font-bold text-green-700">{resumenDiario.rendimiento.totalProducido.toFixed(1)} kg</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs text-stone-500">Subproductos</p>
                      <p className="text-lg font-bold text-purple-700">{resumenDiario.rendimiento.totalSubproductos.toFixed(1)} kg</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-xs text-stone-500">Merma</p>
                      <p className="text-lg font-bold text-red-700">{resumenDiario.rendimiento.mermaTotal.toFixed(1)} kg</p>
                    </div>
                    <div className="text-center p-3 bg-amber-50 rounded-lg">
                      <p className="text-xs text-stone-500">Rendimiento</p>
                      <p className={`text-lg font-bold ${getRendimientoColor(resumenDiario.rendimiento.rendimientoGlobal)}`}>
                        {resumenDiario.rendimiento.rendimientoGlobal.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {resumenDiario?.stock && (
              <Card className="border-0 shadow-md">
                <CardHeader className="bg-stone-50 rounded-t-lg py-3">
                  <CardTitle className="text-base">Stock por Estado</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {resumenDiario.stock.map((s: any) => (
                      <div key={s.estado} className="text-center p-3 bg-stone-50 rounded-lg">
                        <p className="text-xs text-stone-500">{s.estado.replace('_', ' ')}</p>
                        <p className="text-lg font-bold">{s.cantidadCajas} cajas</p>
                        <p className="text-sm text-stone-600">{s.pesoNetoTotal.toFixed(1)} kg</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {resumenDiario?.degradaciones && resumenDiario.degradaciones.length > 0 && (
              <Card className="border-0 shadow-md">
                <CardHeader className="bg-red-50 rounded-t-lg py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Degradaciones recientes ({resumenDiario.degradaciones.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {resumenDiario.degradaciones.slice(0, 10).map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between p-2 bg-white rounded text-sm">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-amber-100 text-amber-800 text-xs">{d.tipo}</Badge>
                          <span className="font-mono text-xs">{d.cajaOriginal?.numero}</span>
                          <span>{d.cajaOriginal?.productoDesposte?.nombre || '-'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-stone-500">
                          <span>{d.pesoDegradado.toFixed(2)} kg</span>
                          <span>{d.motivo}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* TAB: Trazabilidad */}
        {tab === 'trazabilidad' && (
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                Búsqueda de Trazabilidad
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex gap-3">
                <Input
                  value={trazabilidadCodigo}
                  onChange={e => setTrazabilidadCodigo(e.target.value)}
                  placeholder="Ingrese código de caja, código de barras o GS1-128..."
                  className="flex-1"
                  onKeyDown={e => e.key === 'Enter' && buscarTrazabilidad()}
                />
                <Button className="bg-amber-500 hover:bg-amber-600" onClick={buscarTrazabilidad}>
                  Buscar
                </Button>
              </div>

              {trazabilidadData && trazabilidadData.tipo === 'caja' && (
                <div className="border rounded-lg p-4 space-y-3">
                  <h3 className="font-bold text-lg">Caja: {trazabilidadData.data.numero}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-stone-400 text-xs">Producto</p>
                      <p className="font-medium">{trazabilidadData.data.productoDesposte?.nombre || '-'}</p>
                    </div>
                    <div>
                      <p className="text-stone-400 text-xs">Peso Neto</p>
                      <p className="font-medium">{trazabilidadData.data.pesoNeto?.toFixed(2)} kg</p>
                    </div>
                    <div>
                      <p className="text-stone-400 text-xs">Tropa</p>
                      <p className="font-medium font-mono">{trazabilidadData.data.tropaCodigo || '-'}</p>
                    </div>
                    <div>
                      <p className="text-stone-400 text-xs">Estado</p>
                      <Badge variant="outline">{trazabilidadData.data.estado}</Badge>
                    </div>
                    <div>
                      <p className="text-stone-400 text-xs">Fecha Faena</p>
                      <p className="font-medium">
                        {trazabilidadData.data.fechaFaena ? new Date(trazabilidadData.data.fechaFaena).toLocaleDateString('es-AR') : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-stone-400 text-xs">Fecha Desposte</p>
                      <p className="font-medium">
                        {trazabilidadData.data.fechaDesposte ? new Date(trazabilidadData.data.fechaDesposte).toLocaleDateString('es-AR') : '-'}
                      </p>
                    </div>
                  </div>

                  {trazabilidadData.data.barcodeGs1_128 && (
                    <div className="p-3 bg-stone-50 rounded-lg">
                      <p className="text-xs text-stone-400">Código GS1-128</p>
                      <p className="font-mono text-sm break-all">{trazabilidadData.data.barcodeGs1_128}</p>
                    </div>
                  )}

                  {trazabilidadData.data.cuarto && (
                    <div className="p-3 bg-stone-50 rounded-lg">
                      <p className="text-xs text-stone-400 mb-1">Cuarto de Origen</p>
                      <p className="text-sm">Código: {trazabilidadData.data.cuarto.codigo} · Tipo: {trazabilidadData.data.cuarto.tipoCuarto?.nombre || '-'}</p>
                    </div>
                  )}

                  {trazabilidadData.data.pallet && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-stone-400 mb-1">Pallet</p>
                      <p className="text-sm">Pallet: {trazabilidadData.data.pallet.numero} · SSCC: {trazabilidadData.data.pallet.ssccCode || '-'}</p>
                    </div>
                  )}
                </div>
              )}

              {!trazabilidadData && trazabilidadCodigo && !loading && (
                <p className="text-center text-stone-400">No se encontró el código ingresado</p>
              )}
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        )}
      </div>
    </div>
  )
}
