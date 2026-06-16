import mammoth from 'mammoth'

import type { RawFileExtractionResult } from './types'

export async function extractDocxText(file: File): Promise<RawFileExtractionResult> {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })

  return {
    text: result.value,
    metadata: {
      type: 'DOCX',
    },
  }
}
