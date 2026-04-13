import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Re-export utils from lib/utils for backward compatibility
export * from '@/lib/utils'

// Additional shared utilities can be added here

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
