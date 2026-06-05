'use client'

import React, { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Upload, X } from 'lucide-react'

interface SourcePanelProps {
  value: string
  onChange: (value: string) => void
}

export default function SourcePanel({ value, onChange }: SourcePanelProps) {
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        onChange(content)
      }
      reader.readAsText(file)
    }
  }

  const clearFile = () => {
    setFileName(null)
    onChange('')
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
        <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg hover:border-primary cursor-pointer transition-colors bg-card">
          <div className="flex flex-col items-center justify-center">
            <Upload className="w-5 h-5 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground">
              Click to upload or drag and drop
            </span>
          </div>
          <input
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept=".txt,.pdf,.csv"
          />
        </label>
      </div>

      {/* File Display */}
      {fileName && (
        <div className="flex items-center justify-between px-3 py-2 bg-border rounded-lg">
          <span className="text-sm text-foreground truncate">{fileName}</span>
          <button
            onClick={clearFile}
            className="p-1 hover:bg-border rounded transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      )}

      {/* Textarea */}
      <Textarea
        placeholder="Paste your content here or upload a file..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 resize-none bg-card border-border text-foreground placeholder-muted-foreground focus-visible:ring-primary"
      />

      <p className="text-xs text-muted-foreground">
        {value.length} characters
      </p>
    </div>
  )
}
