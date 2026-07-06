'use client'

import React, { useState, useRef } from 'react'
import { UploadCloud, FileType2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UploadZoneProps {
  onUpload: (file: File) => void
  isUploading?: boolean
  statusText?: string
  error?: string | null
}

export default function UploadZone({ onUpload, isUploading = false, statusText, error }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      alert('Please upload a valid CSV, Excel, PDF, Word, or text file.')
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
          <h3 className="text-xl font-semibold mb-2">Analyzing Document...</h3>
          <p className="text-muted-foreground">{statusText || 'Extracting structures and detecting patterns'}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-sm">
            <UploadCloud className="w-10 h-10 text-primary" />
          </div>
          
          <h3 className="text-2xl font-bold mb-2">Upload your document</h3>
          <p className="text-muted-foreground mb-8 max-w-sm">
            Drag & drop your document here to begin the AI analysis.
          </p>
          
          <Button variant="secondary" className="px-8 pointer-events-none">
            Browse Files
          </Button>
          
          <div className="mt-8 flex items-center gap-4 text-sm text-muted-foreground/80">
            <span className="flex items-center gap-1.5"><FileType2 className="w-4 h-4" /> CSV</span>
            <span className="flex items-center gap-1.5"><FileType2 className="w-4 h-4" /> XLSX</span>
            <span className="flex items-center gap-1.5"><FileType2 className="w-4 h-4" /> PDF</span>
            <span className="flex items-center gap-1.5"><FileType2 className="w-4 h-4" /> DOCX</span>
          </div>
          {error && (
            <p className="mt-6 max-w-md text-sm text-destructive">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}
