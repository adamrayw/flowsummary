'use client'

import React, { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard/dashboard-layout'
import HeroSection from '@/components/dashboard/hero-section'
import SourcePanel from '@/components/dashboard/source-panel'
import PromptPanel from '@/components/dashboard/prompt-panel'
import TemplatesSection from '@/components/dashboard/templates-section'
import GeneratedOutputSection from '@/components/dashboard/generated-output-section'
import { Button } from '@/components/ui/button'
import { Wand2 } from 'lucide-react'
import type { GeneratedSummary, SummaryDetail, SummaryListItem } from '@/lib/summary-types'

export default function DashboardPage() {
  const [sourceText, setSourceText] = useState('')
  const [promptText, setPromptText] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [showOutput, setShowOutput] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)
  const [history, setHistory] = useState<SummaryListItem[]>([])
  const [activeSummaryId, setActiveSummaryId] = useState<string | null>(null)
  const [generatedOutput, setGeneratedOutput] = useState<GeneratedSummary | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadHistory = async () => {
    setIsHistoryLoading(true)

    try {
      const response = await fetch('/api/summaries', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Failed to load summary history')
      }

      const payload = (await response.json()) as { summaries: SummaryListItem[] }
      setHistory(payload.summaries)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load summary history')
    } finally {
      setIsHistoryLoading(false)
    }
  }

  useEffect(() => {
    void loadHistory()
  }, [])

  const handleGenerateSummary = async () => {
    if (!sourceText.trim()) {
      setErrorMessage('Please paste content or upload a file to summarize')
      return
    }

    setErrorMessage(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/summaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceText,
          instructions: promptText,
          templateId: selectedTemplate,
        }),
      })

      const payload = (await response.json().catch(() => null)) as {
        message?: string
        summary?: SummaryDetail
      } | null

      if (!response.ok || !payload?.summary) {
        throw new Error(payload?.message || 'Failed to generate summary')
      }

      setGeneratedOutput(payload.summary.output)
      setActiveSummaryId(payload.summary.id)
      setHistory((current) => [
        {
          id: payload.summary!.id,
          title: payload.summary!.title,
          template: payload.summary!.template,
          createdAt: payload.summary!.createdAt,
          updatedAt: payload.summary!.updatedAt,
        },
        ...current.filter((item) => item.id !== payload.summary!.id),
      ])
      setShowOutput(true)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to generate summary')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewSummary = () => {
    setSourceText('')
    setPromptText('')
    setSelectedTemplate(null)
    setGeneratedOutput(null)
    setActiveSummaryId(null)
    setErrorMessage(null)
    setShowOutput(false)
  }

  const handleSelectSummary = async (summaryId: string) => {
    setErrorMessage(null)

    try {
      const response = await fetch(`/api/summaries/${summaryId}`, { cache: 'no-store' })
      const payload = (await response.json().catch(() => null)) as {
        message?: string
        summary?: SummaryDetail
      } | null

      if (!response.ok || !payload?.summary) {
        throw new Error(payload?.message || 'Failed to open summary')
      }

      setSourceText(payload.summary.sourceText)
      setPromptText(payload.summary.instructions)
      setSelectedTemplate(payload.summary.template)
      setGeneratedOutput(payload.summary.output)
      setActiveSummaryId(payload.summary.id)
      setShowOutput(true)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to open summary')
    }
  }

  const handleDeleteSummary = async (summaryId: string) => {
    setErrorMessage(null)

    try {
      const response = await fetch(`/api/summaries/${summaryId}`, {
        method: 'DELETE',
      })
      const payload = (await response.json().catch(() => null)) as { message?: string } | null

      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to delete summary')
      }

      setHistory((current) => current.filter((item) => item.id !== summaryId))
      if (activeSummaryId === summaryId) {
        handleNewSummary()
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete summary')
    }
  }

  return (
    <DashboardLayout
      summaries={history}
      activeSummaryId={activeSummaryId}
      isHistoryLoading={isHistoryLoading}
      onNewSummary={handleNewSummary}
      onSelectSummary={handleSelectSummary}
      onDeleteSummary={handleDeleteSummary}
    >
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
        {errorMessage && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        {!showOutput ? (
          <>
            {/* Hero Section */}
            <HeroSection />

            {/* Main Workspace */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 items-stretch">
              {/* Source Panel */}
              <div className="min-h-[520px]">
                <SourcePanel value={sourceText} onChange={setSourceText} />
              </div>

              {/* Prompt Panel */}
              <div className="min-h-[520px]">
                <PromptPanel
                  value={promptText}
                  onChange={setPromptText}
                  selectedTemplate={selectedTemplate}
                />
              </div>
            </div>

            {/* Templates Section */}
            <div className="mb-12">
              <TemplatesSection
                selectedTemplate={selectedTemplate}
                onSelectTemplate={setSelectedTemplate}
              />
            </div>

            {/* Generate Button */}
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleGenerateSummary}
                disabled={isLoading}
                className="px-12 py-6 text-base bg-primary hover:bg-secondary text-primary-foreground"
              >
                {isLoading ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⚡</span>
                    Generating Summary...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Generate Summary
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Output View */}
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Generated Summary</h2>
              <Button
                variant="outline"
                onClick={handleNewSummary}
                className="border-border hover:bg-border"
              >
                Create New Summary
              </Button>
            </div>

            {generatedOutput && <GeneratedOutputSection output={generatedOutput} />}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
