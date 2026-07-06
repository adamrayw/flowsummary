import type { TextItem } from 'pdfjs-dist/types/src/display/api'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import type { RawFileExtractionResult } from './types'

let workerConfigured = false

type PdfjsModule = typeof import('pdfjs-dist')

export async function extractPdfText(file: File): Promise<RawFileExtractionResult> {
  const isServer = typeof window === 'undefined'
  const pdfjs = isServer ? await importServerPdfjs() : await import('pdfjs-dist')

  if (!workerConfigured && isServer) {
    pdfjs.GlobalWorkerOptions.workerSrc = getPdfjsPackageFileUrl(
      'legacy',
      'build',
      'pdf.worker.mjs',
    )
    workerConfigured = true
  }

  if (!workerConfigured && typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url,
    ).toString()
    workerConfigured = true
  }

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    standardFontDataUrl: isServer ? getPdfjsStandardFontDataUrl() : undefined,
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

function getPdfjsStandardFontDataUrl() {
  return getPdfjsPackageFileUrl('standard_fonts') + '/'
}

async function importServerPdfjs(): Promise<PdfjsModule> {
  const nativeImport = new Function('specifier', 'return import(specifier)') as (
    specifier: string,
  ) => Promise<PdfjsModule>

  return nativeImport(getPdfjsPackageFileUrl('legacy', 'build', 'pdf.mjs'))
}

function getPdfjsPackageFileUrl(...segments: string[]) {
  return pathToFileURL(path.join(process.cwd(), 'node_modules', 'pdfjs-dist', ...segments))
    .toString()
}

function isTextItem(item: unknown): item is TextItem {
  return typeof item === 'object' && item !== null && 'str' in item
}
