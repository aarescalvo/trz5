'use client'

import { Clock, CheckCircle, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePesaje } from '../hooks/usePesaje'
import { PesajeForm } from './PesajeForm'
import { PesajeTable } from './PesajeTable'
import { QuickAddDialog } from './QuickAddDialog'
import { Operador, PesajeCamion } from '../types'

interface PesajeModuleProps {
  operador: Operador
  onTropaCreada?: () => void
}

export function PesajeModule({ operador, onTropaCreada }: PesajeModuleProps) {
  const {
    // Data
    transportistas, corrales, pesajesAbiertos, pesajesFiltrados,
    nextTicket, nextTropaCode, productores, usuariosFaena,
    
    // UI State
    saving, activeTab, setActiveTab, tipoPesaje, setTipoPesaje,
    
    // Form State
    patenteChasis, setPatenteChasis,
    patenteAcoplado, setPatenteAcoplado,
    chofer, setChofer,
    dniChofer, setDniChofer,
    transportistaId, setTransportistaId,
    dte, setDte,
    guia, setGuia,
    productorId, setProductorId,
    usuarioFaenaId, setUsuarioFaenaId,
    especie, setEspecie,
    corralId, setCorralId,
    pesoBruto, setPesoBruto,
    pesoTara, setPesoTara,
    pesoNeto,
    observaciones, setObservaciones,
    destino, setDestino,
    remito, setRemito,
    tiposAnimales, setTiposAnimales,
    totalCabezas,
    
    // History filters
    fechaDesde, setFechaDesde,
    fechaHasta, setFechaHasta,
    
    // Dialogs
    cerrarOpen, setCerrarOpen,
    pesajeSeleccionado, setPesajeSeleccionado,
    taraForm, setTaraForm,
    deleteDialogOpen, setDeleteDialogOpen,
    supervisorPin, setSupervisorPin,
    pesajeAccion, setPesajeAccion,
    quickAddOpen, setQuickAddOpen,
    
    // Actions
    handleQuickAdd, handleGuardar, handleCerrarPesaje, handleDeletePesaje,
    handleImprimirReporte, imprimirTicketPesaje
  } = usePesaje({ operadorId: operador.id, onTropaCreada })

  const handleTipoChange = () => {
    setTiposAnimales([])
  }

  const handleRegistrarTara = (pesaje: PesajeCamion) => {
    setPesajeSeleccionado(pesaje)
    setTaraForm(0)
    setCerrarOpen(true)
  }

  const handleImprimir = (pesaje: PesajeCamion) => {
    imprimirTicketPesaje(pesaje, false)
  }

  const handleEliminar = (pesaje: PesajeCamion) => {
    setPesajeAccion(pesaje)
    setDeleteDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-stone-800">Pesaje de Camiones</h2>
            <p className="text-stone-500">Balanza Portería</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Clock className="h-4 w-4 mr-2 text-orange-500" />
              {pesajesAbiertos.length} abiertos
            </Badge>
            <Badge className="text-lg px-4 py-2 bg-amber-100 text-amber-700 border-amber-300">
              Ticket #{String(nextTicket).padStart(6, '0')}
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="nuevo">Nuevo Pesaje</TabsTrigger>
            <TabsTrigger value="abiertos">Pesajes Abiertos ({pesajesAbiertos.length})</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>

          {/* NUEVO PESAJE */}
          <TabsContent value="nuevo" className="space-y-6">
            <PesajeForm
              tipoPesaje={tipoPesaje}
              setTipoPesaje={setTipoPesaje}
              onTipoChange={handleTipoChange}
              patenteChasis={patenteChasis}
              setPatenteChasis={setPatenteChasis}
              patenteAcoplado={patenteAcoplado}
              setPatenteAcoplado={setPatenteAcoplado}
              chofer={chofer}
              setChofer={setChofer}
              dniChofer={dniChofer}
              setDniChofer={setDniChofer}
              transportistaId={transportistaId}
              setTransportistaId={setTransportistaId}
              transportistas={transportistas}
              nextTropaCode={nextTropaCode}
              dte={dte}
              setDte={setDte}
              guia={guia}
              setGuia={setGuia}
              productorId={productorId}
              setProductorId={setProductorId}
              usuarioFaenaId={usuarioFaenaId}
              setUsuarioFaenaId={setUsuarioFaenaId}
              especie={especie}
              setEspecie={setEspecie}
              corralId={corralId}
              setCorralId={setCorralId}
              corrales={corrales}
              productores={productores}
              usuariosFaena={usuariosFaena}
              tiposAnimales={tiposAnimales}
              setTiposAnimales={setTiposAnimales}
              observaciones={observaciones}
              setObservaciones={setObservaciones}
              destino={destino}
              setDestino={setDestino}
              remito={remito}
              setRemito={setRemito}
              pesoBruto={pesoBruto}
              setPesoBruto={setPesoBruto}
              pesoTara={pesoTara}
              setPesoTara={setPesoTara}
              pesoNeto={pesoNeto}
              onGuardar={handleGuardar}
              onQuickAdd={handleQuickAdd}
              saving={saving}
            />
          </TabsContent>

          {/* PESAJES ABIERTOS */}
          <TabsContent value="abiertos">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-orange-50 rounded-t-lg">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  Pesajes Abiertos - Pendientes de Tara
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <PesajeTable
                  pesajes={pesajesAbiertos}
                  tipo="abiertos"
                  onRegistrarTara={handleRegistrarTara}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* HISTORIAL */}
          <TabsContent value="historial">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-green-50 rounded-t-lg">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Historial de Pesajes Cerrados
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {/* Filtros */}
                <div className="flex flex-wrap items-end gap-4 mb-4 pb-4 border-b">
                  <div className="space-y-2">
                    <Label className="text-sm">Desde</Label>
                    <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="w-40" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Hasta</Label>
                    <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="w-40" />
                  </div>
                  <Button variant="outline" onClick={() => { setFechaDesde(''); setFechaHasta(''); }}>Limpiar</Button>
                  <Button onClick={handleImprimirReporte} className="bg-amber-500 hover:bg-amber-600" disabled={pesajesFiltrados.length === 0}>
                    <FileText className="h-4 w-4 mr-2" /> Imprimir Reporte
                  </Button>
                </div>
                
                {/* Resumen */}
                {pesajesFiltrados.length > 0 && (
                  <div className="grid grid-cols-4 gap-4 mb-4 p-3 bg-stone-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-xs text-stone-500">Total Pesajes</p>
                      <p className="text-lg font-bold">{pesajesFiltrados.length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-stone-500">Total Bruto</p>
                      <p className="text-lg font-bold">{pesajesFiltrados.reduce((acc, p) => acc + (p.pesoBruto || 0), 0).toLocaleString()} kg</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-stone-500">Total Tara</p>
                      <p className="text-lg font-bold">{pesajesFiltrados.reduce((acc, p) => acc + (p.pesoTara || 0), 0).toLocaleString()} kg</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-stone-500">Total Neto</p>
                      <p className="text-lg font-bold text-green-600">{pesajesFiltrados.reduce((acc, p) => acc + (p.pesoNeto || 0), 0).toLocaleString()} kg</p>
                    </div>
                  </div>
                )}
                
                {pesajesFiltrados.length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay pesajes en el rango seleccionado</p>
                  </div>
                ) : (
                  <PesajeTable
                    pesajes={pesajesFiltrados}
                    tipo="historial"
                    onImprimir={handleImprimir}
                    onEliminar={handleEliminar}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog Registrar Tara */}
      <Dialog open={cerrarOpen} onOpenChange={setCerrarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Peso Tara</DialogTitle>
            <DialogDescription>Ingrese el peso del camión vacío para cerrar el pesaje</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {pesajeSeleccionado && (
              <div className="bg-stone-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-600">Ticket:</span>
                  <span className="font-bold">#{String(pesajeSeleccionado.numeroTicket).padStart(6, '0')}</span>
                </div>
                {pesajeSeleccionado.tropa && (
                  <div className="flex justify-between">
                    <span className="text-stone-600">Tropa:</span>
                    <span className="font-bold text-green-600">{pesajeSeleccionado.tropa.codigo}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-stone-600">Peso Bruto:</span>
                  <span className="font-bold">{pesajeSeleccionado.pesoBruto?.toLocaleString()} kg</span>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Peso Tara (kg) *</Label>
              <Input
                type="number"
                value={taraForm || ''}
                onChange={(e) => setTaraForm(parseFloat(e.target.value) || 0)}
                className="text-2xl font-bold text-center h-16"
                placeholder="0"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCerrarOpen(false)}>Cancelar</Button>
            <Button onClick={handleCerrarPesaje} disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving ? 'Guardando...' : 'Cerrar Pesaje'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Pesaje</DialogTitle>
            <DialogDescription>Esta acción no se puede deshacer. Se requiere PIN de supervisor.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>PIN de Supervisor</Label>
              <Input
                type="password"
                value={supervisorPin}
                onChange={(e) => setSupervisorPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                className="text-center text-2xl tracking-widest h-14"
                maxLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setSupervisorPin(''); }}>Cancelar</Button>
            <Button onClick={handleDeletePesaje} variant="destructive">Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Dialog */}
      {quickAddOpen && (
        <QuickAddDialog
          tipo={quickAddOpen}
          onAdd={(data) => handleQuickAdd(quickAddOpen, data)}
          open={!!quickAddOpen}
          onOpenChange={(open) => setQuickAddOpen(open ? quickAddOpen : null)}
        />
      )}
    </div>
  )
}

export default PesajeModule
