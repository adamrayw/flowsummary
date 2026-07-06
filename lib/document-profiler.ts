import * as XLSX from 'xlsx'

import type { FileExtractionResult } from '@/lib/file-extractors'
import type { DocumentDNA, DocumentProfile } from '@/lib/document-intelligence-types'

const metricHints = [
  'amount',
  'balance',
  'budget',
  'cost',
  'expense',
  'hours',
  'margin',
  'price',
  'profit',
  'qty',
  'quantity',
  'rate',
  'revenue',
  'sales',
  'score',
  'total',
  'value',
]

const dimensionHints = [
  'category',
  'city',
  'customer',
  'department',
  'employee',
  'gender',
  'location',
  'manager',
  'name',
  'office',
  'product',
  'region',
  'status',
  'team',
  'type',
]

export async function buildDocumentProfile(
  file: File,
  extraction: FileExtractionResult,
): Promise<DocumentProfile> {
  const dna = await buildDocumentDNA(file, extraction)
  const columns = dna.columns.map((column) => column.toLowerCase())
  const mainMetrics = pickColumns(columns, metricHints)
  const keyDimensions = pickColumns(columns, dimensionHints)

  return {
    file: {
      name: file.name,
      type: extraction.metadata.type,
      sizeBytes: file.size,
      words: extraction.metadata.words,
      sheets: extraction.metadata.sheets,
      pages: extraction.metadata.pages,
    },
    dna,
    language: detectLanguage(extraction.text),
    mainMetrics,
    keyDimensions,
    kpis: inferKpis(columns),
    possibleRelationships: inferRelationships(mainMetrics, keyDimensions),
    potentialIssues: inferPotentialIssues(dna),
  }
}

async function buildDocumentDNA(
  file: File,
  extraction: FileExtractionResult,
): Promise<DocumentDNA> {
  if (extraction.metadata.type === 'XLSX') {
    return profileWorkbook(await file.arrayBuffer())
  }

  if (extraction.metadata.type === 'CSV') {
    return profileCsv(extraction.text)
  }

  return profileUnstructuredText(extraction.text)
}

function profileWorkbook(arrayBuffer: ArrayBuffer): DocumentDNA {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  const worksheet = firstSheetName ? workbook.Sheets[firstSheetName] : null
  const rows = worksheet
    ? (XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false }) as unknown[][])
    : []

  return profileRows(rows)
}

function profileCsv(text: string): DocumentDNA {
  const workbook = XLSX.read(text, { type: 'string' })
  const firstSheetName = workbook.SheetNames[0]
  const worksheet = firstSheetName ? workbook.Sheets[firstSheetName] : null
  const rows = worksheet
    ? (XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false }) as unknown[][])
    : []

  return profileRows(rows)
}

function profileRows(rows: unknown[][]): DocumentDNA {
  const headers = rows[0]?.map((cell) => String(cell ?? '').trim()).filter(Boolean) ?? []
  const dataRows = rows.slice(1)
  const columnCount = headers.length || maxColumnCount(rows)
  const missingValues = countMissingValues(dataRows, columnCount)

  return {
    rowCount: dataRows.length,
    columnCount,
    columns: headers,
    missingValues,
    duplicates: countDuplicates(dataRows),
    dateRange: inferDateRange(dataRows),
  }
}

function profileUnstructuredText(text: string): DocumentDNA {
  const nonEmptyLines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  const likelyHeaders = nonEmptyLines
    .slice(0, 12)
    .filter((line) => line.length < 80)
    .slice(0, 8)

  return {
    rowCount: nonEmptyLines.length,
    columnCount: likelyHeaders.length,
    columns: likelyHeaders,
    missingValues: 0,
    duplicates: countDuplicateStrings(nonEmptyLines),
    dateRange: inferDateRange(nonEmptyLines.map((line) => [line])),
  }
}

function maxColumnCount(rows: unknown[][]) {
  return rows.reduce((max, row) => Math.max(max, row.length), 0)
}

function countMissingValues(rows: unknown[][], columnCount: number) {
  let total = 0

  for (const row of rows) {
    for (let index = 0; index < columnCount; index += 1) {
      const value = row[index]
      if (value === undefined || value === null || String(value).trim() === '') {
        total += 1
      }
    }
  }

  return total
}

function countDuplicates(rows: unknown[][]) {
  return countDuplicateStrings(rows.map((row) => JSON.stringify(row)))
}

function countDuplicateStrings(values: string[]) {
  const seen = new Set<string>()
  let duplicates = 0

  for (const value of values) {
    if (seen.has(value)) {
      duplicates += 1
    } else {
      seen.add(value)
    }
  }

  return duplicates
}

function inferDateRange(rows: unknown[][]) {
  const timestamps: number[] = []

  for (const row of rows.slice(0, 5000)) {
    for (const cell of row) {
      const parsed = parseDateLikeValue(cell)
      if (parsed) {
        timestamps.push(parsed.getTime())
      }
    }
  }

  if (timestamps.length < 2) {
    return undefined
  }

  const min = new Date(Math.min(...timestamps))
  const max = new Date(Math.max(...timestamps))
  const formatter = new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

  return `${formatter.format(min)} - ${formatter.format(max)}`
}

function parseDateLikeValue(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value
  }

  if (typeof value === 'number') {
    return null
  }

  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  if (!/\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/.test(trimmed)) {
    return null
  }

  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function pickColumns(columns: string[], hints: string[]) {
  return columns
    .filter((column) => hints.some((hint) => column.includes(hint)))
    .slice(0, 8)
}

function inferKpis(columns: string[]) {
  const kpis = new Set<string>()

  if (columns.some((column) => column.includes('attendance') || column.includes('present'))) {
    kpis.add('Attendance rate')
  }
  if (columns.some((column) => column.includes('late'))) {
    kpis.add('Late arrival count')
  }
  if (columns.some((column) => column.includes('revenue') || column.includes('sales'))) {
    kpis.add('Revenue')
  }
  if (columns.some((column) => column.includes('expense') || column.includes('cost'))) {
    kpis.add('Expense')
  }
  if (columns.some((column) => column.includes('stock') || column.includes('inventory'))) {
    kpis.add('Stock level')
  }

  return Array.from(kpis).slice(0, 8)
}

function inferRelationships(metrics: string[], dimensions: string[]) {
  if (metrics.length === 0 || dimensions.length === 0) {
    return []
  }

  return dimensions
    .slice(0, 4)
    .map((dimension) => `${metrics[0]} by ${dimension}`)
}

function inferPotentialIssues(dna: DocumentDNA) {
  const issues: string[] = []

  if (dna.missingValues > 0) {
    issues.push(`${dna.missingValues.toLocaleString('en')} missing values detected`)
  }
  if (dna.duplicates > 0) {
    issues.push(`${dna.duplicates.toLocaleString('en')} duplicate records detected`)
  }
  if (dna.rowCount === 0) {
    issues.push('No data rows detected')
  }
  if (dna.columns.length === 0) {
    issues.push('No reliable headers detected')
  }

  return issues
}

function detectLanguage(text: string) {
  const lower = text.toLowerCase()
  const indonesianSignals = ['dan', 'yang', 'dengan', 'untuk', 'laporan', 'tanggal']
  const hits = indonesianSignals.filter((signal) => lower.includes(` ${signal} `)).length

  return hits >= 2 ? 'id' : 'en'
}
