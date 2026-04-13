'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  ArrowRight,
} from 'lucide-react'
import { Tropa, EstadoTropa, Especie } from '../types'

interface TropasListProps {
  tropas: Tropa[]
  loading?: boolean
  page?: number
  totalPages?: number
  total?: number
  onPageChange?: (page: number) => void
  onView?: (tropa: Tropa) => void
  onEdit?: (tropa: Tropa) => void
  onDelete?: (tropa: Tropa) => void
  onEstadoChange?: (tropa: Tropa, nuevoEstado: EstadoTropa) => void
  onSearch?: (search: string) => void
  onFilterEspecie?: (especie: Especie | 'TODAS') => void
  onFilterEstado?: (estado: EstadoTropa | 'TODAS') => void
  onRefresh?: () => void
}

const ESTADOS_CONFIG: Record<EstadoTropa, { label: string; color: string }> = {
  RECIBIDO: { label: 'Recibido', color: 'bg-blue-500' },
  EN_CORRAL: { label: 'En Corral', color: 'bg-cyan-500' },
  EN_PESAJE: { label: 'En Pesaje', color: 'bg-yellow-500' },
  PESADO: { label: 'Pesado', color: 'bg-orange-500' },
  LISTO_FAENA: { label: 'Listo Faena', color: 'bg-purple-500' },
  EN_FAENA: { label: 'En Faena', color: 'bg-red-500' },
  FAENADO: { label: 'Faenado', color: 'bg-green-500' },
  DESPACHADO: { label: 'Despachado', color: 'bg-gray-500' },
}

const ESTADOS_SIGUIENTES: Record<EstadoTropa, EstadoTropa[]> = {
  RECIBIDO: ['EN_CORRAL', 'EN_PESAJE'],
  EN_CORRAL: ['EN_PESAJE'],
  EN_PESAJE: ['PESADO'],
  PESADO: ['LISTO_FAENA'],
  LISTO_FAENA: ['EN_FAENA'],
  EN_FAENA: ['FAENADO'],
  FAENADO: ['DESPACHADO'],
  DESPACHADO: [],
}

export function TropasList({
  tropas,
  loading = false,
  page = 1,
  totalPages = 1,
  total = 0,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  onEstadoChange,
  onSearch,
  onFilterEspecie,
  onFilterEstado,
  onRefresh,
}: TropasListProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    onSearch?.(value)
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold">
            Tropas ({total})
          </CardTitle>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, DTE, guía..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 w-full sm:w-64"
              />
            </div>

            {/* Filtro Especie */}
            {onFilterEspecie && (
              <Select onValueChange={(v) => onFilterEspecie(v as Especie | 'TODAS')}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Especie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas</SelectItem>
                  <SelectItem value="BOVINO">Bovino</SelectItem>
                  <SelectItem value="EQUINO">Equino</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Filtro Estado */}
            {onFilterEstado && (
              <Select onValueChange={(v) => onFilterEstado(v as EstadoTropa | 'TODAS')}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todos</SelectItem>
                  {Object.entries(ESTADOS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Botón refrescar */}
            {onRefresh && (
              <Button
                variant="outline"
                size="icon"
                onClick={onRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : tropas.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No se encontraron tropas
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Especie</TableHead>
                    <TableHead>Usuario Faena</TableHead>
                    <TableHead className="text-center">Cabezas</TableHead>
                    <TableHead>DTE</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tropas.map((tropa) => (
                    <TableRow key={tropa.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono font-medium">
                        {tropa.codigo}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tropa.especie === 'BOVINO' ? 'default' : 'secondary'}>
                          {tropa.especie === 'BOVINO' ? 'Bovino' : 'Equino'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tropa.usuarioFaena?.nombre || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {tropa.cantidadCabezas}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {tropa.dte}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(tropa.fechaRecepcion)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${ESTADOS_CONFIG[tropa.estado].color} text-white`}
                        >
                          {ESTADOS_CONFIG[tropa.estado].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onView && (
                              <DropdownMenuItem onClick={() => onView(tropa)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalles
                              </DropdownMenuItem>
                            )}
                            {onEdit && (
                              <DropdownMenuItem onClick={() => onEdit(tropa)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            {onEstadoChange && ESTADOS_SIGUIENTES[tropa.estado].length > 0 && (
                              <>
                                <DropdownMenuItem className="font-semibold text-primary">
                                  <ArrowRight className="mr-2 h-4 w-4" />
                                  Cambiar estado a:
                                </DropdownMenuItem>
                                {ESTADOS_SIGUIENTES[tropa.estado].map((estado) => (
                                  <DropdownMenuItem
                                    key={estado}
                                    onClick={() => onEstadoChange(tropa, estado)}
                                  >
                                    <Badge
                                      className={`${ESTADOS_CONFIG[estado].color} text-white mr-2`}
                                    >
                                      {ESTADOS_CONFIG[estado].label}
                                    </Badge>
                                  </DropdownMenuItem>
                                ))}
                              </>
                            )}
                            {onDelete && tropa.estado === 'RECIBIDO' && (
                              <DropdownMenuItem
                                onClick={() => onDelete(tropa)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && onPageChange && (
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => onPageChange(Math.max(1, page - 1))}
                        className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (page <= 3) {
                        pageNum = i + 1
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = page - 2 + i
                      }
                      
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => onPageChange(pageNum)}
                            isActive={page === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    })}
                    
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                        className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
