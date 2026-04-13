'use client'

import { Save, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { TipoAnimalCounter } from './TipoAnimalCounter'
import { QuickAddButton } from './QuickAddDialog'
import { TIPOS_PESAJE, ESPECIES } from '../constants/pesaje.constants'
import { TipoPesaje, Especie, Cliente, Transportista, Corral, TipoAnimalCantidad } from '../types'

interface PesajeFormProps {
  // Tipo de pesaje
  tipoPesaje: TipoPesaje
  setTipoPesaje: (tipo: TipoPesaje) => void
  onTipoChange?: () => void
  
  // Datos del vehículo
  patenteChasis: string
  setPatenteChasis: (value: string) => void
  patenteAcoplado: string
  setPatenteAcoplado: (value: string) => void
  chofer: string
  setChofer: (value: string) => void
  dniChofer: string
  setDniChofer: (value: string) => void
  transportistaId: string
  setTransportistaId: (value: string) => void
  transportistas: Transportista[]
  
  // Datos para ingreso de hacienda
  nextTropaCode: { codigo: string; numero: number } | null
  dte: string
  setDte: (value: string) => void
  guia: string
  setGuia: (value: string) => void
  productorId: string
  setProductorId: (value: string) => void
  usuarioFaenaId: string
  setUsuarioFaenaId: (value: string) => void
  especie: Especie
  setEspecie: (value: Especie) => void
  corralId: string
  setCorralId: (value: string) => void
  corrales: Corral[]
  productores: Cliente[]
  usuariosFaena: Cliente[]
  tiposAnimales: TipoAnimalCantidad[]
  setTiposAnimales: (value: TipoAnimalCantidad[]) => void
  observaciones: string
  setObservaciones: (value: string) => void
  
  // Datos para salida de mercadería
  destino: string
  setDestino: (value: string) => void
  remito: string
  setRemito: (value: string) => void
  
  // Pesos
  pesoBruto: number
  setPesoBruto: (value: number) => void
  pesoTara: number
  setPesoTara: (value: number) => void
  pesoNeto: number
  
  // Acciones
  onGuardar: () => void
  onQuickAdd: (tipo: string, data: Cliente | Transportista) => void
  saving: boolean
}

export function PesajeForm({
  tipoPesaje,
  setTipoPesaje,
  onTipoChange,
  patenteChasis,
  setPatenteChasis,
  patenteAcoplado,
  setPatenteAcoplado,
  chofer,
  setChofer,
  dniChofer,
  setDniChofer,
  transportistaId,
  setTransportistaId,
  transportistas,
  nextTropaCode,
  dte,
  setDte,
  guia,
  setGuia,
  productorId,
  setProductorId,
  usuarioFaenaId,
  setUsuarioFaenaId,
  especie,
  setEspecie,
  corralId,
  setCorralId,
  corrales,
  productores,
  usuariosFaena,
  tiposAnimales,
  setTiposAnimales,
  observaciones,
  setObservaciones,
  destino,
  setDestino,
  remito,
  setRemito,
  pesoBruto,
  setPesoBruto,
  pesoTara,
  setPesoTara,
  pesoNeto,
  onGuardar,
  onQuickAdd,
  saving
}: PesajeFormProps) {
  return (
    <div className="space-y-6">
      {/* Tipo de pesaje */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Tipo de Pesaje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {TIPOS_PESAJE.map((tipo) => (
              <button
                key={tipo.id}
                type="button"
                onClick={() => { 
                  setTipoPesaje(tipo.id)
                  if (onTipoChange) onTipoChange()
                }}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  tipoPesaje === tipo.id
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <tipo.icon className={`h-6 w-6 mb-2 ${tipo.color}`} />
                <div className="font-medium">{tipo.label}</div>
                <div className="text-xs text-stone-500">{tipo.desc}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* INGRESO DE HACIENDA */}
      {tipoPesaje === 'INGRESO_HACIENDA' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Datos del vehículo */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Datos del Vehículo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Patente Chasis *</Label>
                  <Input
                    value={patenteChasis}
                    onChange={(e) => setPatenteChasis(e.target.value.toUpperCase())}
                    placeholder="AB123CD"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Patente Acoplado</Label>
                  <Input
                    value={patenteAcoplado}
                    onChange={(e) => setPatenteAcoplado(e.target.value.toUpperCase())}
                    placeholder="AB123CD"
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Chofer</Label>
                  <Input value={chofer} onChange={(e) => setChofer(e.target.value)} placeholder="Nombre del chofer" />
                </div>
                <div className="space-y-2">
                  <Label>DNI Chofer</Label>
                  <Input value={dniChofer} onChange={(e) => setDniChofer(e.target.value)} placeholder="12345678" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Transportista</Label>
                  <QuickAddButton tipo="transportista" onAdd={(data) => onQuickAdd('transportista', data)} />
                </div>
                <Select value={transportistaId} onValueChange={setTransportistaId}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {transportistas.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>DTE</Label>
                  <Input value={dte} onChange={(e) => setDte(e.target.value)} placeholder="Documento de tránsito" />
                </div>
                <div className="space-y-2">
                  <Label>Guía</Label>
                  <Input value={guia} onChange={(e) => setGuia(e.target.value)} placeholder="Número de guía" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datos de la tropa */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Datos de la Tropa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {nextTropaCode && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-green-600">Número de Tropa a Asignar</p>
                  <p className="text-3xl font-mono font-bold text-green-700">{nextTropaCode.codigo}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Productor</Label>
                    <QuickAddButton tipo="productor" onAdd={(data) => onQuickAdd('productor', data)} />
                  </div>
                  <Select value={productorId} onValueChange={setProductorId}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {productores.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Usuario Faena *</Label>
                    <QuickAddButton tipo="usuarioFaena" onAdd={(data) => onQuickAdd('usuarioFaena', data)} />
                  </div>
                  <Select value={usuarioFaenaId} onValueChange={setUsuarioFaenaId}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {usuariosFaena.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Especie</Label>
                  <Select value={especie} onValueChange={(v) => setEspecie(v as Especie)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ESPECIES.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Corral *</Label>
                  <Select value={corralId} onValueChange={setCorralId}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {corrales.map((c) => {
                        const stockActual = especie === 'BOVINO' ? c.stockBovinos : c.stockEquinos
                        const disponible = c.capacidad - stockActual
                        return (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nombre} ({disponible} disponibles)
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Notas adicionales..." rows={2} />
              </div>
            </CardContent>
          </Card>

          {/* Tipos de Animales */}
          <Card className="border-0 shadow-md lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Tipos de Animales</CardTitle>
              <CardDescription>Use los botones +/- o ingrese directamente la cantidad de cada tipo</CardDescription>
            </CardHeader>
            <CardContent>
              <TipoAnimalCounter especie={especie} tiposAnimales={tiposAnimales} onUpdate={setTiposAnimales} />
            </CardContent>
          </Card>

          {/* Pesos */}
          <Card className="border-0 shadow-md lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Peso Bruto</CardTitle>
              <CardDescription>El peso tara se registrará cuando el camión regrese vacío</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Peso Bruto (kg) *</Label>
                  <Input
                    type="number"
                    value={pesoBruto || ''}
                    onChange={(e) => setPesoBruto(parseFloat(e.target.value) || 0)}
                    className="text-2xl font-bold text-center h-16"
                    placeholder="0"
                  />
                  <p className="text-xs text-stone-500 text-center">Camión con carga</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-700">Flujo de Pesaje</span>
                  </div>
                  <ol className="text-sm text-blue-600 space-y-1">
                    <li>1. Registre el peso bruto ahora</li>
                    <li>2. El ticket queda ABIERTO</li>
                    <li>3. Registre la tara cuando el camión descargue</li>
                    <li>4. Se imprime el ticket completo</li>
                  </ol>
                </div>
              </div>
              
              <Button
                onClick={onGuardar}
                disabled={saving}
                className="w-full h-14 text-lg bg-amber-500 hover:bg-amber-600 mt-6"
              >
                {saving ? 'Guardando...' : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Registrar Peso Bruto
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PESAJE PARTICULAR */}
      {tipoPesaje === 'PESAJE_PARTICULAR' && (
        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-lg">Pesaje Particular</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Patente Chasis *</Label>
                <Input value={patenteChasis} onChange={(e) => setPatenteChasis(e.target.value.toUpperCase())} placeholder="AB123CD" className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label>Patente Acoplado</Label>
                <Input value={patenteAcoplado} onChange={(e) => setPatenteAcoplado(e.target.value.toUpperCase())} placeholder="AB123CD" className="font-mono" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Descripción del pesaje..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Peso Bruto (kg)</Label>
                <Input type="number" value={pesoBruto || ''} onChange={(e) => setPesoBruto(parseFloat(e.target.value) || 0)} className="text-2xl font-bold text-center h-16" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Peso Tara (kg)</Label>
                <Input type="number" value={pesoTara || ''} onChange={(e) => setPesoTara(parseFloat(e.target.value) || 0)} className="text-2xl font-bold text-center h-16" placeholder="0" />
              </div>
            </div>
            {pesoNeto > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-600 text-sm text-center">Peso Neto</p>
                <p className="text-3xl font-bold text-blue-700 text-center">{pesoNeto.toLocaleString()} kg</p>
              </div>
            )}
            <Button onClick={onGuardar} disabled={saving} className="w-full h-14 text-lg bg-amber-500 hover:bg-amber-600">
              <Save className="h-5 w-5 mr-2" /> Guardar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* SALIDA MERCADERÍA */}
      {tipoPesaje === 'SALIDA_MERCADERIA' && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Salida de Mercadería</CardTitle>
            <CardDescription>Tara → Carga → Peso Bruto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Patente Chasis *</Label>
                <Input value={patenteChasis} onChange={(e) => setPatenteChasis(e.target.value.toUpperCase())} placeholder="AB123CD" className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label>Patente Acoplado</Label>
                <Input value={patenteAcoplado} onChange={(e) => setPatenteAcoplado(e.target.value.toUpperCase())} placeholder="AB123CD" className="font-mono" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Chofer</Label>
                <Input value={chofer} onChange={(e) => setChofer(e.target.value)} placeholder="Nombre del chofer" />
              </div>
              <div className="space-y-2">
                <Label>Transportista</Label>
                <Select value={transportistaId} onValueChange={setTransportistaId}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {transportistas.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Destino *</Label>
                <Input value={destino} onChange={(e) => setDestino(e.target.value)} placeholder="Destino de la mercadería" />
              </div>
              <div className="space-y-2">
                <Label>Remito</Label>
                <Input value={remito} onChange={(e) => setRemito(e.target.value)} placeholder="N° de remito" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observaciones / Tipo de Mercadería</Label>
              <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Descripción del tipo de mercadería..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Peso Tara (kg) - Vacío</Label>
                <Input type="number" value={pesoTara || ''} onChange={(e) => setPesoTara(parseFloat(e.target.value) || 0)} className="text-2xl font-bold text-center h-16" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Peso Bruto (kg) - Cargado *</Label>
                <Input type="number" value={pesoBruto || ''} onChange={(e) => setPesoBruto(parseFloat(e.target.value) || 0)} className="text-2xl font-bold text-center h-16" placeholder="0" />
              </div>
            </div>
            {pesoNeto > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-600 text-sm text-center">Peso Neto de Mercadería</p>
                <p className="text-3xl font-bold text-green-700 text-center">{pesoNeto.toLocaleString()} kg</p>
              </div>
            )}
            <Button onClick={onGuardar} disabled={saving} className="w-full h-14 text-lg bg-amber-500 hover:bg-amber-600">
              <Save className="h-5 w-5 mr-2" /> Registrar Salida
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
