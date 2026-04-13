'use client'

import { Scale, Printer, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PesajeCamion } from '../types'
import { TIPOS_PESAJE } from '../constants/pesaje.constants'

interface PesajeTableProps {
  pesajes: PesajeCamion[]
  tipo: 'abiertos' | 'historial'
  onRegistrarTara?: (pesaje: PesajeCamion) => void
  onImprimir?: (pesaje: PesajeCamion) => void
  onEliminar?: (pesaje: PesajeCamion) => void
}

export function PesajeTable({ 
  pesajes, 
  tipo,
  onRegistrarTara,
  onImprimir,
  onEliminar
}: PesajeTableProps) {
  if (pesajes.length === 0) {
    return (
      <div className="p-8 text-center text-stone-400">
        {tipo === 'abiertos' ? (
          <>
            <Scale className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay pesajes abiertos</p>
          </>
        ) : (
          <>
            <Printer className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay pesajes en el rango seleccionado</p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className={tipo === 'historial' ? 'max-h-96 overflow-y-auto' : ''}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticket</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Patente</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Tropa</TableHead>
            {tipo === 'historial' && (
              <>
                <TableHead>Bruto</TableHead>
                <TableHead>Tara</TableHead>
                <TableHead>Neto</TableHead>
              </>
            )}
            {tipo === 'abiertos' && <TableHead>Peso Bruto</TableHead>}
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pesajes.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-mono font-bold">
                #{String(p.numeroTicket).padStart(6, '0')}
              </TableCell>
              <TableCell>{new Date(p.fecha).toLocaleDateString('es-AR')}</TableCell>
              <TableCell className="font-mono">{p.patenteChasis}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {TIPOS_PESAJE.find(t => t.id === p.tipo)?.label || p.tipo}
                </Badge>
              </TableCell>
              <TableCell>
                {p.tropa && (
                  <Badge className="bg-green-100 text-green-700">
                    {p.tropa.codigo}
                  </Badge>
                )}
              </TableCell>
              {tipo === 'historial' && (
                <>
                  <TableCell>{p.pesoBruto?.toLocaleString()} kg</TableCell>
                  <TableCell>{p.pesoTara?.toLocaleString()} kg</TableCell>
                  <TableCell className="font-bold text-green-600">
                    {p.pesoNeto?.toLocaleString()} kg
                  </TableCell>
                </>
              )}
              {tipo === 'abiertos' && (
                <TableCell className="font-bold">{p.pesoBruto?.toLocaleString()} kg</TableCell>
              )}
              <TableCell>
                {tipo === 'abiertos' && onRegistrarTara && (
                  <Button
                    onClick={() => onRegistrarTara(p)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Scale className="h-4 w-4 mr-1" /> Registrar Tara
                  </Button>
                )}
                {tipo === 'historial' && (
                  <div className="flex items-center gap-1">
                    {onImprimir && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onImprimir(p)} 
                        title="Reimprimir"
                      >
                        <Printer className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    {onEliminar && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onEliminar(p)} 
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
