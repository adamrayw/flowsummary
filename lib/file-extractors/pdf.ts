import type { TextItem } from 'pdfjs-dist/types/src/display/api'

import type { RawFileExtractionResult } from './types'

let workerConfigured = false

export async function extractPdfText(file: File): Promise<RawFileExtractionResult> {
  const pdfjs = await import('pdfjs-dist')

  if (!workerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url,
    ).toString()
    workerConfigured = true
  }

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  })
  const pdf = await loadingTask.promise
  const pageCount = pdf.numPages
  const pages: string[] = []

  try {
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)
      const content = await page.getTextContent()
      const pageText = content.items
        .filter(isTextItem)
        .map((item) => item.str.trim())
        .filter(Boolean)
        .join(' ')

      if (pageText) {
        pages.push(pageText)
      }

      page.cleanup()
    }
  } finally {
    await pdf.cleanup()
    await loadingTask.destroy()
  }

  return {
    text: pages.join('\n\n'),
    metadata: {
      type: 'PDF',
      pages: pageCount,
    },
  }
}

function isTextItem(item: unknown): item is TextItem {
  return typeof item === 'object' && item !== null && 'str' in item
}
