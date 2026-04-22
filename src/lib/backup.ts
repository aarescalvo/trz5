/**
 * Sistema de Backup Automático de Base de Datos
 * Soporta SQLite (archivo) y PostgreSQL (pg_dump/psql)
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import { createLogger } from '@/lib/logger'
const log = createLogger('lib.backup')

const execAsync = promisify(exec)

// Configuración
const BACKUP_DIR = path.join(process.cwd(), 'backups')
const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db')
const MAX_BACKUPS = 30 // Mantener últimos 30 backups

type DatabaseType = 'sqlite' | 'postgresql'

interface BackupInfo {
  filename: string
  path: string
  size: number
  createdAt: Date
  type: 'auto' | 'manual'
}

/**
 * Detect the database type from DATABASE_URL environment variable
 */
export function getDatabaseType(): DatabaseType {
  const dbUrl = process.env.DATABASE_URL || ''
  if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
    return 'postgresql'
  }
  return 'sqlite'
}

/**
 * Parse the DATABASE_URL to extract connection parameters for pg_dump/psql
 */
function getPgConnectionArgs(): string {
  const dbUrl = process.env.DATABASE_URL || ''
  // Build pg_dump/psql compatible connection string
  return `"${dbUrl}"`
}

/**
 * Crear directorio de backups si no existe
 */
async function ensureBackupDir(): Promise<void> {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true })
  } catch {
    // Directorio ya existe
  }
}

/**
 * Generar nombre de archivo de backup
 */
function generateBackupFilename(type: 'auto' | 'manual' = 'auto', dbType: DatabaseType = 'sqlite'): string {
  const now = new Date()
  const timestamp = now.toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19)
  const extension = dbType === 'postgresql' ? '.sql' : '.db'
  return `backup_${type}_${timestamp}${extension}`
}

/**
 * Crear backup SQLite (copia de archivo)
 */
async function createBackupSQLite(type: 'auto' | 'manual'): Promise<BackupInfo> {
  const filename = generateBackupFilename(type, 'sqlite')
  const backupPath = path.join(BACKUP_DIR, filename)

  // Verificar que la BD existe
  try {
    await fs.access(DB_PATH)
  } catch {
    throw new Error('Base de datos SQLite no encontrada')
  }

  // Copiar archivo de BD (SQLite es un solo archivo)
  await fs.copyFile(DB_PATH, backupPath)

  // Obtener tamaño
  const stats = await fs.stat(backupPath)

  return {
    filename,
    path: backupPath,
    size: stats.size,
    createdAt: new Date(),
    type
  }
}

/**
 * Crear backup PostgreSQL usando pg_dump
 */
async function createBackupPostgreSQL(type: 'auto' | 'manual'): Promise<BackupInfo> {
  const filename = generateBackupFilename(type, 'postgresql')
  const backupPath = path.join(BACKUP_DIR, filename)

  const connectionString = getPgConnectionArgs()

  // Use pg_dump with custom format for reliable backup
  // --no-owner and --no-acl for portability
  const command = `pg_dump --no-owner --no-acl --format=plain ${connectionString} > "${backupPath}"`

  try {
    await execAsync(command, { timeout: 300000 }) // 5 minute timeout
  } catch (err: unknown) {
    const stderr = err && typeof err === 'object' && 'stderr' in err ? String((err as { stderr: unknown }).stderr) : String(err)
    throw new Error(`Error ejecutando pg_dump: ${stderr}`)
  }

  // Obtener tamaño
  const stats = await fs.stat(backupPath)

  return {
    filename,
    path: backupPath,
    size: stats.size,
    createdAt: new Date(),
    type
  }
}

/**
 * Crear backup de la base de datos (rutea al motor correcto)
 */
export async function createBackup(type: 'auto' | 'manual' = 'auto'): Promise<BackupInfo> {
  await ensureBackupDir()

  const dbType = getDatabaseType()
  log.info(`Creando backup [${type}] para database: ${dbType}`)

  let backup: BackupInfo
  if (dbType === 'postgresql') {
    backup = await createBackupPostgreSQL(type)
  } else {
    backup = await createBackupSQLite(type)
  }

  // Limpiar backups antiguos
  await cleanOldBackups()

  return backup
}

/**
 * Restaurar backup SQLite
 */
async function restoreBackupSQLite(backupFilename: string): Promise<void> {
  const backupPath = path.join(BACKUP_DIR, backupFilename)

  // Verificar que el backup existe
  try {
    await fs.access(backupPath)
  } catch {
    throw new Error('Backup no encontrado')
  }

  // Crear backup del estado actual antes de restaurar
  await createBackup('manual')

  // Restaurar copiando el archivo
  await fs.copyFile(backupPath, DB_PATH)
}

/**
 * Restaurar backup PostgreSQL usando psql
 */
async function restoreBackupPostgreSQL(backupFilename: string): Promise<void> {
  const backupPath = path.join(BACKUP_DIR, backupFilename)

  // Verificar que el backup existe
  try {
    await fs.access(backupPath)
  } catch {
    throw new Error('Backup no encontrado')
  }

  // Crear backup del estado actual antes de restaurar
  await createBackup('manual')

  const connectionString = getPgConnectionArgs()

  // Restore using psql - the SQL dump contains DROP/CREATE statements from pg_dump
  // We use --single-transaction for atomicity and --on-error-stop to abort on errors
  const command = `psql --single-transaction --on-error-stop ${connectionString} < "${backupPath}"`

  try {
    await execAsync(command, { timeout: 600000 }) // 10 minute timeout
  } catch (err: unknown) {
    const stderr = err && typeof err === 'object' && 'stderr' in err ? String((err as { stderr: unknown }).stderr) : String(err)
    throw new Error(`Error ejecutando psql restore: ${stderr}`)
  }
}

/**
 * Restaurar backup (rutea al motor correcto)
 */
export async function restoreBackup(backupFilename: string): Promise<void> {
  const dbType = getDatabaseType()
  log.info(`Restaurando backup "${backupFilename}" para database: ${dbType}`)

  if (dbType === 'postgresql') {
    await restoreBackupPostgreSQL(backupFilename)
  } else {
    await restoreBackupSQLite(backupFilename)
  }
}

/**
 * Listar backups disponibles
 */
export async function listBackups(): Promise<BackupInfo[]> {
  await ensureBackupDir()

  const files = await fs.readdir(BACKUP_DIR)
  const backups: BackupInfo[] = []

  for (const filename of files) {
    if (!filename.endsWith('.db') && !filename.endsWith('.sql')) continue

    const filePath = path.join(BACKUP_DIR, filename)
    const stats = await fs.stat(filePath)

    const type = filename.includes('_auto_') ? 'auto' : 'manual'

    backups.push({
      filename,
      path: filePath,
      size: stats.size,
      createdAt: stats.birthtime,
      type
    })
  }

  // Ordenar por fecha descendente
  return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

/**
 * Eliminar backups antiguos (mantener solo los últimos MAX_BACKUPS)
 */
async function cleanOldBackups(): Promise<number> {
  const backups = await listBackups()

  // Separar automáticos y manuales
  const autoBackups = backups.filter(b => b.type === 'auto')
  const manualBackups = backups.filter(b => b.type === 'manual')

  let deleted = 0

  // Eliminar backups automáticos antiguos
  if (autoBackups.length > MAX_BACKUPS) {
    const toDelete = autoBackups.slice(MAX_BACKUPS)
    for (const backup of toDelete) {
      await fs.unlink(backup.path)
      deleted++
    }
  }

  // Mantener manuales por más tiempo (máximo 10)
  if (manualBackups.length > 10) {
    const toDelete = manualBackups.slice(10)
    for (const backup of toDelete) {
      await fs.unlink(backup.path)
      deleted++
    }
  }

  return deleted
}

/**
 * Eliminar un backup específico
 */
export async function deleteBackup(filename: string): Promise<boolean> {
  const backupPath = path.join(BACKUP_DIR, filename)

  try {
    await fs.unlink(backupPath)
    return true
  } catch {
    return false
  }
}

/**
 * Obtener información del espacio usado por backups
 */
export async function getBackupStats(): Promise<{
  totalBackups: number
  autoBackups: number
  manualBackups: number
  totalSize: number
  oldestBackup?: Date
  newestBackup?: Date
}> {
  const backups = await listBackups()

  const autoBackups = backups.filter(b => b.type === 'auto')
  const manualBackups = backups.filter(b => b.type === 'manual')
  const totalSize = backups.reduce((sum, b) => sum + b.size, 0)

  return {
    totalBackups: backups.length,
    autoBackups: autoBackups.length,
    manualBackups: manualBackups.length,
    totalSize,
    oldestBackup: backups[backups.length - 1]?.createdAt,
    newestBackup: backups[0]?.createdAt
  }
}

/**
 * Programar backups automáticos
 * @param intervalMs - Intervalo en milisegundos (default: 6 horas)
 */
export function scheduleAutoBackups(intervalMs: number = 6 * 60 * 60 * 1000): NodeJS.Timeout {
  log.info(`[Backup] Programando backups automáticos cada ${intervalMs / 1000 / 60} minutos`)

  // Backup inicial
  createBackup('auto').catch(err =>
    console.error('[Backup] Error en backup inicial:', err)
  )

  // Programar backups periódicos
  return setInterval(async () => {
    try {
      const backup = await createBackup('auto')
      log.info(`[Backup] Backup automático creado: ${backup.filename} (${formatBytes(backup.size)})`)
    } catch (err) {
      console.error('[Backup] Error en backup automático:', err)
    }
  }, intervalMs)
}

/**
 * Formatear bytes a string legible
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

// Exportar para uso en API
export { BACKUP_DIR }
