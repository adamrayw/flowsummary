'use client'

import React from 'react'
import { Textarea } from '@/components/ui/textarea'
import { TEMPLATE_PROMPTS } from '@/lib/constants'

interface PromptPanelProps {
  value: string
  onChange: (value: string) => void
  selectedTemplate: string | null
}

export default function PromptPanel({ value, onChange, selectedTemplate }: PromptPanelProps) {
  const defaultPrompt = selectedTemplate ? TEMPLATE_PROMPTS[selectedTemplate] : ''

  return (
    <div className="flex flex-col gap-4 h-full">
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Instructions
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          Customize how the summary should be generated
        </p>
      </div>

      <Textarea
        placeholder={defaultPrompt || 'Enter custom instructions for summarization...'}
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
