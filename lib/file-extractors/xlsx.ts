import * as XLSX from 'xlsx'

import type { RawFileExtractionResult } from './types'

export async function extractXlsxText(file: File): Promise<RawFileExtractionResult> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  const sheets = workbook.SheetNames
    .map((sheetName) => {
      const sheet = workbook.Sheets[sheetName]
      const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false }).trim()

      return csv ? `Sheet: ${sheetName}\n${csv}` : ''
    })
    .filter(Boolean)

  return {
    text: sheets.join('\n\n'),
    metadata: {
      type: 'XLSX',
      sheets: workbook.SheetNames.length,
    },
  }
}
