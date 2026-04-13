import { BaseService } from '@/core/service/base.service'
import { PesajeRepository, pesajeRepository } from '../repositories/pesaje.repository'
import { PesajeCamion, PesajeCreate, PesajeUpdate, TipoPesaje, EstadoPesaje, Especie } from '../types'
import { eventBus } from '@/core/events/event-bus'
import { db } from '@/lib/db'
import { Prisma, Especie as PrismaEspecie, TipoAnimal as PrismaTipoAnimal, TipoPesajeCamion, EstadoPesaje as PrismaEstadoPesaje } from '@prisma/client'

/**
 * Servicio para la gestión de pesajes de camiones
 * Implementa la lógica de negocio y coordina el repositorio
 */
export class PesajeService extends BaseService<PesajeCamion> {
  protected repository: PesajeRepository = pesajeRepository

  /**
   * Crea un nuevo pesaje con lógica de negocio completa
   */
  async crearPesaje(data: PesajeCreate): Promise<PesajeCamion> {
    const numeroTicket = await this.repository.getNextTicket()
    
    // Determinar estado basado en si tiene ambos pesos
    const estado: EstadoPesaje = data.pesoBruto && data.pesoTara ? 'CERRADO' : 'ABIERTO'
    
    // Crear pesaje
    const pesajeData: Prisma.PesajeCamionCreateInput = {
      tipo: (data.tipo || 'INGRESO_HACIENDA') as TipoPesajeCamion,
      numeroTicket,
      patenteChasis: data.patenteChasis || '',
      patenteAcoplado: data.patenteAcoplado || null,
      choferNombre: data.choferNombre || null,
      choferDni: data.choferDni || null,
      destino: data.destino || null,
      remito: data.remito || null,
      pesoBruto: data.pesoBruto || null,
      pesoTara: data.pesoTara || null,
      pesoNeto: data.pesoNeto || null,
      observaciones: data.observaciones || null,
      estado: estado as PrismaEstadoPesaje,
      fechaTara: data.pesoTara ? new Date() : null
    }
    
    // Agregar FKs opcionales si existen
    if (data.transportistaId) {
      pesajeData.transportistaId = data.transportistaId
    }
    if (data.operadorId) {
      pesajeData.operadorId = data.operadorId
    }
    
    const pesaje = await this.repository.createPesaje(pesajeData)
    
    // Emitir evento de pesaje creado
    eventBus.emit('tropa.creada', pesaje)
    
    return pesaje
  }

  /**
   * Registra el peso bruto de un pesaje
   */
  async registrarBruto(id: string, pesoBruto: number): Promise<PesajeCamion> {
    const pesaje = await this.repository.findById(id)
    if (!pesaje) {
      throw new Error('Pesaje no encontrado')
    }
    
    return this.repository.update(id, { pesoBruto } as PesajeUpdate)
  }

  /**
   * Registra el peso tara y cierra el pesaje
   */
  async registrarTara(id: string, pesoTara: number): Promise<PesajeCamion> {
    const pesaje = await this.repository.findById(id)
    if (!pesaje) {
      throw new Error('Pesaje no encontrado')
    }
    
    if (!pesaje.pesoBruto) {
      throw new Error('El pesaje no tiene peso bruto registrado')
    }
    
    const pesoNeto = pesaje.pesoBruto - pesoTara
    const pesajeCerrado = await this.repository.cerrarPesaje(id, pesoTara, pesoNeto)
    
    // Si tiene tropa asociada, actualizarla
    if (pesajeCerrado.tropa) {
      await db.tropa.update({
        where: { id: pesajeCerrado.tropa.id },
        data: {
          pesoTara,
          pesoNeto,
          estado: 'EN_CORRAL'
        }
      })
    }
    
    return pesajeCerrado
  }

  /**
   * Obtiene todos los pesajes abiertos
   */
  async getAbiertos(): Promise<PesajeCamion[]> {
    return this.repository.findAbiertos()
  }

  /**
   * Obtiene todos los pesajes cerrados
   */
  async getCerrados(): Promise<PesajeCamion[]> {
    return this.repository.findCerrados()
  }

  /**
   * Obtiene todos los pesajes con relaciones
   */
  async getAll(): Promise<PesajeCamion[]> {
    return this.repository.findAllWithRelations()
  }

  /**
   * Obtiene el siguiente número de ticket
   */
  async getNextTicket(): Promise<number> {
    return this.repository.getNextTicket()
  }

  /**
   * Busca pesajes por rango de fechas
   */
  async getByFechaRange(fechaDesde: Date, fechaHasta: Date): Promise<PesajeCamion[]> {
    return this.repository.findByFechaRange(fechaDesde, fechaHasta)
  }

  /**
   * Busca un pesaje por número de ticket
   */
  async getByTicket(numeroTicket: number): Promise<PesajeCamion | null> {
    return this.repository.findByTicket(numeroTicket)
  }

  /**
   * Anula un pesaje existente
   */
  async anularPesaje(id: string): Promise<PesajeCamion> {
    return this.repository.anularPesaje(id)
  }

  /**
   * Genera el código de tropa según la especie
   */
  async generarCodigoTropa(especie: Especie): Promise<{ codigo: string; numero: number }> {
    const year = new Date().getFullYear()
    const letra = especie === 'BOVINO' ? 'B' : especie === 'EQUINO' ? 'E' : 'O'
    
    const tropas = await db.tropa.findMany({
      where: {
        codigo: {
          startsWith: `${letra} ${year}`
        }
      },
      orderBy: { numero: 'desc' }
    })
    
    const nextNumero = tropas.length > 0 ? (tropas[0].numero || 0) + 1 : 1
    const secuencial = String(nextNumero).padStart(4, '0')
    
    return {
      codigo: `${letra} ${year} ${secuencial}`,
      numero: nextNumero
    }
  }

  /**
   * Crea pesaje de ingreso de hacienda con tropa y animales
   */
  async crearIngresoHacienda(data: PesajeCreate & { 
    usuarioFaenaId: string
    especie: Especie
    tiposAnimales: { tipoAnimal: string; cantidad: number }[]
    cantidadCabezas: number
  }): Promise<{ pesaje: PesajeCamion; tropa: unknown; animalesCreados: number }> {
    // Crear el pesaje primero
    const pesaje = await this.crearPesaje(data)
    
    // Validar usuario faena
    const usuarioFaenaExists = await db.cliente.findUnique({
      where: { id: data.usuarioFaenaId }
    })
    if (!usuarioFaenaExists) {
      throw new Error('Usuario de faena no válido')
    }
    
    // Generar código de tropa
    const { codigo, numero } = await this.generarCodigoTropa(data.especie)
    
    // Crear la tropa
    const tropaData: Prisma.TropaCreateInput = {
      numero,
      codigo,
      usuarioFaenaId: data.usuarioFaenaId,
      especie: data.especie as PrismaEspecie,
      cantidadCabezas: data.cantidadCabezas,
      dte: data.dte || '',
      guia: data.guia || '',
      pesajeCamionId: pesaje.id,
      estado: 'RECIBIDO'
    }
    
    if (data.productorId) tropaData.productorId = data.productorId
    if (data.corralId) tropaData.corralId = data.corralId
    if (data.pesoBruto) tropaData.pesoBruto = data.pesoBruto
    if (data.pesoTara) tropaData.pesoTara = data.pesoTara
    if (data.pesoNeto) tropaData.pesoNeto = data.pesoNeto
    if (data.observaciones) tropaData.observaciones = data.observaciones
    if (data.operadorId) tropaData.operadorId = data.operadorId
    
    const tropa = await db.tropa.create({
      data: tropaData,
      include: {
        productor: true,
        usuarioFaena: true,
        tiposAnimales: true,
        corral: true
      }
    })
    
    // Crear tipos de animales
    if (data.tiposAnimales && data.tiposAnimales.length > 0) {
      for (const t of data.tiposAnimales) {
        if (t.tipoAnimal && t.cantidad > 0) {
          await db.tropaAnimalCantidad.create({
            data: {
              tropaId: tropa.id,
              tipoAnimal: t.tipoAnimal as PrismaTipoAnimal,
              cantidad: t.cantidad
            }
          })
        }
      }
    }
    
    // Crear animales individuales
    const codigoBase = tropa.codigo.replace(/ /g, '')
    let animalesCreados = 0
    let animalNumero = 1
    
    for (const tipoInfo of data.tiposAnimales.filter(t => t.cantidad > 0)) {
      for (let i = 0; i < tipoInfo.cantidad; i++) {
        const codigoAnimal = `${codigoBase}-${String(animalNumero).padStart(3, '0')}`
        try {
          await db.animal.create({
            data: {
              tropaId: tropa.id,
              numero: animalNumero,
              codigo: codigoAnimal,
              tipoAnimal: tipoInfo.tipoAnimal as PrismaTipoAnimal,
              estado: 'RECIBIDO',
              corralId: data.corralId || null
            }
          })
          animalesCreados++
          animalNumero++
        } catch (error) {
          console.error(`Error creando animal ${codigoAnimal}:`, error)
        }
      }
    }
    
    // Si no había tipos definidos pero sí cantidad total
    if (animalesCreados === 0 && data.cantidadCabezas > 0) {
      for (let i = 1; i <= data.cantidadCabezas; i++) {
        const codigoAnimal = `${codigoBase}-${String(i).padStart(3, '0')}`
        try {
          await db.animal.create({
            data: {
              tropaId: tropa.id,
              numero: i,
              codigo: codigoAnimal,
              tipoAnimal: 'VA' as PrismaTipoAnimal,
              estado: 'RECIBIDO',
              corralId: data.corralId || null
            }
          })
          animalesCreados++
        } catch (error) {
          console.error(`Error creando animal ${codigoAnimal}:`, error)
        }
      }
    }
    
    // Re-fetch tropa completa
    const tropaCompleta = await db.tropa.findUnique({
      where: { id: tropa.id },
      include: {
        productor: true,
        usuarioFaena: true,
        tiposAnimales: true,
        corral: true,
        animales: {
          select: { id: true, numero: true, codigo: true, tipoAnimal: true, estado: true }
        }
      }
    })
    
    return { pesaje, tropa: tropaCompleta, animalesCreados }
  }
}

// Instancia singleton del servicio
export const pesajeService = new PesajeService()
