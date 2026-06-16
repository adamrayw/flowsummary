'use client'

import React, { useRef, useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, FileText, Loader2, Upload, X } from 'lucide-react'
import {
  extractTextFromFile,
  type FileExtractionMetadata,
} from '@/lib/file-extractors'

interface SourcePanelProps {
  value: string
  onChange: (value: string) => void
}

interface UploadedFile {
  name: string
  size: number
}

const acceptedFileTypes = [
  '.txt',
  '.csv',
  '.pdf',
  '.docx',
  '.xlsx',
  'text/plain',
  'text/csv',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
].join(',')

export default function SourcePanel({ value, onChange }: SourcePanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [metadata, setMetadata] = useState<FileExtractionMetadata | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (file) {
      void processFile(file)
    }
  }

  const clearFile = () => {
    setUploadedFile(null)
    setMetadata(null)
    setUploadError(null)
    onChange('')

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const processFile = async (file: File) => {
    setUploadedFile({ name: file.name, size: file.size })
    setMetadata(null)
    setUploadError(null)
    setIsExtracting(true)

    try {
      const result = await extractTextFromFile(file)
      onChange(result.text)
      setMetadata(result.metadata)
    } catch (error) {
      onChange('')
      setUploadError(error instanceof Error ? error.message : 'Unable to read this file.')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setIsDragActive(false)

    const file = e.dataTransfer.files[0]

    if (file) {
      void processFile(file)
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Raw Data
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          Paste text, URLs, or documents for summarization
        </p>
      </div>

      {/* Upload Area */}
      <div className="relative">
        <label
          onDragEnter={() => setIsDragActive(true)}
          onDragLeave={() => setIsDragActive(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`flex items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors bg-card ${
            isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary'
          }`}
        >
          <div className="flex flex-col items-center justify-center">
            {isExtracting ? (
              <Loader2 className="w-5 h-5 text-primary mb-1 animate-spin" />
            ) : (
              <Upload className="w-5 h-5 text-muted-foreground mb-1" />
            )}
            <span className="text-xs text-muted-foreground">
              {isExtracting ? 'Extracting readable text...' : 'Click to upload or drag and drop'}
            </span>
          </div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept={acceptedFileTypes}
          />
        </label>
        <p className="mt-2 text-xs text-muted-foreground">
          Supported: PDF, DOCX, XLSX, CSV, TXT
        </p>
      </div>

      {/* File Display */}
      {uploadedFile && (
        <div className="rounded-lg border border-border bg-card px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{uploadedFile.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(uploadedFile.size)}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={clearFile}
              aria-label="Remove uploaded file"
              className="shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {(metadata || uploadError || isExtracting) && (
            <div className="mt-3 space-y-1 border-t border-border pt-3" aria-live="polite">
              {isExtracting && (
                <StatusLine icon="loading" text="Extracting readable text" />
              )}
              {metadata &&
                buildStatusMessages(metadata).map((message) => (
                  <StatusLine key={message} icon="success" text={message} />
                ))}
              {uploadError && <StatusLine icon="error" text={uploadError} />}
            </div>
          )}
        </div>
      )}

      {/* Textarea */}
      <Textarea
        placeholder="Paste your content here or upload a file..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-h-[220px] resize-none overflow-y-auto [field-sizing:fixed] bg-card border-border text-foreground placeholder-muted-foreground focus-visible:ring-primary"
      />

      <p className="text-xs text-muted-foreground">
        {value.length} characters
      </p>
    </div>
  )
}

function StatusLine({
  icon,
  text,
}: {
  icon: 'success' | 'error' | 'loading'
  text: string
}) {
  const Icon =
    icon === 'success' ? CheckCircle2 : icon === 'error' ? AlertCircle : Loader2

  return (
    <div
      className={`flex items-center gap-2 text-xs ${
        icon === 'error' ? 'text-red-200' : 'text-muted-foreground'
      }`}
    >
      <Icon
        className={`h-3.5 w-3.5 shrink-0 ${
          icon === 'success'
            ? 'text-emerald-400'
            : icon === 'error'
              ? 'text-red-300'
              : 'animate-spin text-primary'
        }`}
      />
      <span>{text}</span>
    </div>
  )
}

function buildStatusMessages(metadata: FileExtractionMetadata) {
  const messages = [`${metadata.type} detected`]

  if (metadata.pages !== undefined) {
    messages.push(`${metadata.pages} ${metadata.pages === 1 ? 'page' : 'pages'} extracted`)
  }

  if (metadata.sheets !== undefined) {
    messages.push(`${metadata.sheets} ${metadata.sheets === 1 ? 'sheet' : 'sheets'} extracted`)
  }

  if (metadata.rows !== undefined) {
    messages.push(`${metadata.rows} ${metadata.rows === 1 ? 'row' : 'rows'} extracted`)
  }

  messages.push(`${metadata.words} ${metadata.words === 1 ? 'word' : 'words'} extracted`)

  return messages
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}
