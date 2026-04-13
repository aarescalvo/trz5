'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Upload, FileSpreadsheet, Building2, CheckCircle, AlertCircle,
  Loader2, Download, FileText, ArrowRight
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface CuentaBancaria {
  id: string
  banco: string
  tipoCuenta: string
  numeroCuenta: string
  saldoActual: number
  saldoConciliado: number
}

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface PreviewMovement {
  fecha: Date
  descripcion: string
  monto: number
  tipo: 'DEBITO' | 'CREDITO'
}

const BANCOS_SOPORTADOS = [
  { id: 'CMF', nombre: 'CMF', formato: 'Fecha;Descripción;Débito;Crédito;Saldo' },
  { id: 'MACRO', nombre: 'Macro', formato: 'Fecha Movimiento;Fecha Valor;Descripción;Referencia;Importe;Saldo' },
  { id: 'PATAGONIA', nombre: 'Patagonia', formato: 'Fecha;Tipo;Comprobante;Descripción;Débito;Crédito;Saldo' }
]

export function ImportarExtracto({ operador }: { operador: Operador }) {
  const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancaria[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  
  // Form state
  const [bancoSeleccionado, setBancoSeleccionado] = useState<string>('')
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<string>('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<PreviewMovement[]>([])
  const [importResult, setImportResult] = useState<any>(null)
  
  useEffect(() => {
    fetchCuentas()
  }, [])
  
  const fetchCuentas = async () => {
    try {
      const res = await fetch('/api/cuentas-bancarias')
      const data = await res.json()
      setCuentasBancarias(data.data || data || [])
    } catch (error) {
      console.error('Error fetching cuentas:', error)
      toast.error('Error al cargar cuentas bancarias')
    } finally {
      setLoading(false)
    }
  }
  
  const parseCSVPreview = (content: string, banco: string): PreviewMovement[] => {
    const lines = content.split('\n').filter(line => line.trim())
    const startIndex = lines[0].toLowerCase().includes('fecha') ? 1 : 0
    const movements: PreviewMovement[] = []
    
    for (let i = startIndex; i < Math.min(lines.length, startIndex + 20); i++) {
      const parts = lines[i].split(';').map(p => p.trim())
      if (parts.length < 4) continue
      
      let fecha: Date
      let descripcion: string
      let monto: number
      let tipo: 'DEBITO' | 'CREDITO'
      
      switch (banco) {
        case 'CMF': {
          const fechaParts = parts[0].split('/')
          if (fechaParts.length !== 3) continue
          fecha = new Date(parseInt(fechaParts[2]), parseInt(fechaParts[1]) - 1, parseInt(fechaParts[0]))
          descripcion = parts[1]
          const debito = parseFloat(parts[2]?.replace(',', '.') || '0') || 0
          const credito = parseFloat(parts[3]?.replace(',', '.') || '0') || 0
          monto = credito > 0 ? credito : debito
          tipo = credito > 0 ? 'CREDITO' : 'DEBITO'
          break
        }
        case 'MACRO': {
          const fechaParts = parts[0].split('/')
          if (fechaParts.length !== 3) continue
          fecha = new Date(parseInt(fechaParts[2]), parseInt(fechaParts[1]) - 1, parseInt(fechaParts[0]))
          descripcion = parts[2]
          const importe = parseFloat(parts[4]?.replace(',', '.') || '0') || 0
          monto = Math.abs(importe)
          tipo = importe < 0 ? 'DEBITO' : 'CREDITO'
          break
        }
        case 'PATAGONIA': {
          const fechaParts = parts[0].split('/')
          if (fechaParts.length !== 3) continue
          fecha = new Date(parseInt(fechaParts[2]), parseInt(fechaParts[1]) - 1, parseInt(fechaParts[0]))
          descripcion = `${parts[3]} (Comp: ${parts[2]})`
          const debito = parseFloat(parts[4]?.replace(',', '.') || '0') || 0
          const credito = parseFloat(parts[5]?.replace(',', '.') || '0') || 0
          monto = credito > 0 ? credito : debito
          tipo = credito > 0 ? 'CREDITO' : 'DEBITO'
          break
        }
        default:
          continue
      }
      
      if (monto > 0) {
        movements.push({ fecha, descripcion, monto, tipo })
      }
    }
    
    return movements
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setArchivo(file)
      setImportResult(null)
      
      // Preview del archivo
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        if (bancoSeleccionado) {
          const preview = parseCSVPreview(content, bancoSeleccionado)
          setPreviewData(preview)
        }
      }
      reader.readAsText(file)
    }
  }
  
  const handleBancoChange = (banco: string) => {
    setBancoSeleccionado(banco)
    if (archivo) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        const preview = parseCSVPreview(content, banco)
        setPreviewData(preview)
      }
      reader.readAsText(archivo)
    }
  }
  
  const handleImportar = async () => {
    if (!archivo || !bancoSeleccionado || !cuentaSeleccionada) {
      toast.error('Complete todos los campos requeridos')
      return
    }
    
    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', archivo)
      formData.append('banco', bancoSeleccionado)
      formData.append('cuentaBancariaId', cuentaSeleccionada)
      formData.append('creadoPor', operador.nombre)
      
      const res = await fetch('/api/conciliacion/importar', {
        method: 'POST',
        body: formData
      })
      
      const data = await res.json()
      
      if (data.success) {
        setImportResult(data)
        toast.success('Extracto importado correctamente')
        // Reset form
        setArchivo(null)
        setPreviewData([])
      } else {
        toast.error(data.error || 'Error al importar extracto')
      }
    } catch (error) {
      console.error('Error importing:', error)
      toast.error('Error al importar extracto')
    } finally {
      setUploading(false)
    }
  }
  
  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-stone-500">Cargando...</p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Formulario de importación */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importar Extracto Bancario
          </CardTitle>
          <CardDescription>
            Seleccione el banco, la cuenta y cargue el archivo CSV del extracto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Banco */}
            <div className="space-y-2">
              <Label>Banco</Label>
              <Select value={bancoSeleccionado} onValueChange={handleBancoChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione banco" />
                </SelectTrigger>
                <SelectContent>
                  {BANCOS_SOPORTADOS.map((banco) => (
                    <SelectItem key={banco.id} value={banco.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {banco.nombre}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {bancoSeleccionado && (
                <p className="text-xs text-stone-500">
                  Formato: {BANCOS_SOPORTADOS.find(b => b.id === bancoSeleccionado)?.formato}
                </p>
              )}
            </div>
            
            {/* Cuenta bancaria */}
            <div className="space-y-2">
              <Label>Cuenta Bancaria</Label>
              <Select value={cuentaSeleccionada} onValueChange={setCuentaSeleccionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {cuentasBancarias.map((cuenta) => (
                    <SelectItem key={cuenta.id} value={cuenta.id}>
                      {cuenta.banco} - {cuenta.tipoCuenta} ({cuenta.numeroCuenta})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {cuentaSeleccionada && (
                <p className="text-xs text-stone-500">
                  Saldo: ${cuentasBancarias.find(c => c.id === cuentaSeleccionada)?.saldoActual.toLocaleString('es-AR')}
                </p>
              )}
            </div>
            
            {/* Archivo */}
            <div className="space-y-2">
              <Label>Archivo CSV</Label>
              <Input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {archivo && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <FileSpreadsheet className="w-3 h-3" />
                  {archivo.name}
                </p>
              )}
            </div>
          </div>
          
          {/* Botón importar */}
          <Button
            onClick={handleImportar}
            disabled={!archivo || !bancoSeleccionado || !cuentaSeleccionada || uploading}
            className="w-full md:w-auto"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Importar Extracto
          </Button>
        </CardContent>
      </Card>
      
      {/* Preview de datos */}
      {previewData.length > 0 && !importResult && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Vista Previa (primeros 20 registros)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Tipo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((mov, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        {new Date(mov.fecha).toLocaleDateString('es-AR')}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {mov.descripcion}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        mov.tipo === 'CREDITO' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {mov.tipo === 'CREDITO' ? '+' : '-'}
                        ${mov.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={mov.tipo === 'CREDITO' ? 'default' : 'secondary'}>
                          {mov.tipo}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
      
      {/* Resultado de importación */}
      {importResult && (
        <Card className="border-0 shadow-md border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Importación Exitosa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-stone-50 rounded-lg">
                <p className="text-2xl font-bold text-stone-800">
                  {importResult.resumen.totalRegistros}
                </p>
                <p className="text-xs text-stone-500">Registros</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">
                  ${importResult.resumen.totalDebitos.toLocaleString('es-AR')}
                </p>
                <p className="text-xs text-stone-500">Total Débitos</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  ${importResult.resumen.totalCreditos.toLocaleString('es-AR')}
                </p>
                <p className="text-xs text-stone-500">Total Créditos</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-lg font-bold text-blue-600">
                  {new Date(importResult.resumen.fechaDesde).toLocaleDateString('es-AR')}
                </p>
                <p className="text-xs text-stone-500">Desde</p>
                <p className="text-lg font-bold text-blue-600 mt-1">
                  {new Date(importResult.resumen.fechaHasta).toLocaleDateString('es-AR')}
                </p>
                <p className="text-xs text-stone-500">Hasta</p>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-800">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                El extracto ha sido importado. Ahora puede procesar la conciliación automática.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Formato de ejemplo por banco */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Formatos de Archivo Soportados</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="CMF">
            <TabsList>
              {BANCOS_SOPORTADOS.map((banco) => (
                <TabsTrigger key={banco.id} value={banco.id}>
                  {banco.nombre}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="CMF" className="mt-4">
              <div className="bg-stone-50 p-4 rounded-lg font-mono text-sm">
                <p className="text-stone-500 mb-2">Fecha;Descripción;Débito;Crédito;Saldo</p>
                <p>01/03/2026;TRANSFERENCIA;;15000.00;125000.00</p>
                <p>02/03/2026;PAGO PROVEEDOR;5000.00;;120000.00</p>
              </div>
            </TabsContent>
            
            <TabsContent value="MACRO" className="mt-4">
              <div className="bg-stone-50 p-4 rounded-lg font-mono text-sm">
                <p className="text-stone-500 mb-2">Fecha Movimiento;Fecha Valor;Descripción;Referencia;Importe;Saldo</p>
                <p>01/03/2026;01/03/2026;PAGO PROVEEDOR;123456;-5000.00;100000.00</p>
                <p>02/03/2026;02/03/2026;TRANSFERENCIA;789012;15000.00;115000.00</p>
              </div>
            </TabsContent>
            
            <TabsContent value="PATAGONIA" className="mt-4">
              <div className="bg-stone-50 p-4 rounded-lg font-mono text-sm">
                <p className="text-stone-500 mb-2">Fecha;Tipo;Comprobante;Descripción;Débito;Crédito;Saldo</p>
                <p>01/03/2026;DEB;00012345;PAGO VARIOS;-2500.00;;50000.00</p>
                <p>02/03/2026;CRE;00012346;DEPOSITO;;10000.00;60000.00</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default ImportarExtracto
