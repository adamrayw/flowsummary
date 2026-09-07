'use client'

import React, { useState, useRef } from 'react'
import { UploadCloud, FileType2, Loader2, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-context'

interface UploadZoneProps {
  onUpload: (file: File) => void
  isUploading?: boolean
  statusText?: string
  error?: string | null
}

export default function UploadZone({ onUpload, isUploading = false, statusText, error }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { language, setLanguage } = useLanguage()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      validateAndUpload(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      validateAndUpload(file)
    }
  }

  const validateAndUpload = (file: File) => {
    // Basic validation for supported document intelligence formats.
    const validTypes = [
      'text/csv', 
      'application/vnd.ms-excel', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ]
    
    if (validTypes.includes(file.type) || /\.(csv|xlsx|pdf|docx|txt)$/i.test(file.name)) {
      onUpload(file)
    } else {
      alert(language === 'id' ? 'Silakan unggah file CSV, Excel, PDF, Word, atau teks yang valid.' : 'Please upload a valid CSV, Excel, PDF, Word, or text file.')
    }
  }

  return (
    <div 
      className={`relative w-full h-[400px] rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-8 text-center cursor-pointer
        ${isDragging ? 'border-primary bg-primary/5' : 'border-border bg-card/50 hover:bg-card hover:border-primary/50'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        accept=".csv,.xlsx,.pdf,.docx,.txt,text/csv,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden" 
      />
      
      {isUploading ? (
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
          <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {language === 'id' ? 'Menganalisis Dokumen...' : 'Analyzing Document...'}
          </h3>
          <p className="text-muted-foreground">{statusText || (language === 'id' ? 'Mengekstraksi struktur dan mendeteksi pola data' : 'Extracting structures and detecting patterns')}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 shadow-sm">
            <UploadCloud className="w-10 h-10 text-primary" />
          </div>

          {/* AI Language Selection Pill */}
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs text-foreground cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">{language === 'id' ? 'Bahasa Hasil AI:' : 'AI Output Language:'}</span>
            <div className="flex items-center gap-1 bg-background/80 rounded-full p-0.5 border border-border/60">
              <button
                type="button"
                onClick={() => setLanguage('id')}
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold transition ${
                  language === 'id'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                🇮🇩 ID
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold transition ${
                  language === 'en'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                🇬🇧 EN
              </button>
            </div>
          </div>
          
          <h3 className="text-2xl font-bold mb-2">
            {language === 'id' ? 'Unggah dokumen Anda' : 'Upload your document'}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-sm text-sm">
            {language === 'id' ? 'Tarik & lepas dokumen Anda di sini untuk memulai analisis AI otomatis.' : 'Drag & drop your document here to begin the AI analysis.'}
          </p>
          
          <Button variant="secondary" className="px-8 pointer-events-none">
            {language === 'id' ? 'Pilih File' : 'Browse Files'}
          </Button>
          
          <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground/80">
            <span className="flex items-center gap-1.5"><FileType2 className="w-3.5 h-3.5" /> CSV</span>
            <span className="flex items-center gap-1.5"><FileType2 className="w-3.5 h-3.5" /> XLSX</span>
            <span className="flex items-center gap-1.5"><FileType2 className="w-3.5 h-3.5" /> PDF</span>
            <span className="flex items-center gap-1.5"><FileType2 className="w-3.5 h-3.5" /> DOCX</span>
          </div>
          {error && (
            <p className="mt-4 max-w-md text-sm text-destructive">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}
