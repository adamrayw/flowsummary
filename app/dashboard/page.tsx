'use client'

import React, { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard/dashboard-layout'
import UploadZone from '@/components/dashboard/upload-zone'
import InsightPreview, {
  DocumentDNA,
  DocumentHealth,
  LikelyUserIntent,
} from '@/components/dashboard/insight-preview'
import RecommendationEngine, { Recommendation } from '@/components/dashboard/recommendation-engine'
import GeneratedOutputSection from '@/components/dashboard/generated-output-section'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import type { SummaryListItem } from '@/lib/summary-types'

type DashboardState = 'UPLOAD' | 'ANALYZING' | 'INSIGHTS' | 'GENERATING' | 'REPORT'

type GeneratedReportOutput = {
  title: string
  summary: string
  keyInsights: string[]
  recommendations: string[]
  conclusion: string
}

type UploadAnalysisResponse = {
  analysis: {
    documentId: string
    filename: string
    profile: {
      dna: DocumentDNA
    }
    classification: {
      documentType: string
      confidence: number
      explanation: string
    }
    contextSummary: string[]
    documentHealth: DocumentHealth
    keyFindings: string[]
    aiInterpretation: string
    likelyUserIntent: LikelyUserIntent[]
    insightPreview: string[]
    recommendations: Recommendation[]
    model: string
  }
}

type ReportResponse = {
  report: {
    id: string
    title: string
    output: GeneratedReportOutput
    model: string
  }
}

type HistoryResponse = {
  summaries: SummaryListItem[]
}

type DocumentDetailResponse = {
  analysis: UploadAnalysisResponse['analysis']
  report: {
    id: string
    title: string
    output: GeneratedReportOutput
    model: string
    createdAt: string
  } | null
}

export default function DashboardPage() {
  const [currentState, setCurrentState] = useState<DashboardState>('UPLOAD')
  const [history, setHistory] = useState<SummaryListItem[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)
  const [activeSummaryId, setActiveSummaryId] = useState<string | null>(null)
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [dna, setDna] = useState<DocumentDNA | null>(null)
  const [classification, setClassification] = useState<string>('')
  const [classificationConfidence, setClassificationConfidence] = useState(0)
  const [classificationExplanation, setClassificationExplanation] = useState('')
  const [contextSummary, setContextSummary] = useState<string[]>([])
  const [documentHealth, setDocumentHealth] = useState<DocumentHealth | null>(null)
  const [keyFindings, setKeyFindings] = useState<string[]>([])
  const [aiInterpretation, setAiInterpretation] = useState('')
  const [likelyUserIntent, setLikelyUserIntent] = useState<LikelyUserIntent[]>([])
  const [insightPreview, setInsightPreview] = useState<string[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [generatedOutput, setGeneratedOutput] = useState<GeneratedReportOutput | null>(null)
  const [statusText, setStatusText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const loadHistory = async () => {
    setIsHistoryLoading(true)

    try {
      const response = await fetch('/api/document/history', { cache: 'no-store' })
      const payload = (await response.json().catch(() => null)) as
        | HistoryResponse
        | { message?: string }
        | null

      if (!response.ok || !payload || !('summaries' in payload)) {
        throw new Error(getPayloadMessage(payload) || 'Failed to load history.')
      }

      setHistory(payload.summaries)
    } catch (historyError) {
      setError(
        historyError instanceof Error
          ? historyError.message
          : 'Failed to load history.',
      )
    } finally {
      setIsHistoryLoading(false)
    }
  }

  useEffect(() => {
    void loadHistory()
  }, [])

  const handleUpload = async (file: File) => {
    setCurrentState('ANALYZING')
    setError(null)
    setGeneratedOutput(null)
    setStatusText('Uploading file and extracting readable content')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/document/upload', {
        method: 'POST',
        body: formData,
      })

      const payload = (await response.json().catch(() => null)) as
        | UploadAnalysisResponse
        | { message?: string }
        | null

      if (!response.ok || !payload || !('analysis' in payload)) {
        throw new Error(getPayloadMessage(payload) || 'Failed to analyze document.')
      }

      const { analysis } = payload
      setDocumentId(analysis.documentId)
      setClassification(analysis.classification.documentType)
      setClassificationConfidence(analysis.classification.confidence)
      setClassificationExplanation(analysis.classification.explanation)
      setDna(analysis.profile.dna)
      setContextSummary(analysis.contextSummary)
      setDocumentHealth(analysis.documentHealth)
      setKeyFindings(analysis.keyFindings)
      setAiInterpretation(analysis.aiInterpretation)
      setLikelyUserIntent(analysis.likelyUserIntent)
      setInsightPreview(analysis.insightPreview)
      setRecommendations(analysis.recommendations)
      setActiveSummaryId(analysis.documentId)
      setHistory((current) => [
        {
          id: analysis.documentId,
          title: `${analysis.classification.documentType} - ${analysis.filename}`,
          template: analysis.classification.documentType,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...current.filter((item) => item.id !== analysis.documentId),
      ])
      setCurrentState('INSIGHTS')
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Failed to analyze document.',
      )
      setCurrentState('UPLOAD')
    } finally {
      setStatusText('')
    }
  }

  const handleRecommendationSelect = async (id: string) => {
    if (!documentId) {
      setError('Upload analysis is missing. Please upload the document again.')
      return
    }

    setCurrentState('GENERATING')
    setError(null)

    try {
      const response = await fetch('/api/document/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          recommendationId: id,
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | ReportResponse
        | { message?: string }
        | null

      if (!response.ok || !payload || !('report' in payload)) {
        throw new Error(getPayloadMessage(payload) || 'Failed to generate report.')
      }

      setGeneratedOutput(payload.report.output)
      setHistory((current) =>
        current.map((item) =>
          item.id === documentId
            ? {
                ...item,
                title: payload.report.title,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      )
      setCurrentState('REPORT')
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : 'Failed to generate report.',
      )
      setCurrentState('INSIGHTS')
    }
  }

  const handleNewAnalysis = () => {
    setCurrentState('UPLOAD')
    setActiveSummaryId(null)
    setDocumentId(null)
    setDna(null)
    setClassification('')
    setClassificationConfidence(0)
    setClassificationExplanation('')
    setContextSummary([])
    setDocumentHealth(null)
    setKeyFindings([])
    setAiInterpretation('')
    setLikelyUserIntent([])
    setInsightPreview([])
    setRecommendations([])
    setGeneratedOutput(null)
    setError(null)
    setStatusText('')
  }

  const handleSelectHistory = async (summaryId: string) => {
    setError(null)

    try {
      const response = await fetch(`/api/document/${summaryId}`, { cache: 'no-store' })
      const payload = (await response.json().catch(() => null)) as
        | DocumentDetailResponse
        | { message?: string }
        | null

      if (!response.ok || !payload || !('analysis' in payload)) {
        throw new Error(getPayloadMessage(payload) || 'Failed to open saved analysis.')
      }

      const { analysis, report } = payload
      setActiveSummaryId(summaryId)
      setDocumentId(analysis.documentId)
      setClassification(analysis.classification.documentType)
      setClassificationConfidence(analysis.classification.confidence)
      setClassificationExplanation(analysis.classification.explanation)
      setDna(analysis.profile.dna)
      setContextSummary(analysis.contextSummary)
      setDocumentHealth(analysis.documentHealth)
      setKeyFindings(analysis.keyFindings)
      setAiInterpretation(analysis.aiInterpretation)
      setLikelyUserIntent(analysis.likelyUserIntent)
      setInsightPreview(analysis.insightPreview)
      setRecommendations(analysis.recommendations)
      setGeneratedOutput(report?.output || null)
      setCurrentState(report?.output ? 'REPORT' : 'INSIGHTS')
    } catch (selectError) {
      setError(
        selectError instanceof Error
          ? selectError.message
          : 'Failed to open saved analysis.',
      )
    }
  }

  const handleDeleteHistory = async (summaryId: string) => {
    const previousHistory = history
    setHistory((current) => current.filter((item) => item.id !== summaryId))

    if (activeSummaryId === summaryId) {
      handleNewAnalysis()
    }

    try {
      const response = await fetch(`/api/document/${summaryId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null
        throw new Error(payload?.message || 'Failed to delete saved analysis.')
      }
    } catch (deleteError) {
      setHistory(previousHistory)
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete saved analysis.',
      )
    }
  }

  return (
    <DashboardLayout
      summaries={history}
      activeSummaryId={activeSummaryId}
      isHistoryLoading={isHistoryLoading}
      onNewSummary={handleNewAnalysis}
      onSelectSummary={handleSelectHistory}
      onDeleteSummary={handleDeleteHistory}
    >
      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-8 h-full flex flex-col">
        
        {/* Header Section */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">
              {currentState === 'UPLOAD' && 'Document Intelligence'}
              {currentState === 'ANALYZING' && 'Processing Document...'}
              {currentState === 'INSIGHTS' && 'Analysis Complete'}
              {currentState === 'GENERATING' && 'Generating Report...'}
              {currentState === 'REPORT' && 'Generated Report'}
            </h1>
            <p className="text-muted-foreground">
              {currentState === 'UPLOAD' && 'Upload a file to automatically extract insights and generate reports.'}
              {currentState === 'ANALYZING' && 'Extracting context and determining the best actions.'}
              {currentState === 'INSIGHTS' && 'Review the extracted context and choose an action.'}
              {currentState === 'GENERATING' && 'Building a professional output from the selected recommendation.'}
              {currentState === 'REPORT' && 'Review the generated output and copy sections as needed.'}
            </p>
          </div>
          
          {(currentState === 'INSIGHTS' || currentState === 'GENERATING' || currentState === 'REPORT') && (
            <Button variant="outline" onClick={handleNewAnalysis}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              New Analysis
            </Button>
          )}
        </div>

        {error && currentState !== 'UPLOAD' && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Dynamic Content based on State */}
        <div className="flex-1 flex flex-col">
          {(currentState === 'UPLOAD' || currentState === 'ANALYZING') && (
            <div className="mt-8">
              <UploadZone 
                onUpload={handleUpload} 
                isUploading={currentState === 'ANALYZING'} 
                statusText={statusText}
                error={error}
              />
            </div>
          )}

          {currentState === 'INSIGHTS' && dna && (
            <div className="space-y-8">
              <InsightPreview 
                classification={classification}
                confidence={classificationConfidence}
                explanation={classificationExplanation}
                dna={dna}
                contextSummary={contextSummary}
                documentHealth={documentHealth}
                keyFindings={keyFindings}
                aiInterpretation={aiInterpretation}
                likelyUserIntent={likelyUserIntent}
                preview={insightPreview}
              />
              
              <div className="pt-4 border-t border-border/50">
                <RecommendationEngine 
                  recommendations={recommendations}
                  onSelect={handleRecommendationSelect}
                />
              </div>
            </div>
          )}

          {currentState === 'GENERATING' && (
            <div className="flex-1 flex items-center justify-center border border-border rounded-lg bg-card/30 min-h-[500px]">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Generating Report</h3>
                <p className="text-muted-foreground mb-4">
                  FlowSummary is turning the selected recommendation into an executive-ready output.
                </p>
              </div>
            </div>
          )}

          {currentState === 'REPORT' && generatedOutput && (
            <GeneratedOutputSection output={generatedOutput} />
          )}
        </div>
        
      </div>
    </DashboardLayout>
  )
}

function getPayloadMessage(payload: unknown) {
  if (!payload || typeof payload !== 'object' || !('message' in payload)) {
    return ''
  }

  const message = (payload as { message?: unknown }).message
  return typeof message === 'string' ? message : ''
}
