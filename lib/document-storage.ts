import { Prisma } from '@prisma/client'

import type { DocumentProfile } from '@/lib/document-intelligence-types'

export function normalizeStoredDocumentProfile(params: {
  value: Prisma.JsonValue
  filename: string
  fileType: string
}): DocumentProfile | null {
  if (!params.value || typeof params.value !== 'object' || Array.isArray(params.value)) {
    return null
  }

  const record = params.value as Record<string, Prisma.JsonValue>

  if (record.dna && typeof record.dna === 'object' && !Array.isArray(record.dna)) {
    const profile = record as unknown as DocumentProfile
    if (profile.dna && typeof profile.dna.rowCount === 'number') {
      return profile
    }
  }

  const rowCount = getNumber(record.rowCount, 0)
  const columnCount = getNumber(record.columnCount, 0)
  const columns = getStringArray(record.columns)
  const missingValues = getNumber(record.missingValues, 0)
  const duplicates = getNumber(record.duplicates, 0)
  const dateRange = getString(record.dateRange)

  return {
    file: {
      name: params.filename,
      type: params.fileType,
      sizeBytes: 0,
      words: 0,
    },
    dna: {
      rowCount,
      columnCount,
      columns,
      missingValues,
      duplicates,
      dateRange: dateRange || undefined,
    },
    language: 'en',
    mainMetrics: [],
    keyDimensions: columns.slice(0, 8),
    kpis: [],
    possibleRelationships: [],
    potentialIssues: [
      missingValues > 0 ? `${missingValues.toLocaleString('en')} missing values detected` : '',
      duplicates > 0 ? `${duplicates.toLocaleString('en')} duplicate records detected` : '',
    ].filter(Boolean),
  }
}

function getString(value: Prisma.JsonValue | undefined) {
  return typeof value === 'string' ? value.trim() : ''
}

function getNumber(value: Prisma.JsonValue | undefined, fallback: number) {
  return typeof value === 'number' && !Number.isNaN(value) ? value : fallback
}

function getStringArray(value: Prisma.JsonValue | undefined) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}
