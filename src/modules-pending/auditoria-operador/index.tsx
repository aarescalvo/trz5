'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  History, User, Calendar, Clock, Filter, Download, Search, 
  Eye, FileText, AlertTriangle, CheckCircle, XCircle, Activity,
  ChevronLeft, ChevronRight, RefreshCw, TrendingUp, Users
} from 'lucide-react'

// Tipos
interface AuditoriaItem {
  id: string
  operadorId: string
  operador?: {
    id: string
    nombre: string
    usuario: string
    rol: string
  }
  modulo: string
  accion: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'ERROR' | 'VIEW'
  entidad: string
  entidadId?: string
  descripcion: string
  datosAntes?: string
  datosDespues?: string
  fecha: string
  ip?: string
}

interface OperadorStats {
  operadorId: string
  operadorNombre: string
  totalAcciones: number
  creates: number
  updates: number
  deletes: number
  logins: number
  errores: number
  ultimoAcceso: string
}

interface FiltrosAuditoria {
  operadorId?: string
  modulo?: string
  accion?: string
  fechaDesde?: string
  fechaHasta?: string
  busqueda?: string
}

interface Props {
  operador?: {
    id: string
    nombre: string
    rol: string
  }
}

// Módulos del sistema
const MODULOS = [
  { id: 'PESAJE_CAMIONES', nombre: 'Pesaje Camiones' },
  { id: 'PESAJE_INDIVIDUAL', nombre: 'Pesaje Individual' },
  { id: 'MOVIMIENTO_HACIENDA', nombre: 'Movimiento Hacienda' },
  { id: 'LISTA_FAENA', nombre: 'Lista de Faena' },
  { id: 'ROMANEO', nombre: 'Romaneo' },
  { id: 'MENUDENCIAS', nombre: 'Menudencias' },
  { id: 'CUEROS', nombre: 'Cueros' },
  { id: 'RENDERING', nombre: 'Rendering' },
  { id: 'DESPACHOS', nombre: 'Despachos' },
  { id: 'FACTURACION', nombre: 'Facturación' },
  { id: 'CONFIGURACION', nombre: 'Configuración' },
  { id: 'AUTH', nombre: 'Autenticación' },
  { id: 'STOCK', nombre: 'Stock' },
  { id: 'REPORTES', nombre: 'Reportes' },
]

// Colores por acción
const ACCION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700 border-green-300',
  UPDATE: 'bg-blue-100 text-blue-700 border-blue-300',
  DELETE: 'bg-red-100 text-red-700 border-red-300',
  LOGIN: 'bg-purple-100 text-purple-700 border-purple-300',
  LOGOUT: 'bg-gray-100 text-gray-700 border-gray-300',
  ERROR: 'bg-red-100 text-red-700 border-red-300',
  VIEW: 'bg-stone-100 text-stone-700 border-stone-300',
}

const ACCION_ICONS: Record<string, typeof CheckCircle> = {
  CREATE: CheckCircle,
  UPDATE: TrendingUp,
  DELETE: XCircle,
  LOGIN: User,
  LOGOUT: User,
  ERROR: AlertTriangle,
  VIEW: Eye,
}

export function AuditoriaOperadorModule({ operador }: Props) {
  const [auditorias, setAuditorias] = useState<AuditoriaItem[]>([])
  const [operadores, setOperadores] = useState<{ id: string; nombre: string }[]>([])
  const [stats, setStats] = useState<OperadorStats[]>([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState<FiltrosAuditoria>({})
  const [selectedAuditoria, setSelectedAuditoria] = useState<AuditoriaItem | null>(null)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [tabActivo, setTabActivo] = useState<'historial' | 'estadisticas'>('historial')

  useEffect(() => {
    fetchAuditorias()
    fetchOperadores()
    fetchStats()
  }, [filtros, pagina])

  const fetchAuditorias = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtros.operadorId) params.append('operadorId', filtros.operadorId)
      if (filtros.modulo) params.append('modulo', filtros.modulo)
      if (filtros.accion) params.append('accion', filtros.accion)
      if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde)
      if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta)
      if (filtros.busqueda) params.append('busqueda', filtros.busqueda)
      params.append('pagina', pagina.toString())
      params.append('limite', '50')

      const res = await fetch(`/api/auditoria?${params}`)
      const data = await res.json()
      if (data.success) {
        setAuditorias(data.data)
        setTotalPaginas(data.paginas || 1)
      }
    } catch (error) {
      console.error('Error fetching auditorias:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOperadores = async () => {
    try {
      const res = await fetch('/api/operadores?simple=true')
      const data = await res.json()
      if (data.success) {
        setOperadores(data.data)
      }
    } catch (error) {
      console.error('Error fetching operadores:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/auditoria/stats')
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  // Exportar a CSV
  const exportarCSV = async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
      params.append('formato', 'csv')

      const res = await fetch(`/api/auditoria/exportar?${params}`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `auditoria_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      toast.success('Auditoría exportada correctamente')
    } catch (error) {
      toast.error('Error al exportar')
    }
  }

  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Ver detalle de auditoría
  const VerDetalle = ({ auditoria }: { auditoria: AuditoriaItem }) => (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Detalle de Auditoría
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setSelectedAuditoria(null)}>
            ✕
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info general */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-stone-500">Operador</Label>
            <p className="font-medium">{auditoria.operador?.nombre || 'Sistema'}</p>
          </div>
          <div>
            <Label className="text-xs text-stone-500">Usuario</Label>
            <p className="font-medium">{auditoria.operador?.usuario || '-'}</p>
          </div>
          <div>
            <Label className="text-xs text-stone-500">Módulo</Label>
            <p className="font-medium">{auditoria.modulo}</p>
          </div>
          <div>
            <Label className="text-xs text-stone-500">Acción</Label>
            <Badge className={ACCION_COLORS[auditoria.accion]}>
              {auditoria.accion}
            </Badge>
          </div>
          <div>
            <Label className="text-xs text-stone-500">Entidad</Label>
            <p className="font-medium">{auditoria.entidad}</p>
          </div>
          <div>
            <Label className="text-xs text-stone-500">ID Entidad</Label>
            <p className="font-mono text-sm">{auditoria.entidadId || '-'}</p>
          </div>
          <div>
            <Label className="text-xs text-stone-500">Fecha</Label>
            <p className="font-medium">{formatearFecha(auditoria.fecha)}</p>
          </div>
          <div>
            <Label className="text-xs text-stone-500">IP</Label>
            <p className="font-mono text-sm">{auditoria.ip || '-'}</p>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <Label className="text-xs text-stone-500">Descripción</Label>
          <p className="p-3 bg-stone-50 rounded-lg">{auditoria.descripcion}</p>
        </div>

        {/* Datos antes/después */}
        {auditoria.datosAntes && (
          <div>
            <Label className="text-xs text-stone-500">Datos Antes</Label>
            <pre className="p-3 bg-red-50 rounded-lg text-xs overflow-auto max-h-40">
              {JSON.stringify(JSON.parse(auditoria.datosAntes), null, 2)}
            </pre>
          </div>
        )}
        {auditoria.datosDespues && (
          <div>
            <Label className="text-xs text-stone-500">Datos Después</Label>
            <pre className="p-3 bg-green-50 rounded-lg text-xs overflow-auto max-h-40">
              {JSON.stringify(JSON.parse(auditoria.datosDespues), null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )

  // Panel de estadísticas
  const PanelEstadisticas = () => (
    <div className="space-y-6">
      {/* Resumen general */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-xs text-stone-500">Total Acciones</p>
                <p className="text-2xl font-bold">
                  {stats.reduce((acc, s) => acc + s.totalAcciones, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-xs text-stone-500">Creaciones</p>
                <p className="text-2xl font-bold">
                  {stats.reduce((acc, s) => acc + s.creates, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-xs text-stone-500">Actualizaciones</p>
                <p className="text-2xl font-bold">
                  {stats.reduce((acc, s) => acc + s.updates, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-xs text-stone-500">Errores</p>
                <p className="text-2xl font-bold">
                  {stats.reduce((acc, s) => acc + s.errores, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ranking por operador */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Actividad por Operador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.sort((a, b) => b.totalAcciones - a.totalAcciones).map((stat, idx) => (
              <div key={stat.operadorId} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{stat.operadorNombre}</p>
                  <p className="text-xs text-stone-500">
                    Último acceso: {formatearFecha(stat.ultimoAcceso)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3 mr-1" /> {stat.creates}
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-700">
                    <TrendingUp className="w-3 h-3 mr-1" /> {stat.updates}
                  </Badge>
                  <Badge className="bg-red-100 text-red-700">
                    <XCircle className="w-3 h-3 mr-1" /> {stat.deletes}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-amber-600">{stat.totalAcciones}</p>
                  <p className="text-xs text-stone-500">acciones</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Lista de auditoría
  const ListaAuditoria = () => (
    <Card className="border-0 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Historial de Auditoría
        </CardTitle>
        <Button variant="outline" size="sm" onClick={exportarCSV}>
          <Download className="w-4 h-4 mr-1" /> Exportar CSV
        </Button>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <Select 
            value={filtros.operadorId || ''} 
            onValueChange={(v) => setFiltros(prev => ({ ...prev, operadorId: v || undefined }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Operador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {operadores.map(op => (
                <SelectItem key={op.id} value={op.id}>{op.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={filtros.modulo || ''} 
            onValueChange={(v) => setFiltros(prev => ({ ...prev, modulo: v || undefined }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Módulo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {MODULOS.map(m => (
                <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={filtros.accion || ''} 
            onValueChange={(v) => setFiltros(prev => ({ ...prev, accion: v || undefined }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Acción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              <SelectItem value="CREATE">Crear</SelectItem>
              <SelectItem value="UPDATE">Actualizar</SelectItem>
              <SelectItem value="DELETE">Eliminar</SelectItem>
              <SelectItem value="LOGIN">Login</SelectItem>
              <SelectItem value="LOGOUT">Logout</SelectItem>
              <SelectItem value="ERROR">Error</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={filtros.fechaDesde || ''}
            onChange={(e) => setFiltros(prev => ({ ...prev, fechaDesde: e.target.value }))}
            placeholder="Desde"
          />

          <Input
            type="date"
            value={filtros.fechaHasta || ''}
            onChange={(e) => setFiltros(prev => ({ ...prev, fechaHasta: e.target.value }))}
            placeholder="Hasta"
          />
        </div>

        {/* Búsqueda */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            className="pl-10"
            placeholder="Buscar en descripción..."
            value={filtros.busqueda || ''}
            onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
          />
        </div>

        {/* Lista */}
        <div className="divide-y max-h-[500px] overflow-y-auto">
          {auditorias.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay registros de auditoría</p>
            </div>
          ) : (
            auditorias.map(item => {
              const Icon = ACCION_ICONS[item.accion] || Activity
              return (
                <div 
                  key={item.id}
                  className="flex items-center gap-3 p-3 hover:bg-stone-50 cursor-pointer"
                  onClick={() => setSelectedAuditoria(item)}
                >
                  <div className={`p-2 rounded-lg ${ACCION_COLORS[item.accion]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.operador?.nombre || 'Sistema'}</span>
                      <Badge variant="outline" className="text-xs">{item.modulo}</Badge>
                    </div>
                    <p className="text-sm text-stone-600 truncate">{item.descripcion}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-stone-500">
                      {formatearFecha(item.fecha)}
                    </p>
                    <p className="text-xs text-stone-400">{item.ip || '-'}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-stone-500">
              Página {pagina} de {totalPaginas}
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                disabled={pagina <= 1}
                onClick={() => setPagina(p => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                disabled={pagina >= totalPaginas}
                onClick={() => setPagina(p => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">
              Auditoría por Operador
            </h1>
            <p className="text-stone-500 mt-1">
              Registro detallado de todas las acciones del sistema
            </p>
          </div>
          <Button variant="outline" onClick={() => { fetchAuditorias(); fetchStats(); }}>
            <RefreshCw className="w-4 h-4 mr-1" /> Actualizar
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={tabActivo} onValueChange={(v) => setTabActivo(v as 'historial' | 'estadisticas')}>
          <TabsList className="mb-6">
            <TabsTrigger value="historial" className="flex items-center gap-2">
              <History className="w-4 h-4" /> Historial
            </TabsTrigger>
            <TabsTrigger value="estadisticas" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Estadísticas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="historial">
            {selectedAuditoria ? (
              <VerDetalle auditoria={selectedAuditoria} />
            ) : (
              <ListaAuditoria />
            )}
          </TabsContent>

          <TabsContent value="estadisticas">
            <PanelEstadisticas />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default AuditoriaOperadorModule
