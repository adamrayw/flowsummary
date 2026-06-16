export type SupportedFileType = 'PDF' | 'DOCX' | 'XLSX' | 'CSV' | 'TXT'

export interface FileExtractionMetadata {
  type: SupportedFileType
  words: number
  pages?: number
  sheets?: number
  rows?: number
}

export interface FileExtractionResult {
  text: string
  metadata: FileExtractionMetadata
}

export type RawFileExtractionResult = {
  text: string
  metadata: Omit<FileExtractionMetadata, 'words'>
}
