'use client'

import React from 'react'
import { Textarea } from '@/components/ui/textarea'

interface PromptPanelProps {
  value: string
  onChange: (value: string) => void
  selectedTemplate: string | null
}

const TEMPLATE_PROMPTS: Record<string, string> = {
  'executive-summary':
    'Create a concise executive summary suitable for C-level executives. Focus on key metrics, business impact, and strategic implications.',
  'meeting-summary':
    'Summarize this meeting transcript. Include attendees, key discussion points, decisions made, and action items with owners.',
  'research-brief':
    'Create a research brief highlighting main findings, methodology, data quality, and implications for business decisions.',
  'project-status':
    'Generate a project status report covering completion percentage, milestones achieved, blockers, and next steps.',
  'competitive-analysis':
    'Analyze the competitive landscape. Include competitor overview, strengths, weaknesses, market positioning, and recommendations.',
  'technical-spec':
    'Create a technical specification document. Include system architecture, components, data flows, and implementation considerations.',
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
