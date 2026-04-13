export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface SearchResult<T> {
  data: T[]
  total: number
}

export type SortDirection = 'asc' | 'desc'

export interface SortOptions {
  field: string
  direction: SortDirection
}
