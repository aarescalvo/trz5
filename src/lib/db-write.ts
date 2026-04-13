// Re-export db from the main db module
// This module previously had a separate PrismaClient with hardcoded path
// Now it uses the centralized db instance
export { db } from '@/lib/db'
