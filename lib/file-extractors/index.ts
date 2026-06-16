import type { FileExtractionResult, SupportedFileType } from './types'

const docxMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const xlsxMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export async function extractTextFromFile(file: File): Promise<FileExtractionResult> {
  const type = detectFileType(file)

  if (!type) {
    throw new Error('This file type is not supported.')
  }

  const result = await extractByType(file, type)

  return {
    text: result.text,
    metadata: {
      ...result.metadata,
      words: countWords(result.text),
    },
  }
}

async function extractByType(file: File, type: SupportedFileType) {
  if (type === 'PDF') {
    const { extractPdfText } = await import('./pdf')
    return extractPdfText(file)
  }

  if (type === 'DOCX') {
    const { extractDocxText } = await import('./docx')
    return extractDocxText(file)
  }

  if (type === 'XLSX') {
    const { extractXlsxText } = await import('./xlsx')
    return extractXlsxText(file)
  }

  const { extractTextFile } = await import('./txt')
  return extractTextFile(file, type)
}

function detectFileType(file: File): SupportedFileType | null {
  const mimeType = file.type.toLowerCase()
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (mimeType === 'application/pdf' || extension === 'pdf') {
    return 'PDF'
  }

  if (mimeType === docxMimeType || extension === 'docx') {
    return 'DOCX'
  }

  if (mimeType === xlsxMimeType || extension === 'xlsx') {
    return 'XLSX'
  }

  if (mimeType === 'text/csv' || mimeType === 'application/csv' || extension === 'csv') {
    return 'CSV'
  }

  if (mimeType === 'text/plain' || extension === 'txt') {
    return 'TXT'
  }

  return null
}

function countWords(text: string) {
  const matches = text.trim().match(/\S+/g)

  return matches?.length ?? 0
}

export type { FileExtractionMetadata, FileExtractionResult, SupportedFileType } from './types'
