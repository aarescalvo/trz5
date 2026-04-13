'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Send, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Calendar
} from 'lucide-react'

interface Romaneo {
  id: string
  garron: number
  tropaCodigo: string | null
  fecha: Date
  pesoTotal: number | null
  pesoMediaIzq: number | null
  pesoMediaDer: number | null
  estado: string
}

interface EnviarRomaneosDialogProps {
  onSuccess?: () => void
}

export function EnviarRomaneosDialog({ onSuccess }: EnviarRomaneosDialogProps) {
  const [open, setOpen] = useState(false)
  const [romaneos, setRomaneos] = useState<Romaneo[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [resultado, setResultado] = useState<{ exito: boolean; mensaje: string } | null>(null)

  useEffect(() => {
    if (open) {
      loadRomaneos()
    }
  }, [open])

  const loadRomaneos = async () => {
    setLoading(true)
    setSelected([])
    setResultado(null)
    
    try {
      // Obtener romaneos confirmados que no hayan sido enviados a SIGICA
      const response = await fetch('/api/romaneo?estado=CONFIRMADO&limit=100')
      const data = await response.json()
      
      if (data.romaneos) {
        setRomaneos(data.romaneos)
      }
    } catch (error) {
      console.error('Error cargando romaneos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(romaneos.map(r => r.id))
    } else {
      setSelected([])
    }
  }

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelected(prev => [...prev, id])
    } else {
      setSelected(prev => prev.filter(s => s !== id))
    }
  }

  const handleEnviar = async () => {
    if (selected.length === 0) return

    setSending(true)
    setResultado(null)

    try {
      const response = await fetch('/api/sigica/enviar-romaneos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ romaneoIds: selected })
      })

      const data = await response.json()

      if (data.success) {
        setResultado({
          exito: true,
          mensaje: `Se enviaron ${data.data.cantidadEnviada} romaneos exitosamente. Código: ${data.data.codigoTransaccion}`
        })
        
        // Llamar callback de éxito
        if (onSuccess) {
          onSuccess()
        }
        
        // Cerrar después de 2 segundos
        setTimeout(() => {
          setOpen(false)
        }, 2000)
      } else {
        setResultado({
          exito: false,
          mensaje: data.error || data.data?.mensajeError || 'Error al enviar romaneos'
        })
      }
    } catch (error) {
      console.error('Error enviando romaneos:', error)
      setResultado({
        exito: false,
        mensaje: 'Error de conexión al servidor'
      })
    } finally {
      setSending(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Send className="h-4 w-4 mr-2" />
          Enviar Romaneos a SIGICA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Enviar Romaneos a SIGICA</DialogTitle>
          <DialogDescription>
            Seleccione los romaneos confirmados que desea enviar al sistema SIGICA del SENASA
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumen de selección */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selected.length} de {romaneos.length} seleccionados
              </span>
              {selected.length > 0 && (
                <Badge variant="secondary">
                  {selected.length} a enviar
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadRomaneos}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>

          {/* Tabla de romaneos */}
          <ScrollArea className="h-[400px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selected.length === romaneos.length && romaneos.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Garrón</TableHead>
                  <TableHead>Tropa</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Peso Total</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : romaneos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <AlertTriangle className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No hay romaneos confirmados pendientes de envío
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  romaneos.map((romaneo) => (
                    <TableRow key={romaneo.id} className={selected.includes(romaneo.id) ? 'bg-muted/50' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={selected.includes(romaneo.id)}
                          onCheckedChange={(checked) => handleSelect(romaneo.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{romaneo.garron}</TableCell>
                      <TableCell>{romaneo.tropaCodigo || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDate(romaneo.fecha)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {romaneo.pesoTotal ? `${romaneo.pesoTotal.toFixed(1)} kg` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-600">
                          Confirmado
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* Resultado del envío */}
          {resultado && (
            <Alert variant={resultado.exito ? 'default' : 'destructive'}>
              {resultado.exito ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {resultado.exito ? 'Envío Exitoso' : 'Error en el Envío'}
              </AlertTitle>
              <AlertDescription>{resultado.mensaje}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleEnviar}
            disabled={selected.length === 0 || sending}
          >
            {sending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar {selected.length} Romaneos
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
