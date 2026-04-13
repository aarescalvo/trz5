import { PrismaClient } from '@prisma/client'

// Forzar nueva instancia cada vez en desarrollo para asegurar modelos actualizados
// Esto se debe revertir en producción
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// En desarrollo, siempre crear nueva instancia para obtener modelos actualizados
const forceNew = process.env.NODE_ENV !== 'production'

export const db = forceNew
  ? new PrismaClient({ log: ['query'] })
  : (globalForPrisma.prisma ?? new PrismaClient({ log: ['query'] }))

if (process.env.NODE_ENV === 'production') globalForPrisma.prisma = db
