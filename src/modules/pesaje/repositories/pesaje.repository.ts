import { BaseRepository } from '@/core/repository/base.repository'
import { db } from '@/lib/db'
import { PesajeCamion, TipoPesaje, EstadoPesaje } from '../types'
import { Prisma } from '@prisma/client'

export class PesajeRepository extends BaseRepository<PesajeCamion> {
  protected model = db.pesajeCamion

  /**
   * Busca todos los pesajes abiertos
   */
  async findAbiertos(): Promise<PesajeCamion[]> {
    return this.model.findMany({
      where: { estado: 'ABIERTO' as EstadoPesaje },
      include: {
        transportista: true,
        tropa: {
          include: {
            productor: true,
            usuarioFaena: true,
            tiposAnimales: true,
            corral: true
          }
        },
        operador: true
      },
      orderBy: { fecha: 'desc' }
    }) as Promise<PesajeCamion[]>
  }

  /**
   * Busca todos los pesajes cerrados
   */
  async findCerrados(): Promise<PesajeCamion[]> {
    return this.model.findMany({
      where: { estado: 'CERRADO' as EstadoPesaje },
      include: {
        transportista: true,
        tropa: {
          include: {
            productor: true,
            usuarioFaena: true,
            tiposAnimales: true,
            corral: true
          }
        },
        operador: true
      },
      orderBy: { fecha: 'desc' }
    }) as Promise<PesajeCamion[]>
  }

  /**
   * Busca un pesaje por número de ticket
   */
  async findByTicket(numeroTicket: number): Promise<PesajeCamion | null> {
    return this.model.findUnique({
      where: { numeroTicket },
      include: {
        transportista: true,
        tropa: {
          include: {
            productor: true,
            usuarioFaena: true,
            tiposAnimales: true,
            corral: true
          }
        },
        operador: true
      }
    }) as Promise<PesajeCamion | null>
  }

  /**
   * Obtiene el siguiente número de ticket
   */
  async getNextTicket(): Promise<number> {
    const ultimo = await this.model.findFirst({
      orderBy: { numeroTicket: 'desc' },
      select: { numeroTicket: true }
    })
    return (ultimo?.numeroTicket || 0) + 1
  }

  /**
   * Busca todos los pesajes con relaciones
   */
  async findAllWithRelations(): Promise<PesajeCamion[]> {
    return this.model.findMany({
      include: {
        transportista: true,
        tropa: {
          include: {
            productor: true,
            usuarioFaena: true,
            tiposAnimales: true,
            corral: true
          }
        },
        operador: true
      },
      orderBy: { fecha: 'desc' }
    }) as Promise<PesajeCamion[]>
  }

  /**
   * Busca pesajes por rango de fechas
   */
  async findByFechaRange(fechaDesde: Date, fechaHasta: Date): Promise<PesajeCamion[]> {
    return this.model.findMany({
      where: {
        fecha: {
          gte: fechaDesde,
          lte: fechaHasta
        }
      },
      include: {
        transportista: true,
        tropa: {
          include: {
            productor: true,
            usuarioFaena: true,
            tiposAnimales: true,
            corral: true
          }
        },
        operador: true
      },
      orderBy: { fecha: 'desc' }
    }) as Promise<PesajeCamion[]>
  }

  /**
   * Busca pesajes por tipo
   */
  async findByTipo(tipo: TipoPesaje): Promise<PesajeCamion[]> {
    return this.model.findMany({
      where: { tipo: tipo as Prisma.TipoPesajeCamion },
      include: {
        transportista: true,
        tropa: {
          include: {
            productor: true,
            usuarioFaena: true,
            tiposAnimales: true,
            corral: true
          }
        },
        operador: true
      },
      orderBy: { fecha: 'desc' }
    }) as Promise<PesajeCamion[]>
  }

  /**
   * Actualiza el pesaje con tara y cierra
   */
  async cerrarPesaje(id: string, pesoTara: number, pesoNeto: number): Promise<PesajeCamion> {
    return this.model.update({
      where: { id },
      data: {
        pesoTara,
        pesoNeto,
        estado: 'CERRADO' as EstadoPesaje,
        fechaTara: new Date()
      },
      include: {
        transportista: true,
        tropa: {
          include: {
            productor: true,
            usuarioFaena: true,
            tiposAnimales: true,
            corral: true
          }
        },
        operador: true
      }
    }) as Promise<PesajeCamion>
  }

  /**
   * Crea un pesaje completo con datos validados
   */
  async createPesaje(data: Prisma.PesajeCamionCreateInput): Promise<PesajeCamion> {
    return this.model.create({
      data,
      include: {
        transportista: true,
        operador: true
      }
    }) as Promise<PesajeCamion>
  }

  /**
   * Anula un pesaje
   */
  async anularPesaje(id: string): Promise<PesajeCamion> {
    return this.model.update({
      where: { id },
      data: { estado: 'ANULADO' as EstadoPesaje }
    }) as Promise<PesajeCamion>
  }
}

// Instancia singleton del repositorio
export const pesajeRepository = new PesajeRepository()
