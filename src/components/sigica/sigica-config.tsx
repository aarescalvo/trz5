'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Save, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react'
import { SIGICAStatusCard } from './sigica-status-card'

interface SIGICAConfig {
  habilitado: boolean
  urlServicio: string | null
  usuario: string | null
  password: string | null
  establecimiento: string | null
  certificado: string | null
}

const URLS_PREDEFINIDAS = [
  { value: 'homologacion', label: 'Homologación (Pruebas)', url: 'https://siga-homologacion.senasa.gob.ar/ws/sigica' },
  { value: 'produccion', label: 'Producción', url: 'https://siga.senasa.gob.ar/ws/sigica' },
  { value: 'custom', label: 'Personalizada', url: '' }
]

export function SIGICAConfigForm() {
  const [config, setConfig] = useState<SIGICAConfig>({
    habilitado: false,
    urlServicio: '',
    usuario: '',
    password: '',
    establecimiento: '',
    certificado: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [urlTipo, setUrlTipo] = useState('homologacion')
  const [showPassword, setShowPassword] = useState(false)
  const [resultadoPrueba, setResultadoPrueba] = useState<{ exito: boolean; mensaje: string } | null>(null)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/sigica/config')
      const data = await response.json()
      
      if (data.success && data.data) {
        setConfig({
          habilitado: data.data.habilitado || false,
          urlServicio: data.data.urlServicio || '',
          usuario: data.data.usuario || '',
          password: '', // No viene la contraseña del servidor
          establecimiento: data.data.establecimiento || '',
          certificado: data.data.certificado || ''
        })
        
        // Determinar tipo de URL
        if (data.data.urlServicio?.includes('homologacion')) {
          setUrlTipo('homologacion')
        } else if (data.data.urlServicio?.includes('siga.senasa')) {
          setUrlTipo('produccion')
        } else if (data.data.urlServicio) {
          setUrlTipo('custom')
        }
      }
    } catch (error) {
      console.error('Error cargando configuración:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUrlTipoChange = (value: string) => {
    setUrlTipo(value)
    const urlPredefinida = URLS_PREDEFINIDAS.find(u => u.value === value)
    if (urlPredefinida && urlPredefinida.url) {
      setConfig(prev => ({ ...prev, urlServicio: urlPredefinida.url }))
    }
  }

  const handleSave = async (probarConexion: boolean = false) => {
    setSaving(true)
    setResultadoPrueba(null)
    
    try {
      const response = await fetch('/api/sigica/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          probarConexion
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        if (data.pruebaConexion) {
          setResultadoPrueba(data.pruebaConexion)
        }
        // Actualizar estado si es necesario
        if (data.data) {
          setConfig(prev => ({
            ...prev,
            habilitado: data.data.habilitado
          }))
        }
      } else {
        setResultadoPrueba({
          exito: false,
          mensaje: data.error || 'Error al guardar configuración'
        })
      }
    } catch (error) {
      console.error('Error guardando configuración:', error)
      setResultadoPrueba({
        exito: false,
        mensaje: 'Error de conexión al servidor'
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estado de la conexión */}
      <SIGICAStatusCard loading={saving} />

      {/* Formulario de configuración */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de SIGICA</CardTitle>
          <CardDescription>
            Configure los parámetros de conexión con el sistema SIGICA del SENASA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Habilitar integración */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="habilitado">Habilitar Integración</Label>
              <p className="text-sm text-muted-foreground">
                Activa la comunicación con el sistema SIGICA
              </p>
            </div>
            <Switch
              id="habilitado"
              checked={config.habilitado}
              onCheckedChange={(checked) => 
                setConfig(prev => ({ ...prev, habilitado: checked }))
              }
            />
          </div>

          {/* URL del servicio */}
          <div className="space-y-2">
            <Label>Ambiente</Label>
            <Select value={urlTipo} onValueChange={handleUrlTipoChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar ambiente" />
              </SelectTrigger>
              <SelectContent>
                {URLS_PREDEFINIDAS.map(url => (
                  <SelectItem key={url.value} value={url.value}>
                    {url.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {urlTipo === 'custom' && (
              <Input
                placeholder="https://url-servicio-sigica"
                value={config.urlServicio || ''}
                onChange={(e) => 
                  setConfig(prev => ({ ...prev, urlServicio: e.target.value }))
                }
              />
            )}
          </div>

          {/* Establecimiento */}
          <div className="space-y-2">
            <Label htmlFor="establecimiento">N° de Establecimiento</Label>
            <Input
              id="establecimiento"
              placeholder="Número de establecimiento habilitado por SENASA"
              value={config.establecimiento || ''}
              onChange={(e) => 
                setConfig(prev => ({ ...prev, establecimiento: e.target.value }))
              }
            />
          </div>

          {/* Usuario */}
          <div className="space-y-2">
            <Label htmlFor="usuario">Usuario</Label>
            <Input
              id="usuario"
              placeholder="Usuario de SIGICA"
              value={config.usuario || ''}
              onChange={(e) => 
                setConfig(prev => ({ ...prev, usuario: e.target.value }))
              }
            />
          </div>

          {/* Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={config.password || ''}
                onChange={(e) => 
                  setConfig(prev => ({ ...prev, password: e.target.value }))
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Resultado de prueba */}
          {resultadoPrueba && (
            <Alert variant={resultadoPrueba.exito ? 'default' : 'destructive'}>
              {resultadoPrueba.exito ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {resultadoPrueba.exito ? 'Conexión Exitosa' : 'Error de Conexión'}
              </AlertTitle>
              <AlertDescription>{resultadoPrueba.mensaje}</AlertDescription>
            </Alert>
          )}

          {/* Advertencia */}
          {!config.habilitado && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Integración deshabilitada</AlertTitle>
              <AlertDescription>
                La integración con SIGICA está deshabilitada. Configure los parámetros 
                y habilite la integración para comenzar a enviar datos.
              </AlertDescription>
            </Alert>
          )}

          {/* Botones de acción */}
          <div className="flex gap-3">
            <Button
              onClick={() => handleSave(true)}
              disabled={saving}
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar y Probar Conexión
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={saving}
            >
              Solo Guardar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
