import type { RawFileExtractionResult, SupportedFileType } from './types'

export async function extractTextFile(
  file: File,
  type: Extract<SupportedFileType, 'CSV' | 'TXT'>,
): Promise<RawFileExtractionResult> {
  const text = await file.text()

  return {
    text,
    metadata: {
      type,
      rows: type === 'CSV' ? countCsvRows(text) : undefined,
    },
  }
}

function countCsvRows(text: string) {
  return text
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean).length
}
