'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Check,
  ChevronDown,
  ClipboardCheck,
  Copy,
  Download,
  FileText,
  GripVertical,
  LineChart,
  ListChecks,
  Loader2,
  Map,
  PanelRightClose,
  PanelRightOpen,
  Presentation,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import type {
  GeneratedDocumentOutput,
  NextAnalysis,
  OutputAction,
  OutputMetric,
  OutputSection,
  OutputSlide,
} from '@/lib/document-intelligence-types'
import { cn } from '@/lib/utils'

interface GeneratedOutputSectionProps {
  output: GeneratedDocumentOutput
}

type WorkspaceState = {
  selectedKpi: string
  selectedDimension: string
  selectedTimeRange: string
  selectedRegion: string
  selectedProduct: string
  analysisHistory: string[]
  previousReasoning: string[]
}

type EvidenceTarget =
  | {
      kind: 'metric'
      title: string
      confidence?: number
      evidence: string[]
      sourceFields: string[]
      affectedRecords?: string
      reasoningSummary: string
    }
  | {
      kind: 'section'
      title: string
      confidence?: number
      evidence: string[]
      sourceFields: string[]
      affectedRecords?: string
      reasoningSummary: string
    }

type WorkspaceModal = {
  title: string
  label: string
  description: string
  answer?: string
  blocks: Array<{
    title: string
    items: string[]
  }>
  primaryAction?: string
}

type AnalystMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  supportingEvidence?: Array<{
    label: string
    value: string
  }>
  followUps?: string[]
}

type WorkspaceActionRequest = {
  triggerType: 'metric-action' | 'recommended-action' | 'next-analysis' | 'follow-up-question' | 'copilot' | 'evidence'
  triggerLabel: string
  metric?: OutputMetric
  action?: OutputAction
  nextAnalysis?: NextAnalysis
  question?: string
  evidence?: EvidenceTarget
}

type PresentationAudience = 'Executive Board' | 'Director' | 'Manager' | 'Operations Team' | 'Government' | 'Client' | 'Investor'
type PresentationStyle = 'Executive' | 'Corporate' | 'Minimal' | 'Government' | 'Startup' | 'Financial' | 'Dark' | 'Light'

type PresentationSlideModel = {
  id: string
  title: string
  subtitle?: string
  bullets: string[]
  highlights: string[]
  confidence?: number
  evidence: string[]
  businessImpact?: string
  speakerNotes: {
    keyMessage: string
    emphasize: string[]
    possibleQuestions: string[]
    suggestedAnswers: string[]
  }
}

type PresentationModel = {
  title: string
  audience: PresentationAudience
  style: PresentationStyle
  sourceWorkspace: string
  generatedFrom: string
  slides: PresentationSlideModel[]
}

type WorkspaceInteraction = {
  state: WorkspaceState
  activeEvidence: EvidenceTarget | null
  setActiveEvidence: (target: EvidenceTarget | null) => void
  openWorkspaceModal: (modal: WorkspaceModal) => void
  requestWorkspaceModal: (
    request: WorkspaceActionRequest,
    fallback: WorkspaceModal,
    event?: string,
    stateOverride?: WorkspaceState,
  ) => Promise<void>
  updateState: (patch: Partial<WorkspaceState>, event?: string) => void
  handleMetricAction: (action: string, metric: OutputMetric) => void
  handleSectionEvidence: (section: OutputSection) => void
}

type RendererProps = GeneratedOutputSectionProps & {
  workspace: WorkspaceInteraction
}

export default function GeneratedOutputSection({ output }: GeneratedOutputSectionProps) {
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>(() => ({
    selectedKpi: output.metrics[0]?.label || output.hero.label,
    selectedDimension: output.sections[0]?.title || 'Overview',
    selectedTimeRange: output.hero.trend || 'Current analysis',
    selectedRegion: 'All regions',
    selectedProduct: 'All products',
    analysisHistory: ['Upload completed', `${output.workspaceTitle} opened`],
    previousReasoning: [output.aiThinkingSummary],
  }))
  const [activeEvidence, setActiveEvidence] = useState<EvidenceTarget | null>(null)
  const [activeModal, setActiveModal] = useState<WorkspaceModal | null>(null)
  const [isModalLoading, setIsModalLoading] = useState(false)
  const [isAnalystConsoleOpen, setIsAnalystConsoleOpen] = useState(false)
  const [analystConsoleWidth, setAnalystConsoleWidth] = useState(400)
  const [presentationModel, setPresentationModel] = useState<PresentationModel | null>(null)
  const [selectedPresentationSlideId, setSelectedPresentationSlideId] = useState<string | null>(null)

  useEffect(() => {
    const storedOpen = window.localStorage.getItem('flowsummary:analyst-console-open')
    const storedWidth = Number(window.localStorage.getItem('flowsummary:analyst-console-width'))

    if (storedOpen === 'true' && window.innerWidth >= 1280) {
      setIsAnalystConsoleOpen(true)
    }

    if (Number.isFinite(storedWidth) && storedWidth >= 380 && storedWidth <= 640) {
      setAnalystConsoleWidth(storedWidth)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem('flowsummary:analyst-console-open', String(isAnalystConsoleOpen))
  }, [isAnalystConsoleOpen])

  useEffect(() => {
    window.localStorage.setItem('flowsummary:analyst-console-width', String(analystConsoleWidth))
  }, [analystConsoleWidth])

  const updateState = (patch: Partial<WorkspaceState>, event?: string) => {
    setWorkspaceState((current) => ({
      ...current,
      ...patch,
      analysisHistory: event ? [...current.analysisHistory, event].slice(-8) : current.analysisHistory,
      previousReasoning:
        event && !current.previousReasoning.includes(event)
          ? [...current.previousReasoning, event].slice(-6)
          : current.previousReasoning,
    }))
  }

  const requestWorkspaceModal = async (
    request: WorkspaceActionRequest,
    fallback: WorkspaceModal,
    event?: string,
    stateOverride?: WorkspaceState,
  ) => {
    const effectiveState = stateOverride || workspaceState

    if (event) {
      updateState({}, event)
    }

    setActiveEvidence(null)
    setIsModalLoading(true)
    setActiveModal({
      title: `Generating ${request.triggerLabel}`,
      label: 'AI Analyst',
      description: 'FlowSummary is using the clicked action, current workspace state, and extracted document intelligence to generate this view.',
      answer: 'Preparing a focused analyst response for the action you selected.',
      blocks: [
        {
          title: 'Active Context',
          items: [
            `KPI: ${effectiveState.selectedKpi}`,
            `Dimension: ${effectiveState.selectedDimension}`,
            `Time range: ${effectiveState.selectedTimeRange}`,
          ],
        },
      ],
      primaryAction: 'Preparing analyst output...',
    })

    try {
      const response = await fetch('/api/workspace/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...request,
          workspaceState: effectiveState,
          output,
        }),
      })
      const payload = (await response.json().catch(() => null)) as { modal?: WorkspaceModal; message?: string } | null

      if (!response.ok || !payload?.modal) {
        throw new Error(payload?.message || 'Unable to generate workspace action.')
      }

      setActiveModal(payload.modal)
    } catch {
      setActiveModal(fallback)
    } finally {
      setIsModalLoading(false)
    }
  }

  const handleMetricAction = (action: string, metric: OutputMetric) => {
    const event = `${action} selected for ${metric.label}`
    const statePatch = {
      selectedKpi: metric.label,
      selectedDimension: metric.sourceFields?.[0] || workspaceState.selectedDimension,
    }
    const nextState = { ...workspaceState, ...statePatch }

    updateState(statePatch, event)

    if (action === 'View Evidence') {
      const evidence = metricToEvidence(metric, output)
      void requestWorkspaceModal(
        {
          triggerType: 'evidence',
          triggerLabel: `View Evidence: ${metric.label}`,
          metric,
          evidence,
        },
        buildEvidenceActionModal(evidence, nextState),
        undefined,
        nextState,
      )
      return
    }

    void requestWorkspaceModal(
      {
        triggerType: 'metric-action',
        triggerLabel: action,
        metric,
      },
      buildMetricActionModal(action, metric, output, nextState),
      undefined,
      nextState,
    )
  }

  const handleSectionEvidence = (section: OutputSection) => {
    const statePatch = { selectedDimension: section.title }
    const nextState = { ...workspaceState, ...statePatch }
    const evidence = sectionToEvidence(section, output)

    updateState(statePatch, `Evidence opened for ${section.title}`)
    void requestWorkspaceModal(
      {
        triggerType: 'evidence',
        triggerLabel: `View Evidence: ${section.title}`,
        evidence,
      },
      buildEvidenceActionModal(evidence, nextState),
      undefined,
      nextState,
    )
  }

  const workspace: WorkspaceInteraction = {
    state: workspaceState,
    activeEvidence,
    setActiveEvidence,
    openWorkspaceModal: setActiveModal,
    requestWorkspaceModal,
    updateState,
    handleMetricAction,
    handleSectionEvidence,
  }

  const openPresentationWorkspace = () => {
    const model = buildPresentationModelFromWorkspace(output, workspaceState, 'Executive Board', 'Corporate')
    setPresentationModel(model)
    setSelectedPresentationSlideId(model.slides[0]?.id || null)
    updateState({}, 'Presentation Workspace opened from current investigation')
  }

  const renderer =
    output.renderer === 'executive-dashboard' ? (
      <ExecutiveDashboardRenderer output={output} workspace={workspace} />
    ) : output.renderer === 'regional-gap' ? (
      <RegionalGapRenderer output={output} workspace={workspace} />
    ) : output.renderer === 'data-quality' ? (
      <DataQualityRenderer output={output} workspace={workspace} />
    ) : output.renderer === 'presentation' ? (
      <PresentationRenderer output={output} workspace={workspace} />
    ) : output.renderer === 'anomaly' ? (
      <AnomalyRenderer output={output} workspace={workspace} />
    ) : output.renderer === 'root-cause' ? (
      <RootCauseRenderer output={output} workspace={workspace} />
    ) : output.renderer === 'forecast' ? (
      <ForecastRenderer output={output} workspace={workspace} />
    ) : (
      <ExecutiveSummaryRenderer output={output} workspace={workspace} />
    )

  return (
    <div
      className="relative"
      style={
        {
          '--analyst-console-width': `${analystConsoleWidth}px`,
        } as React.CSSProperties
      }
    >
      <div className="min-w-0 space-y-6">
        <PresentationEntryCard onOpen={openPresentationWorkspace} output={output} />
        <WorkspaceStateBar output={output} workspace={workspace} />
        {renderer}
        <WorkspaceTimeline events={workspaceState.analysisHistory} />
        <WorkspaceCopilot output={output} workspace={workspace} />
      </div>
      {isAnalystConsoleOpen && (
        <AnalystConsole
          output={output}
          workspace={workspace}
          width={analystConsoleWidth}
          onWidthChange={setAnalystConsoleWidth}
          onClose={() => setIsAnalystConsoleOpen(false)}
        />
      )}
      {presentationModel && (
        <PresentationWorkspace
          model={presentationModel}
          selectedSlideId={selectedPresentationSlideId}
          output={output}
          workspaceState={workspaceState}
          onSelectSlide={setSelectedPresentationSlideId}
          onUpdateModel={setPresentationModel}
          onClose={() => setPresentationModel(null)}
        />
      )}
      {!isAnalystConsoleOpen && (
        <button
          type="button"
          onClick={() => setIsAnalystConsoleOpen(true)}
          className="fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 items-center gap-2 rounded-l-xl border border-r-0 border-primary/30 bg-card/95 px-3 py-4 text-sm font-medium text-primary shadow-2xl backdrop-blur transition hover:bg-primary/10 xl:flex [writing-mode:vertical-rl]"
          aria-label="Open AI Analyst Console"
        >
          <PanelRightOpen className="h-4 w-4" />
          AI Analyst
        </button>
      )}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="fixed bottom-4 right-4 z-40 xl:hidden"
        onClick={() => setIsAnalystConsoleOpen(true)}
      >
        <Sparkles className="mr-2 h-4 w-4 text-primary" />
        AI Analyst
      </Button>
      <EvidenceModal target={activeEvidence} onClose={() => setActiveEvidence(null)} />
      <WorkspaceActionModal modal={activeModal} isLoading={isModalLoading} onClose={() => setActiveModal(null)} />
    </div>
  )
}

export function AnalysisAnalystConsole({ output }: GeneratedOutputSectionProps) {
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>(() => ({
    selectedKpi: output.metrics[0]?.label || output.hero.label,
    selectedDimension: output.sections[0]?.title || 'Analysis Complete',
    selectedTimeRange: output.hero.trend || 'Current analysis',
    selectedRegion: 'All regions',
    selectedProduct: 'All products',
    analysisHistory: ['Document analysis completed', 'Recommendations prepared'],
    previousReasoning: [output.aiThinkingSummary],
  }))
  const [isAnalystConsoleOpen, setIsAnalystConsoleOpen] = useState(false)
  const [analystConsoleWidth, setAnalystConsoleWidth] = useState(400)

  useEffect(() => {
    const storedWidth = Number(window.localStorage.getItem('flowsummary:analyst-console-width'))

    if (Number.isFinite(storedWidth) && storedWidth >= 380 && storedWidth <= 640) {
      setAnalystConsoleWidth(storedWidth)
    }

    if (window.innerWidth >= 1280) {
      setIsAnalystConsoleOpen(true)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem('flowsummary:analyst-console-width', String(analystConsoleWidth))
  }, [analystConsoleWidth])

  const updateState = (patch: Partial<WorkspaceState>, event?: string) => {
    setWorkspaceState((current) => ({
      ...current,
      ...patch,
      analysisHistory: event ? [...current.analysisHistory, event].slice(-8) : current.analysisHistory,
      previousReasoning:
        event && !current.previousReasoning.includes(event)
          ? [...current.previousReasoning, event].slice(-6)
          : current.previousReasoning,
    }))
  }

  const workspace: WorkspaceInteraction = {
    state: workspaceState,
    activeEvidence: null,
    setActiveEvidence: () => undefined,
    openWorkspaceModal: () => undefined,
    requestWorkspaceModal: async () => undefined,
    updateState,
    handleMetricAction: () => undefined,
    handleSectionEvidence: () => undefined,
  }

  return (
    <>
      {isAnalystConsoleOpen ? (
        <AnalystConsole
          output={output}
          workspace={workspace}
          width={analystConsoleWidth}
          onWidthChange={setAnalystConsoleWidth}
          onClose={() => setIsAnalystConsoleOpen(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setIsAnalystConsoleOpen(true)}
          className="fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 items-center gap-2 rounded-l-xl border border-r-0 border-primary/30 bg-card/95 px-3 py-4 text-sm font-medium text-primary shadow-2xl backdrop-blur transition hover:bg-primary/10 xl:flex [writing-mode:vertical-rl]"
          aria-label="Open AI Analyst Console"
        >
          <PanelRightOpen className="h-4 w-4" />
          AI Analyst
        </button>
      )}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="fixed bottom-4 right-4 z-40 xl:hidden"
        onClick={() => setIsAnalystConsoleOpen(true)}
      >
        <Sparkles className="mr-2 h-4 w-4 text-primary" />
        AI Analyst
      </Button>
    </>
  )
}

function PresentationEntryCard({ onOpen, output }: { onOpen: () => void; output: GeneratedDocumentOutput }) {
  return (
    <Card className="border-primary/20 bg-primary/10">
      <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Presentation className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Generate Executive Presentation</p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Open an editable Presentation Workspace generated from {output.workspaceTitle}, including evidence,
              reasoning, recommendations, and speaker notes.
            </p>
          </div>
        </div>
        <Button type="button" className="bg-primary hover:bg-primary/90" onClick={onOpen}>
          Open Presentation Workspace
          <Presentation className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

function PresentationWorkspace({
  model,
  selectedSlideId,
  output,
  workspaceState,
  onSelectSlide,
  onUpdateModel,
  onClose,
}: {
  model: PresentationModel
  selectedSlideId: string | null
  output: GeneratedDocumentOutput
  workspaceState: WorkspaceState
  onSelectSlide: (id: string) => void
  onUpdateModel: (model: PresentationModel) => void
  onClose: () => void
}) {
  const [audience, setAudience] = useState<PresentationAudience>(model.audience)
  const [style, setStyle] = useState<PresentationStyle>(model.style)
  const [instruction, setInstruction] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const selectedSlide = model.slides.find((slide) => slide.id === selectedSlideId) || model.slides[0]

  const updateAudienceStyle = (nextAudience = audience, nextStyle = style) => {
    const nextModel = buildPresentationModelFromWorkspace(output, workspaceState, nextAudience, nextStyle)
    onUpdateModel(nextModel)
    onSelectSlide(nextModel.slides[0]?.id || '')
  }

  const updateSlide = (slideId: string, updater: (slide: PresentationSlideModel) => PresentationSlideModel) => {
    onUpdateModel({
      ...model,
      slides: model.slides.map((slide) => (slide.id === slideId ? updater(slide) : slide)),
    })
  }

  const runSlideAction = (action: string) => {
    if (!selectedSlide) return

    updateSlide(selectedSlide.id, (slide) => transformPresentationSlide(slide, action, output, workspaceState))
  }

  const exportPptx = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/workspace/presentation/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presentation: model }),
      })

      if (!response.ok) {
        throw new Error('Failed to export presentation.')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${model.title.replace(/[^\w-]+/g, '-').toLowerCase() || 'flowsummary-presentation'}.pptx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  const exportPdf = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/workspace/presentation/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presentation: model }),
      })

      if (!response.ok) {
        throw new Error('Failed to export presentation PDF.')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${model.title.replace(/[^\w-]+/g, '-').toLowerCase() || 'flowsummary-presentation'}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-background/85 p-3 backdrop-blur-md md:p-5">
      <Card className="mx-auto flex h-full max-w-[1680px] flex-col overflow-hidden border-primary/20 bg-card/95 shadow-2xl">
        <div className="flex shrink-0 flex-col gap-4 border-b border-border/70 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">Presentation Workspace</Badge>
            <h2 className="mt-3 text-2xl font-bold">{model.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Generated from {model.sourceWorkspace}. Edit before exporting.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <select
              value={audience}
              onChange={(event) => {
                const nextAudience = event.target.value as PresentationAudience
                setAudience(nextAudience)
                updateAudienceStyle(nextAudience, style)
              }}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {['Executive Board', 'Director', 'Manager', 'Operations Team', 'Government', 'Client', 'Investor'].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              value={style}
              onChange={(event) => {
                const nextStyle = event.target.value as PresentationStyle
                setStyle(nextStyle)
                updateAudienceStyle(audience, nextStyle)
              }}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {['Executive', 'Corporate', 'Minimal', 'Government', 'Startup', 'Financial', 'Dark', 'Light'].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <Button type="button" variant="outline" onClick={onClose}>Close</Button>
            <Button type="button" className="bg-primary hover:bg-primary/90" onClick={() => void exportPptx()} disabled={isExporting}>
              {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Export PPTX
            </Button>
            <Button type="button" variant="outline" onClick={() => void exportPdf()} disabled={isExporting}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[280px_minmax(0,1fr)_360px]">
          <div className="min-h-0 overflow-y-auto border-b border-border/70 p-4 lg:border-b-0 lg:border-r">
            <p className="mb-3 text-xs font-medium uppercase tracking-normal text-muted-foreground">Slides</p>
            <div className="space-y-2">
              {model.slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => onSelectSlide(slide.id)}
                  className={cn(
                    'w-full rounded-lg border p-3 text-left transition',
                    slide.id === selectedSlide?.id ? 'border-primary/40 bg-primary/10' : 'border-border bg-background/35 hover:bg-background/60',
                  )}
                >
                  <p className="text-xs text-muted-foreground">Slide {index + 1}</p>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold">{slide.title}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 min-w-0 overflow-y-auto border-b border-border/70 p-5 lg:border-b-0 2xl:border-r">
            {selectedSlide && (
              <div className="mx-auto max-w-5xl space-y-5">
                <div className="rounded-2xl border border-border bg-background/60 p-6 shadow-2xl md:p-8">
                  <div className="flex min-h-[520px] flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-primary">{selectedSlide.subtitle || model.sourceWorkspace}</p>
                        <h3 className="mt-3 max-w-3xl text-3xl font-bold leading-tight md:text-4xl">{selectedSlide.title}</h3>
                      </div>
                      {typeof selectedSlide.confidence === 'number' && (
                        <Badge variant="outline" className="shrink-0">{selectedSlide.confidence}% confidence</Badge>
                      )}
                    </div>
                    <div className="mt-8 grid flex-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                      <div className="min-w-0">
                        <BulletList items={selectedSlide.bullets} />
                      </div>
                      <div className="space-y-3">
                        {selectedSlide.highlights.map((highlight) => (
                          <div key={highlight} className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-foreground">
                            {highlight}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-8 grid gap-3 md:grid-cols-3">
                      <EvidenceMini label="Evidence Source" value={selectedSlide.evidence[0] || 'Workspace evidence'} />
                      <EvidenceMini label="Business Impact" value={selectedSlide.businessImpact || output.hero.verdict} />
                      <EvidenceMini label="Speaker Note" value={selectedSlide.speakerNotes.keyMessage} />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background/35 p-3">
                  <p className="mb-3 text-xs font-medium uppercase tracking-normal text-muted-foreground">Slide Actions</p>
                  <div className="flex flex-wrap gap-2">
                    {['Regenerate', 'Rewrite', 'Expand', 'Summarize', 'More Formal', 'More Technical', 'More Visual', 'Generate Chart', 'Generate Table', 'Generate Timeline', 'Generate Diagram'].map((action) => (
                      <Button key={action} type="button" variant="outline" size="sm" onClick={() => runSlideAction(action)}>
                        {action === 'Regenerate' && <RefreshCw className="mr-2 h-3.5 w-3.5" />}
                        {action}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="min-h-0 overflow-y-auto border-t border-border/70 p-4 lg:col-span-2 2xl:col-span-1 2xl:border-t-0">
            <p className="text-sm font-semibold">AI Presentation Analyst</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Uses the current slide, audience, tone, workspace findings, and evidence.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 2xl:grid-cols-1">
              {['Shorten this slide', 'Make it executive', 'Add supporting evidence', 'Replace bullets with charts', 'Generate speaker notes', 'Create better title'].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="rounded-lg border border-border bg-background/40 px-3 py-2 text-left text-sm transition hover:border-primary/40 hover:bg-primary/10"
                  onClick={() => {
                    setInstruction(prompt)
                    runSlideAction(prompt)
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
            <Textarea
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              placeholder="Ask about this slide..."
              className="mt-4 min-h-24 resize-none bg-background/60"
            />
            <Button type="button" className="mt-3 w-full bg-primary hover:bg-primary/90" onClick={() => runSlideAction(instruction || 'Rewrite')}>
              Apply to slide
            </Button>
            {selectedSlide && (
              <div className="mt-5 rounded-lg border border-border bg-background/40 p-3">
                <p className="text-xs font-medium text-muted-foreground">Speaker Notes</p>
                <p className="mt-2 text-sm leading-6">{selectedSlide.speakerNotes.keyMessage}</p>
                <BulletList items={selectedSlide.speakerNotes.emphasize} />
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

function EvidenceMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card/60 p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 line-clamp-2 text-xs font-medium">{value}</p>
    </div>
  )
}

function AnalystConsole({
  output,
  workspace,
  width,
  onWidthChange,
  onClose,
}: GeneratedOutputSectionProps & {
  workspace: WorkspaceInteraction
  width: number
  onWidthChange: (width: number) => void
  onClose: () => void
}) {
  const [messages, setMessages] = useState<AnalystMessage[]>(() => [
    buildInitialAnalystMessage(output, workspace.state),
  ])
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showCommands, setShowCommands] = useState(false)
  const [showAllQuickActions, setShowAllQuickActions] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const widthRef = useRef(width)

  useEffect(() => {
    widthRef.current = width
  }, [width])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isSending])

  const quickActions = getConsoleQuickActions(output, workspace.state)
  const commands = getSlashCommands(output.renderer)

  const submitPrompt = async (prompt: string, command?: string) => {
    const normalizedPrompt = prompt.trim()
    if (!normalizedPrompt || isSending) return

    const userMessage: AnalystMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: normalizedPrompt,
    }
    const nextMessages = [...messages, userMessage]

    setMessages(nextMessages)
    setDraft('')
    setShowCommands(false)
    setIsSending(true)

    try {
      const response = await fetch('/api/workspace/console', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: normalizedPrompt,
          command,
          workspaceState: workspace.state,
          output,
          messages: nextMessages.slice(-10),
        }),
      })
      const payload = (await response.json().catch(() => null)) as {
        message?: Omit<AnalystMessage, 'id' | 'role'> & { role?: 'assistant' }
      } | null

      if (!response.ok || !payload?.message?.content) {
        throw new Error('Unable to continue investigation.')
      }

      const assistantMessage = payload.message
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: assistantMessage.content,
          supportingEvidence: assistantMessage.supportingEvidence,
          followUps: assistantMessage.followUps,
        },
      ])
      workspace.updateState({}, `AI Analyst answered: ${normalizedPrompt}`)
    } catch {
      setMessages((current) => [
        ...current,
        buildFallbackAnalystMessage(normalizedPrompt, output, workspace.state),
      ])
    } finally {
      setIsSending(false)
    }
  }

  const startResize = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    const startX = event.clientX
    const startWidth = widthRef.current

    const onMove = (moveEvent: MouseEvent) => {
      const nextWidth = Math.min(640, Math.max(380, startWidth - (moveEvent.clientX - startX)))
      onWidthChange(nextWidth)
    }

    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <aside
      className="fixed inset-y-0 right-0 z-50 w-[min(100vw,var(--analyst-console-width))] animate-in slide-in-from-right-4 duration-300"
      style={{ '--analyst-console-width': `${width}px` } as React.CSSProperties}
    >
      <div
        className="absolute left-0 top-0 z-20 hidden h-full w-4 -translate-x-1/2 cursor-col-resize items-center justify-center xl:flex"
        onMouseDown={startResize}
        aria-hidden="true"
      >
        <div className="flex h-12 w-5 items-center justify-center rounded-full border border-border bg-card/95 shadow-lg">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
      <Card className="flex h-dvh w-full flex-col overflow-hidden rounded-none rounded-l-2xl border-y-0 border-r-0 border-primary/20 bg-card/95 shadow-2xl backdrop-blur-xl">
        <CardHeader className="shrink-0 border-b border-border/70 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">AI Analyst</CardTitle>
              </div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Continue your investigation with context-aware AI.
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Close AI Analyst Console">
              <X className="h-4 w-4 xl:hidden" />
              <PanelRightClose className="hidden h-4 w-4 xl:block" />
            </Button>
          </div>
        </CardHeader>

        <div className="shrink-0 border-b border-border/70 bg-card/95 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              className="flex items-center gap-1 text-xs font-medium uppercase tracking-normal text-muted-foreground transition hover:text-foreground"
              onClick={() => setShowAllQuickActions((current) => !current)}
            >
              Quick Actions
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showAllQuickActions && 'rotate-180')} />
            </button>
            <span className="text-[11px] text-muted-foreground">
              {showAllQuickActions ? quickActions.length : Math.min(3, quickActions.length)} shown
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(showAllQuickActions ? quickActions : quickActions.slice(0, 3)).map((action) => (
              <button
                key={action.command}
                type="button"
                onClick={() => void submitPrompt(action.prompt, action.command)}
                className="rounded-full border border-border bg-background/45 px-3 py-1.5 text-xs text-foreground transition hover:border-primary/40 hover:bg-primary/10"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((message) => (
            <AnalystMessageBubble
              key={message.id}
              message={message}
              onFollowUp={(followUp) => void submitPrompt(followUp)}
            />
          ))}
          {isSending && (
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-muted-foreground">
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin text-primary" />
              Continuing the investigation with current workspace context...
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border/70 bg-card/95 p-4">
          {showCommands && (
            <div className="mb-3 max-h-52 overflow-y-auto rounded-lg border border-border bg-background/95 p-2 shadow-xl">
              {commands.map((command) => (
                <button
                  key={command.command}
                  type="button"
                  onClick={() => void submitPrompt(command.prompt, command.command)}
                  className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm transition hover:bg-primary/10"
                >
                  <span className="font-medium text-primary">{command.command}</span>
                  <span className="text-muted-foreground">{command.label}</span>
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value)
                setShowCommands(event.target.value.trim().startsWith('/'))
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  void submitPrompt(draft)
                }
              }}
              placeholder="Ask about this investigation..."
              className="min-h-20 resize-none bg-background/60"
            />
            <Button
              type="button"
              className="self-end bg-primary hover:bg-primary/90"
              size="icon"
              disabled={!draft.trim() || isSending}
              onClick={() => void submitPrompt(draft)}
              aria-label="Send investigation question"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </Card>
    </aside>
  )
}

function ConsoleContextPanel({
  output,
  state,
  expanded,
  onToggle,
}: GeneratedOutputSectionProps & {
  state: WorkspaceState
  expanded: boolean
  onToggle: () => void
}) {
  const context = [
    ['Current Workspace', output.workspaceTitle],
    ['Current KPI', state.selectedKpi],
    ['Current Region', state.selectedRegion],
    ['Current Time', state.selectedTimeRange],
    ['Current Filters', `${state.selectedDimension}, ${state.selectedProduct}`],
  ]

  return (
    <div className="mt-3 rounded-lg border border-border/70 bg-background/45 p-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={onToggle}
        >
          <span className="text-xs font-medium text-primary">Current Context</span>
          <span className="min-w-0 truncate text-xs text-muted-foreground">
            {output.workspaceTitle} / {state.selectedKpi} / {state.selectedDimension}
          </span>
          <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
        </button>
        <Badge variant="outline" className="shrink-0 border-primary/20 bg-primary/10 text-primary">Live</Badge>
      </div>
      {expanded && (
        <div className="mt-3 grid gap-2">
          {context.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[0.85fr_1fr] gap-3 text-xs">
              <span className="text-muted-foreground">{label}</span>
              <span className="truncate font-medium text-foreground">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AnalystMessageBubble({
  message,
  onFollowUp,
}: {
  message: AnalystMessage
  onFollowUp: (followUp: string) => void
}) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('rounded-lg border p-3', isUser ? 'ml-8 border-border bg-background/45' : 'mr-3 border-primary/20 bg-primary/10')}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{isUser ? 'You' : 'AI Analyst'}</p>
        {!isUser && <Sparkles className="h-3.5 w-3.5 text-primary" />}
      </div>
      <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{message.content}</p>
      {!isUser && message.supportingEvidence && message.supportingEvidence.length > 0 && (
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {message.supportingEvidence.map((item) => (
            <div key={`${item.label}-${item.value}`} className="rounded-md border border-border/70 bg-background/45 p-2">
              <p className="text-[11px] text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-sm font-semibold">{item.value}</p>
            </div>
          ))}
        </div>
      )}
      {!isUser && message.followUps && message.followUps.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {message.followUps.map((followUp) => (
            <button
              key={followUp}
              type="button"
              onClick={() => onFollowUp(followUp)}
              className="rounded-full border border-primary/20 bg-background/45 px-2.5 py-1 text-xs text-primary transition hover:bg-primary/10"
            >
              {followUp}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ProactiveRecommendation({
  output,
  workspace,
  onSelect,
}: GeneratedOutputSectionProps & {
  workspace: WorkspaceInteraction
  onSelect: (prompt: string) => void
}) {
  const signal = output.metrics.find((metric) => metric.risk === 'High' || metric.risk === 'Critical') || output.metrics[0]
  if (!signal) return null

  return (
    <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        <div>
          <p className="text-sm font-medium">Opportunity detected</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {signal.label} is connected to the current {workspace.state.selectedDimension} context. Investigating it may reduce decision uncertainty.
          </p>
          <button
            type="button"
            onClick={() => onSelect(`Investigate ${signal.label} using current workspace context.`)}
            className="mt-3 rounded-full border border-amber-300/30 px-3 py-1 text-xs text-amber-200 transition hover:bg-amber-300/10"
          >
            Investigate signal
          </button>
        </div>
      </div>
    </div>
  )
}

function WorkspaceHeader({
  output,
  icon,
  label,
}: {
  output: GeneratedDocumentOutput
  icon: React.ReactNode
  label: string
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border/60 pb-6 md:flex-row md:items-start md:justify-between">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            {icon}
          </span>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
            {label}
          </Badge>
        </div>
        <div>
          <p className="text-sm font-medium text-primary">{output.workspaceTitle}</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">{output.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{output.purpose}</p>
        </div>
        <HeroCard output={output} />
      </div>
      <CopyOutputButton output={output} />
    </div>
  )
}

function WorkspaceStateBar({
  output,
  workspace,
}: {
  output: GeneratedDocumentOutput
  workspace: WorkspaceInteraction
}) {
  const dimensions = Array.from(
    new Set([
      output.sections[0]?.title,
      ...output.sections.map((section) => section.title),
      ...output.metrics.flatMap((metric) => metric.sourceFields || []),
    ].filter(Boolean)),
  ).slice(0, 6)

  return (
    <Card className="bg-card/70 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">Workspace State</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline">KPI: {workspace.state.selectedKpi}</Badge>
            <Badge variant="outline">Dimension: {workspace.state.selectedDimension}</Badge>
            <Badge variant="outline">Time: {workspace.state.selectedTimeRange}</Badge>
            <Badge variant="outline">Region: {workspace.state.selectedRegion}</Badge>
            <Badge variant="outline">Product: {workspace.state.selectedProduct}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {dimensions.slice(0, 4).map((dimension) => (
            <Button
              key={dimension}
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                workspace.updateState(
                  { selectedDimension: dimension },
                  `Filter changed: Dimension = ${dimension}`,
                )
              }
            >
              {dimension}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  )
}

function WorkspaceTimeline({ events }: { events: string[] }) {
  return (
    <Card className="bg-card/70">
      <CardHeader>
        <CardTitle className="text-base">Analysis Timeline</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {events.map((event, index) => (
          <div key={`${event}-${index}`} className="flex gap-3 rounded-lg border border-border/70 bg-background/40 p-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
              {index + 1}
            </span>
            <p className="text-sm leading-6 text-muted-foreground">{event}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function WorkspaceCopilot({
  output,
  workspace,
}: {
  output: GeneratedDocumentOutput
  workspace: WorkspaceInteraction
}) {
  const nextAction = output.nextAnalyses[0]

  return (
    <Card className="border-primary/20 bg-primary/10">
      <CardHeader>
        <CardTitle className="text-base">AI Analyst Copilot</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-lg border border-primary/20 bg-background/50 p-4">
          <p className="text-sm leading-6 text-foreground">
            I am using <span className="font-medium">{workspace.state.selectedKpi}</span> with{' '}
            <span className="font-medium">{workspace.state.selectedDimension}</span> as the active investigation context.
            The next best action is {nextAction ? <span className="font-medium">{nextAction.title}</span> : 'to continue exploring the strongest signal'}.
          </p>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            I will preserve the current region, product, time range, and previous reasoning when you open another workspace.
          </p>
        </div>
        <div className="grid gap-2">
          {['Explain current KPI', 'Show evidence', 'Recommend next workspace'].map((item) => (
            <Button
              key={item}
              type="button"
              variant="outline"
              className="justify-start"
              onClick={() => {
                workspace.updateState(
                  {},
                  `Copilot requested: ${item}`,
                )
                if (item === 'Show evidence') {
                  const metric = output.metrics.find((candidate) => candidate.label === workspace.state.selectedKpi) || output.metrics[0]
                  if (metric) {
                    const evidence = metricToEvidence(metric, output)
                    void workspace.requestWorkspaceModal(
                      {
                        triggerType: 'evidence',
                        triggerLabel: item,
                        metric,
                        evidence,
                      },
                      buildEvidenceActionModal(evidence, workspace.state),
                    )
                  }
                  return
                }
                void workspace.requestWorkspaceModal(
                  {
                    triggerType: 'copilot',
                    triggerLabel: item,
                  },
                  buildCopilotModal(item, output, workspace.state),
                )
              }}
            >
              {item}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function EvidenceModal({
  target,
  onClose,
}: {
  target: EvidenceTarget | null
  onClose: () => void
}) {
  if (!target) return null

  return (
    <ModalFrame onClose={onClose}>
      <CardHeader>
        <CardTitle className="text-base">Evidence Layer: {target.title}</CardTitle>
        <p className="mt-2 text-sm text-muted-foreground">{target.reasoningSummary}</p>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-4">
        <EvidenceBlock label="Confidence" value={typeof target.confidence === 'number' ? `${target.confidence}%` : 'Contextual'} />
        <EvidenceBlock label="Affected Records" value={target.affectedRecords || 'Source-dependent'} />
        <EvidenceList label="Source Fields" items={target.sourceFields} />
        <EvidenceList label="Evidence" items={target.evidence} />
      </CardContent>
    </ModalFrame>
  )
}

function EvidenceBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/40 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  )
}

function EvidenceList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/40 p-4 md:col-span-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <ul className="mt-2 space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <li key={item} className="text-sm leading-5 text-foreground">
              {item}
            </li>
          ))
        ) : (
          <li className="text-sm text-muted-foreground">Evidence will appear after source rows are available.</li>
        )}
      </ul>
    </div>
  )
}

function WorkspaceActionModal({
  modal,
  isLoading,
  onClose,
}: {
  modal: WorkspaceModal | null
  isLoading: boolean
  onClose: () => void
}) {
  if (!modal) return null

  return (
    <ModalFrame onClose={onClose}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
            {modal.label}
          </Badge>
          {isLoading && (
            <Badge variant="outline" className="border-border/70 bg-background/40 text-muted-foreground">
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Generating with AI
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl">{modal.title}</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">{modal.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {modal.answer && (
          <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
            <p className="text-sm leading-7 text-foreground">{modal.answer}</p>
          </div>
        )}
        {modal.blocks.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {modal.blocks.map((block) => (
              <div key={block.title} className="rounded-lg border border-border/70 bg-background/40 p-4">
                <h3 className="font-semibold">{block.title}</h3>
                <BulletList items={block.items} />
              </div>
            ))}
          </div>
        )}
        {modal.primaryAction && (
          <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
            <p className="text-xs font-medium uppercase tracking-normal text-primary">Generated Action</p>
            <p className="mt-2 text-sm leading-6 text-foreground">{modal.primaryAction}</p>
          </div>
        )}
      </CardContent>
    </ModalFrame>
  )
}

function ModalFrame({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <Card className="max-h-[86vh] w-full max-w-4xl overflow-auto border-primary/20 bg-card shadow-2xl">
        <div className="sticky top-0 z-10 flex justify-end border-b border-border/70 bg-card/95 p-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        {children}
      </Card>
    </div>
  )
}

function ExecutiveDashboardRenderer({ output, workspace }: RendererProps) {
  return (
    <OutputShell>
      <WorkspaceHeader output={output} icon={<BarChart3 className="h-5 w-5" />} label="Executive Dashboard" />
      <StatusStrip output={output} />
      <MetricGrid metrics={output.metrics} columns="lg:grid-cols-4" onAction={workspace.handleMetricAction} />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-primary/20 bg-card/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-primary" />
              Performance View
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <DashboardBars sections={output.sections.slice(0, 2)} />
          </CardContent>
        </Card>
        <ActionPanel actions={output.actions} title="Priority Actions" workspace={workspace} />
      </div>
      <SectionGrid sections={output.sections.slice(2)} variant="dashboard" onEvidence={workspace.handleSectionEvidence} />
      <NextAnalysisPanel items={output.nextAnalyses} workspace={workspace} />
      <FollowUpQuestions items={output.followUpQuestions} workspace={workspace} output={output} />
    </OutputShell>
  )
}

function RegionalGapRenderer({ output, workspace }: RendererProps) {
  return (
    <OutputShell>
      <WorkspaceHeader output={output} icon={<Map className="h-5 w-5" />} label="Regional Gap Analysis" />
      <StatusStrip output={output} />
      <MetricGrid metrics={output.metrics} columns="md:grid-cols-3" onAction={workspace.handleMetricAction} />
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <InvestigationTimeline sections={output.sections.slice(0, 4)} />
        <EvidenceBoard sections={output.sections.slice(4)} onEvidence={workspace.handleSectionEvidence} />
      </div>
      <ActionPanel actions={output.actions} title="Recommended Actions" workspace={workspace} />
      <NextAnalysisPanel items={output.nextAnalyses} workspace={workspace} />
      <FollowUpQuestions items={output.followUpQuestions} workspace={workspace} output={output} />
    </OutputShell>
  )
}

function DataQualityRenderer({ output, workspace }: RendererProps) {
  return (
    <OutputShell>
      <WorkspaceHeader output={output} icon={<ShieldCheck className="h-5 w-5" />} label="Data Quality Audit" />
      <StatusStrip output={output} />
      <MetricGrid metrics={output.metrics} columns="lg:grid-cols-4" onAction={workspace.handleMetricAction} />
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <AuditChecklist sections={output.sections.filter((section) => section.title.toLowerCase().includes('checklist') || section.title.toLowerCase().includes('strategy'))} />
        <SectionGrid sections={output.sections.filter((section) => !section.title.toLowerCase().includes('checklist') && !section.title.toLowerCase().includes('strategy'))} variant="audit" onEvidence={workspace.handleSectionEvidence} />
      </div>
      <ActionPanel actions={output.actions} title="Implementation Steps" workspace={workspace} />
      <NextAnalysisPanel items={output.nextAnalyses} workspace={workspace} />
      <FollowUpQuestions items={output.followUpQuestions} workspace={workspace} output={output} />
    </OutputShell>
  )
}

function ExecutiveSummaryRenderer({ output, workspace }: RendererProps) {
  return (
    <OutputShell>
      <WorkspaceHeader output={output} icon={<FileText className="h-5 w-5" />} label="Executive Summary" />
      <StatusStrip output={output} />
      <MetricGrid metrics={output.metrics} columns="md:grid-cols-3" onAction={workspace.handleMetricAction} />
      <div className="grid gap-4">
        {output.sections.map((section, index) => (
          <NarrativeSection key={section.id} section={section} index={index} onEvidence={workspace.handleSectionEvidence} />
        ))}
      </div>
      <ActionPanel actions={output.actions} title="Decision Follow-up" workspace={workspace} />
      <NextAnalysisPanel items={output.nextAnalyses} workspace={workspace} />
      <FollowUpQuestions items={output.followUpQuestions} workspace={workspace} output={output} />
    </OutputShell>
  )
}

function PresentationRenderer({ output, workspace }: RendererProps) {
  const slides = output.slides || []

  return (
    <OutputShell>
      <WorkspaceHeader output={output} icon={<Presentation className="h-5 w-5" />} label="Presentation Workspace" />
      <StatusStrip output={output} />
      <MetricGrid metrics={output.metrics} columns="md:grid-cols-2" onAction={workspace.handleMetricAction} />
      <div className="grid gap-4 lg:grid-cols-2">
        {slides.map((slide, index) => (
          <SlidePreview key={`${slide.title}-${index}`} slide={slide} index={index} />
        ))}
      </div>
      <SectionGrid sections={output.sections} variant="presentation" onEvidence={workspace.handleSectionEvidence} />
      <ActionPanel actions={output.actions} title="Export Preparation" workspace={workspace} />
      <NextAnalysisPanel items={output.nextAnalyses} workspace={workspace} />
      <FollowUpQuestions items={output.followUpQuestions} workspace={workspace} output={output} />
    </OutputShell>
  )
}

function AnomalyRenderer({ output, workspace }: RendererProps) {
  return (
    <OutputShell>
      <WorkspaceHeader output={output} icon={<AlertTriangle className="h-5 w-5" />} label="Anomaly Detection" />
      <StatusStrip output={output} />
      <MetricGrid metrics={output.metrics} columns="md:grid-cols-3" onAction={workspace.handleMetricAction} />
      <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
        <SeverityPanel metrics={output.metrics} />
        <SectionGrid sections={output.sections} variant="anomaly" onEvidence={workspace.handleSectionEvidence} />
      </div>
      <ActionPanel actions={output.actions} title="Suggested Investigation" workspace={workspace} />
      <NextAnalysisPanel items={output.nextAnalyses} workspace={workspace} />
      <FollowUpQuestions items={output.followUpQuestions} workspace={workspace} output={output} />
    </OutputShell>
  )
}

function RootCauseRenderer({ output, workspace }: RendererProps) {
  return (
    <OutputShell>
      <WorkspaceHeader output={output} icon={<Search className="h-5 w-5" />} label="Root Cause Analysis" />
      <StatusStrip output={output} />
      <MetricGrid metrics={output.metrics} columns="md:grid-cols-2" onAction={workspace.handleMetricAction} />
      <CauseMap sections={output.sections} />
      <ActionPanel actions={output.actions} title="Recommended Actions" workspace={workspace} />
      <NextAnalysisPanel items={output.nextAnalyses} workspace={workspace} />
      <FollowUpQuestions items={output.followUpQuestions} workspace={workspace} output={output} />
    </OutputShell>
  )
}

function ForecastRenderer({ output, workspace }: RendererProps) {
  return (
    <OutputShell>
      <WorkspaceHeader output={output} icon={<TrendingUp className="h-5 w-5" />} label="Forecast Workspace" />
      <StatusStrip output={output} />
      <MetricGrid metrics={output.metrics} columns="md:grid-cols-3" onAction={workspace.handleMetricAction} />
      <Card className="border-primary/20 bg-card/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Trend Projection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ForecastLanes sections={output.sections} />
        </CardContent>
      </Card>
      <ActionPanel actions={output.actions} title="Suggested Preparation" workspace={workspace} />
      <NextAnalysisPanel items={output.nextAnalyses} workspace={workspace} />
      <FollowUpQuestions items={output.followUpQuestions} workspace={workspace} output={output} />
    </OutputShell>
  )
}

function OutputShell({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6 pb-10">{children}</div>
}

function StatusStrip({ output }: GeneratedOutputSectionProps) {
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
      <p className="text-xs font-medium uppercase tracking-normal text-primary">AI Thinking Summary</p>
      <p className="mt-2 text-sm leading-6 text-foreground">{output.aiThinkingSummary}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline" className="bg-background/40">{output.insightTitle}</Badge>
        <span>{output.statusLine}</span>
      </div>
    </div>
  )
}

function MetricGrid({
  metrics,
  columns = 'md:grid-cols-2',
  onAction,
}: {
  metrics: OutputMetric[]
  columns?: string
  onAction: (action: string, metric: OutputMetric) => void
}) {
  if (metrics.length === 0) return null

  return (
    <div className={cn('grid gap-3', columns)}>
      {metrics.map((metric) => (
        <Card key={`${metric.label}-${metric.value}`} className={cn('bg-card/70 p-4', metricToneClass(metric.tone))}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">{metric.label}</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{metric.value}</p>
            </div>
            {metric.risk && <Badge variant="outline">{metric.risk} Risk</Badge>}
          </div>
          {(metric.interpretation || metric.detail) && (
            <p className="mt-3 text-sm leading-6 text-foreground">{metric.interpretation || metric.detail}</p>
          )}
          <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
            {metric.trend && (
              <div className="flex items-center justify-between gap-3">
                <span>Trend</span>
                <span className="text-foreground">{metric.trend}</span>
              </div>
            )}
            {typeof metric.confidence === 'number' && (
              <div className="flex items-center justify-between gap-3">
                <span>Confidence</span>
                <span className="text-foreground">{metric.confidence}%</span>
              </div>
            )}
          </div>
          {metric.suggestedAction && (
            <p className="mt-4 rounded-lg border border-border/70 bg-background/40 p-3 text-xs leading-5 text-muted-foreground">
              {metric.suggestedAction}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {['Explore', 'Compare', 'Forecast', 'Explain', 'Drill Down', 'View Evidence'].map((action) => (
              <Button
                key={action}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onAction(action, metric)}
              >
                {action}
              </Button>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}

function HeroCard({ output }: GeneratedOutputSectionProps) {
  const hero = output.hero

  return (
    <Card className={cn('mt-5 max-w-3xl border-primary/20 bg-gradient-to-br from-primary/15 via-card/80 to-card p-5', heroToneClass(hero.risk))}>
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-normal text-primary">{hero.label}</p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <p className="text-4xl font-bold leading-none text-foreground md:text-5xl">{hero.value}</p>
            <Badge variant="outline" className="mb-1 border-primary/30 bg-background/40">
              {hero.verdict}
            </Badge>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{hero.detail}</p>
        </div>
        <div className="grid min-w-44 gap-2 rounded-lg border border-border/70 bg-background/40 p-3 text-xs">
          {hero.trend && (
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Trend</span>
              <span className="text-foreground">{hero.trend}</span>
            </div>
          )}
          {hero.risk && (
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Risk</span>
              <span className="text-foreground">{hero.risk}</span>
            </div>
          )}
          {typeof hero.confidence === 'number' && (
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Confidence</span>
              <span className="text-foreground">{hero.confidence}%</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

function SectionGrid({
  sections,
  variant,
  onEvidence,
}: {
  sections: OutputSection[]
  variant: 'dashboard' | 'audit' | 'presentation' | 'anomaly'
  onEvidence: (section: OutputSection) => void
}) {
  if (sections.length === 0) return null

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {sections.map((section) => (
        <Card key={section.id} className={cn('bg-card/60', variant === 'audit' && 'border-amber-400/20', variant === 'anomaly' && 'border-destructive/20')}>
          <CardHeader>
            <CardTitle className="text-base">{section.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <BulletList items={section.items} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => onEvidence(section)}
            >
              View Evidence
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function DashboardBars({ sections }: { sections: OutputSection[] }) {
  const rows = sections.flatMap((section) => section.items.map((item, index) => ({ label: item, value: 88 - index * 11 }))).slice(0, 6)

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.label} className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="line-clamp-1 text-foreground">{row.label}</span>
            <span className="text-muted-foreground">{row.value}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${row.value}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function InvestigationTimeline({ sections }: { sections: OutputSection[] }) {
  return (
    <Card className="bg-card/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Investigation Path
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {sections.map((section, index) => (
          <div key={section.id} className="relative pl-8">
            <span className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
              {index + 1}
            </span>
            <h3 className="font-semibold">{section.title}</h3>
            <BulletList items={section.items} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function EvidenceBoard({
  sections,
  onEvidence,
}: {
  sections: OutputSection[]
  onEvidence: (section: OutputSection) => void
}) {
  return (
    <div className="grid gap-4">
      {sections.map((section) => (
        <Card key={section.id} className="bg-card/60">
          <CardHeader>
            <CardTitle className="text-base">{section.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <BulletList items={section.items} />
            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => onEvidence(section)}>
              View Evidence
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function AuditChecklist({ sections }: { sections: OutputSection[] }) {
  return (
    <Card className="bg-card/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-primary" />
          Validation Checklist
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sections.flatMap((section) => section.items).map((item) => (
          <div key={item} className="flex gap-3 rounded-lg border border-border/70 bg-background/40 p-3">
            <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm leading-6 text-foreground">{item}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function NarrativeSection({
  section,
  index,
  onEvidence,
}: {
  section: OutputSection
  index: number
  onEvidence: (section: OutputSection) => void
}) {
  return (
    <Card className="bg-card/65">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-xs font-semibold text-primary">
            {index + 1}
          </span>
          <CardTitle className="text-base">{section.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <BulletList items={section.items} />
        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => onEvidence(section)}>
          View Evidence
        </Button>
      </CardContent>
    </Card>
  )
}

function SlidePreview({ slide, index }: { slide: OutputSlide; index: number }) {
  return (
    <Card className="min-h-56 border-primary/20 bg-gradient-to-br from-card to-primary/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="outline">Slide {index + 1}</Badge>
          <Presentation className="h-4 w-4 text-primary" />
        </div>
        <CardTitle className="text-xl">{slide.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <BulletList items={slide.bullets} />
        {slide.speakerNote && (
          <p className="mt-4 rounded-lg border border-border/70 bg-background/40 p-3 text-xs leading-5 text-muted-foreground">
            {slide.speakerNote}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function SeverityPanel({ metrics }: { metrics: OutputMetric[] }) {
  return (
    <Card className="border-destructive/20 bg-destructive/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Severity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border border-border/70 bg-background/50 p-3">
            <p className="text-xs text-muted-foreground">{metric.label}</p>
            <p className="mt-1 text-xl font-bold">{metric.value}</p>
            {metric.detail && <p className="mt-1 text-xs leading-5 text-muted-foreground">{metric.detail}</p>}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function CauseMap({ sections }: { sections: OutputSection[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {sections.map((section, index) => (
        <Card key={section.id} className={cn('bg-card/65', index === 0 && 'border-primary/30', section.title.toLowerCase().includes('cause') && 'border-amber-400/30')}>
          <CardHeader>
            <CardTitle className="text-base">{section.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <BulletList items={section.items} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ForecastLanes({ sections }: { sections: OutputSection[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {sections.map((section) => (
        <div key={section.id} className="rounded-xl border border-border/70 bg-background/40 p-4">
          <h3 className="font-semibold">{section.title}</h3>
          <div className="mt-4 h-1.5 rounded-full bg-muted">
            <div className="h-full w-2/3 rounded-full bg-primary" />
          </div>
          <BulletList items={section.items} />
        </div>
      ))}
    </div>
  )
}

function ActionPanel({
  actions,
  title,
  workspace,
}: {
  actions: OutputAction[]
  title: string
  workspace: WorkspaceInteraction
}) {
  if (actions.length === 0) return null

  return (
    <Card className="bg-card/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Check className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        {actions.map((action) => (
          <button
            key={`${action.title}-${action.detail}`}
            type="button"
            className="rounded-lg border border-border/70 bg-background/40 p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/10"
            onClick={() => {
              const statePatch = { selectedDimension: action.title }
              const nextState = { ...workspace.state, ...statePatch }
              workspace.updateState(statePatch, `${action.title} queued from ${title}`)
              void workspace.requestWorkspaceModal(
                {
                  triggerType: 'recommended-action',
                  triggerLabel: action.title,
                  action,
                },
                buildRecommendedActionModal(action, nextState),
                undefined,
                nextState,
              )
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">{action.title}</h3>
              {action.priority && <Badge variant="outline">{action.priority}</Badge>}
            </div>
            {action.owner && <p className="mt-2 text-xs text-muted-foreground">Owner: {action.owner}</p>}
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{action.detail}</p>
          </button>
        ))}
      </CardContent>
    </Card>
  )
}

function NextAnalysisPanel({
  items,
  workspace,
}: {
  items: NextAnalysis[]
  workspace: WorkspaceInteraction
}) {
  if (items.length === 0) return null

  return (
    <Card className="border-primary/20 bg-primary/10">
      <CardHeader>
        <CardTitle className="text-base">Suggested Next Analysis</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <button
            key={`${item.title}-${item.reason}`}
            type="button"
            className="rounded-lg border border-primary/20 bg-background/50 p-4 text-left transition-colors hover:border-primary/50 hover:bg-primary/15"
            onClick={() => {
              const statePatch = { selectedDimension: item.title }
              const nextState = { ...workspace.state, ...statePatch }
              workspace.updateState(statePatch, `Next investigation selected: ${item.title}`)
              void workspace.requestWorkspaceModal(
                {
                  triggerType: 'next-analysis',
                  triggerLabel: item.title,
                  nextAnalysis: item,
                },
                buildNextAnalysisModal(item, nextState),
                undefined,
                nextState,
              )
            }}
          >
            <p className="font-semibold text-foreground">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.reason}</p>
          </button>
        ))}
      </CardContent>
    </Card>
  )
}

function FollowUpQuestions({
  items,
  workspace,
  output,
}: {
  items: string[]
  workspace: WorkspaceInteraction
  output: GeneratedDocumentOutput
}) {
  if (items.length === 0) return null

  return (
    <Card className="bg-card/70">
      <CardHeader>
        <CardTitle className="text-base">Possible Follow-up Questions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            className="rounded-lg border border-border/70 bg-background/40 p-4 text-left text-sm leading-6 text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10"
            onClick={() => {
              workspace.updateState({}, `Follow-up opened: ${item}`)
              void workspace.requestWorkspaceModal(
                {
                  triggerType: 'follow-up-question',
                  triggerLabel: item,
                  question: item,
                },
                buildFollowUpModal(item, output, workspace.state),
              )
            }}
          >
            {item}
          </button>
        ))}
      </CardContent>
    </Card>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm leading-6 text-muted-foreground">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function CopyOutputButton({ output }: GeneratedOutputSectionProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const text = stringifyOutput(output)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="outline" onClick={handleCopy} className="w-fit">
      {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
      {copied ? 'Copied' : 'Copy Output'}
    </Button>
  )
}

function stringifyOutput(output: GeneratedDocumentOutput) {
  const sections = output.sections
    .map((section) => `${section.title}\n${section.items.map((item) => `- ${item}`).join('\n')}`)
    .join('\n\n')
  const actions = output.actions
    .map((action) => `- ${action.title}: ${action.detail}`)
    .join('\n')
  const next = output.nextAnalyses
    .map((item) => `- ${item.title}: ${item.reason}`)
    .join('\n')

  return `${output.workspaceTitle}\n${output.title}\n${output.purpose}\n\n${output.aiThinkingSummary}\n\n${sections}\n\nActions\n${actions}\n\nSuggested Next Analysis\n${next}`
}

function buildPresentationModelFromWorkspace(
  output: GeneratedDocumentOutput,
  state: WorkspaceState,
  audience: PresentationAudience,
  style: PresentationStyle,
): PresentationModel {
  const confidence = output.hero.confidence || output.metrics[0]?.confidence || 82
  const evidence = [
    output.aiThinkingSummary,
    ...output.metrics.flatMap((metric) => metric.evidence || []),
    ...output.sections.flatMap((section) => section.evidence || []),
  ].filter(Boolean)
  const findings = output.sections.flatMap((section) => section.items).filter(Boolean)
  const actions = output.actions.map((action) => `${action.title}: ${action.detail}`)
  const hasCause = output.renderer === 'root-cause' || output.sections.some((section) => section.title.toLowerCase().includes('cause'))
  const hasForecast = output.renderer === 'forecast'

  const baseSlides: PresentationSlideModel[] = [
    presentationSlide('executive-summary', 'Executive Summary', output.workspaceTitle, [
      output.hero.verdict,
      output.statusLine,
      `Recommended next decision: ${output.actions[0]?.title || output.nextAnalyses[0]?.title || 'Continue investigation'}.`,
    ], [output.hero.value, output.hero.label], confidence, evidence, output.hero.detail),
    presentationSlide('business-context', 'Business Context', `${audience} view`, [
      `Current workspace: ${output.workspaceTitle}.`,
      `Active KPI: ${state.selectedKpi}.`,
      `Investigation context: ${state.selectedDimension}.`,
    ], [state.selectedRegion, state.selectedTimeRange], confidence, evidence, output.purpose),
    presentationSlide('key-findings', 'Key Findings', output.insightTitle, findings.slice(0, 4), output.metrics.slice(0, 3).map((metric) => `${metric.label}: ${metric.value}`), confidence, evidence, output.statusLine),
    presentationSlide('evidence', 'Evidence', 'Explainable signals', evidence.slice(0, 4), output.metrics.flatMap((metric) => metric.sourceFields || []).slice(0, 3), confidence, evidence, 'Evidence is attached from the current Living Workspace.'),
    presentationSlide('root-cause', 'Root Cause', 'Likely explanation', (hasCause ? findings : [output.aiThinkingSummary]).slice(0, 4), [output.hero.verdict], confidence, evidence, output.hero.detail),
    presentationSlide('business-impact', 'Business Impact', 'Decision relevance', [
      output.hero.detail,
      output.metrics[0]?.interpretation || output.metrics[0]?.detail || output.statusLine,
      `Risk level: ${output.hero.risk || output.metrics[0]?.risk || 'Contextual'}.`,
    ], [output.hero.value], confidence, evidence, output.statusLine),
    presentationSlide('recommendations', 'Recommendations', 'Best next moves', actions.slice(0, 4), output.actions.map((action) => action.priority || 'Medium').slice(0, 3), confidence, evidence, output.actions[0]?.detail),
    presentationSlide('action-plan', 'Action Plan', 'Ownership and timeline', output.actions.slice(0, 4).map((action) => `${action.priority || 'Medium'} priority - ${action.owner || 'Assign owner'} - ${action.title}`), ['Owner', 'Timeline', 'Expected KPI'], confidence, evidence, output.actions[0]?.detail),
    presentationSlide('expected-outcome', 'Expected Outcome', hasForecast ? 'Forecast implication' : 'Decision target', [
      output.nextAnalyses[0]?.reason || 'Reduce uncertainty through the next investigation.',
      'Validate evidence before external presentation.',
      'Convert accepted recommendations into accountable actions.',
    ], [output.nextAnalyses[0]?.title || 'Next workspace'], confidence, evidence, output.statusLine),
    presentationSlide('next-investigation', 'Next Investigation', 'Continuous analysis', output.nextAnalyses.slice(0, 4).map((item) => `${item.title}: ${item.reason}`), output.followUpQuestions.slice(0, 3), confidence, evidence, output.nextAnalyses[0]?.reason),
  ]

  return {
    title: `${output.workspaceTitle} Presentation`,
    audience,
    style,
    sourceWorkspace: output.workspaceTitle,
    generatedFrom: state.selectedDimension,
    slides: baseSlides.filter((slide) => {
      if (slide.id === 'root-cause' && !hasCause && output.renderer !== 'anomaly') return false
      if (slide.id === 'expected-outcome' && !hasForecast && output.nextAnalyses.length === 0) return false
      return slide.bullets.length > 0
    }),
  }
}

function presentationSlide(
  id: string,
  title: string,
  subtitle: string,
  bullets: string[],
  highlights: string[],
  confidence: number,
  evidence: string[],
  businessImpact?: string,
): PresentationSlideModel {
  const cleanBullets = bullets.map((item) => item?.trim()).filter(Boolean).slice(0, 5)

  return {
    id,
    title,
    subtitle,
    bullets: cleanBullets,
    highlights: highlights.map((item) => item?.trim()).filter(Boolean).slice(0, 3),
    confidence,
    evidence: evidence.slice(0, 4),
    businessImpact,
    speakerNotes: {
      keyMessage: cleanBullets[0] || title,
      emphasize: cleanBullets.slice(0, 3),
      possibleQuestions: ['What evidence supports this?', 'What decision is required?', 'What should happen next?'],
      suggestedAnswers: evidence.slice(0, 3),
    },
  }
}

function transformPresentationSlide(
  slide: PresentationSlideModel,
  action: string,
  output: GeneratedDocumentOutput,
  state: WorkspaceState,
): PresentationSlideModel {
  const normalizedAction = action.toLowerCase()
  const evidenceLine = slide.evidence[0] || output.aiThinkingSummary

  if (normalizedAction.includes('shorten') || normalizedAction.includes('summarize')) {
    return {
      ...slide,
      bullets: slide.bullets.slice(0, 3).map((bullet) => bullet.length > 110 ? `${bullet.slice(0, 107)}...` : bullet),
      speakerNotes: { ...slide.speakerNotes, keyMessage: slide.bullets[0] || slide.title },
    }
  }

  if (normalizedAction.includes('formal') || normalizedAction.includes('executive')) {
    return {
      ...slide,
      title: slide.title.startsWith('Executive') ? slide.title : `Executive ${slide.title}`,
      bullets: slide.bullets.map((bullet) => `Decision point: ${bullet.replace(/^Decision point:\s*/, '')}`),
    }
  }

  if (normalizedAction.includes('technical')) {
    return {
      ...slide,
      bullets: [...slide.bullets.slice(0, 4), `Validation context: ${state.selectedDimension}, ${state.selectedTimeRange}.`],
    }
  }

  if (normalizedAction.includes('chart') || normalizedAction.includes('visual')) {
    return {
      ...slide,
      highlights: [
        `Chart: ${output.metrics[0]?.label || state.selectedKpi} vs. ${state.selectedDimension}`,
        ...slide.highlights.slice(0, 2),
      ],
    }
  }

  if (normalizedAction.includes('table')) {
    return {
      ...slide,
      highlights: ['Table: Priority, Owner, Timeline, Expected KPI', ...slide.highlights.slice(0, 2)],
    }
  }

  if (normalizedAction.includes('timeline')) {
    return {
      ...slide,
      highlights: ['Timeline: Now, Next 30 days, Next review', ...slide.highlights.slice(0, 2)],
    }
  }

  if (normalizedAction.includes('diagram')) {
    return {
      ...slide,
      highlights: ['Diagram: Evidence -> Finding -> Recommendation -> Decision', ...slide.highlights.slice(0, 2)],
    }
  }

  if (normalizedAction.includes('evidence')) {
    return {
      ...slide,
      bullets: [...slide.bullets.slice(0, 4), `Evidence: ${evidenceLine}`],
    }
  }

  if (normalizedAction.includes('title')) {
    return {
      ...slide,
      title: `${state.selectedKpi}: ${slide.title}`,
    }
  }

  return {
    ...slide,
    bullets: [...slide.bullets.slice(0, 4), `Speaker focus: connect this slide to ${output.hero.verdict}.`],
    speakerNotes: {
      ...slide.speakerNotes,
      keyMessage: `${slide.speakerNotes.keyMessage} The recommendation remains grounded in current workspace evidence.`,
    },
  }
}

function buildInitialAnalystMessage(output: GeneratedDocumentOutput, state: WorkspaceState): AnalystMessage {
  return {
    id: 'assistant-initial',
    role: 'assistant',
    content: `I am continuing the ${output.workspaceTitle} using ${state.selectedKpi} as the active KPI and ${state.selectedDimension} as the current investigation context. The strongest next move is to validate the evidence behind this signal, then choose whether to compare, forecast, or generate an executive output.`,
  }
}

function buildFallbackAnalystMessage(prompt: string, output: GeneratedDocumentOutput, state: WorkspaceState): AnalystMessage {
  const metric = output.metrics.find((candidate) => candidate.label === state.selectedKpi) || output.metrics[0]

  return {
    id: `assistant-fallback-${Date.now()}`,
    role: 'assistant',
    content: `Using the current ${output.workspaceTitle}, this question should be answered through ${state.selectedKpi} and ${state.selectedDimension}. ${metric?.interpretation || metric?.detail || output.aiThinkingSummary} The useful next step is to validate evidence first, then continue the investigation instead of restarting from the document.`,
    supportingEvidence: [
      { label: 'Question', value: prompt },
      { label: 'Active KPI', value: state.selectedKpi },
      { label: 'Confidence', value: typeof metric?.confidence === 'number' ? `${metric.confidence}%` : 'Contextual' },
    ],
    followUps: ['Show Evidence', 'Open Forecast', 'Generate Action Plan', 'Executive Summary'],
  }
}

function getConsoleQuickActions(output: GeneratedDocumentOutput, state: WorkspaceState) {
  if (output.renderer === 'forecast') {
    return [
      { label: 'Show Assumptions', command: '/evidence', prompt: `Show assumptions behind ${state.selectedKpi}.` },
      { label: 'Compare Forecast', command: '/compare', prompt: `Compare forecast movement for ${state.selectedKpi}.` },
      { label: 'Generate Scenario', command: '/forecast', prompt: `Generate a scenario for ${state.selectedKpi}.` },
      { label: 'What-if Analysis', command: '/forecast', prompt: `Run a what-if analysis for ${state.selectedKpi}.` },
      { label: 'Executive Summary', command: '/summary', prompt: 'Create an executive summary from this forecast workspace.' },
    ]
  }

  if (output.renderer === 'root-cause') {
    return [
      { label: 'Explain Cause', command: '/rootcause', prompt: `Explain the strongest cause behind ${state.selectedKpi}.` },
      { label: 'Show Evidence', command: '/evidence', prompt: `Show evidence for ${state.selectedKpi}.` },
      { label: 'Compare Region', command: '/compare', prompt: `Compare ${state.selectedKpi} by region.` },
      { label: 'Generate Action Plan', command: '/actionplan', prompt: `Generate an action plan for ${state.selectedKpi}.` },
      { label: 'Recommend Next Workspace', command: '/recommend', prompt: 'Recommend the next workspace from this root cause investigation.' },
    ]
  }

  if (output.renderer === 'presentation') {
    return [
      { label: 'Executive Summary', command: '/summary', prompt: 'Create an executive summary for this presentation workspace.' },
      { label: 'Generate PPT', command: '/ppt', prompt: 'Generate PPT structure from this investigation.' },
      { label: 'Draft Executive Email', command: '/email', prompt: 'Draft an executive email from this analysis.' },
      { label: 'Show Evidence', command: '/evidence', prompt: 'Show evidence behind the presentation claims.' },
    ]
  }

  return [
    { label: 'Explain Current KPI', command: '/explain', prompt: `Explain ${state.selectedKpi} in the current investigation.` },
    { label: 'Show Evidence', command: '/evidence', prompt: `Show evidence for ${state.selectedKpi}.` },
    { label: 'Compare Previous Month', command: '/compare', prompt: `Compare ${state.selectedKpi} with the previous month.` },
    { label: 'Generate Action Plan', command: '/actionplan', prompt: `Generate an action plan for ${state.selectedKpi}.` },
    { label: 'Forecast Impact', command: '/forecast', prompt: `Forecast the impact of ${state.selectedKpi}.` },
    { label: 'Recommend Next Workspace', command: '/recommend', prompt: 'Recommend the next workspace from this investigation.' },
    { label: 'Executive Summary', command: '/summary', prompt: 'Create an executive summary from the current workspace.' },
    { label: 'Generate PPT', command: '/ppt', prompt: 'Generate PPT structure from this investigation.' },
    { label: 'Draft Executive Email', command: '/email', prompt: 'Draft an executive email from this analysis.' },
  ]
}

function getSlashCommands(renderer: GeneratedDocumentOutput['renderer']) {
  const commands = [
    { command: '/explain', label: 'Explain the active KPI', prompt: 'Explain the current KPI using workspace context.' },
    { command: '/evidence', label: 'Show supporting evidence', prompt: 'Show evidence for the active investigation.' },
    { command: '/compare', label: 'Compare segments or period', prompt: 'Compare the active KPI using current filters.' },
    { command: '/forecast', label: 'Forecast impact', prompt: 'Forecast the impact using current workspace state.' },
    { command: '/rootcause', label: 'Open root cause reasoning', prompt: 'Explain the root cause behind the active signal.' },
    { command: '/actionplan', label: 'Generate action plan', prompt: 'Generate an action plan from this investigation.' },
    { command: '/ppt', label: 'Prepare PPT structure', prompt: 'Generate PPT structure from this investigation.' },
    { command: '/email', label: 'Draft executive email', prompt: 'Draft an executive email from this investigation.' },
    { command: '/summary', label: 'Create executive summary', prompt: 'Create an executive summary from this workspace.' },
    { command: '/recommend', label: 'Recommend next workspace', prompt: 'Recommend the next workspace for this investigation.' },
  ]

  if (renderer === 'forecast') {
    return commands.filter((item) => item.command !== '/rootcause')
  }

  return commands
}

function metricToEvidence(metric: OutputMetric, output: GeneratedDocumentOutput): EvidenceTarget {
  return {
    kind: 'metric',
    title: metric.label,
    confidence: metric.confidence,
    evidence:
      metric.evidence && metric.evidence.length > 0
        ? metric.evidence
        : [metric.interpretation || metric.detail || output.statusLine],
    sourceFields:
      metric.sourceFields && metric.sourceFields.length > 0
        ? metric.sourceFields
        : [metric.label, output.insightTitle],
    affectedRecords: metric.affectedRecords,
    reasoningSummary:
      metric.reasoningSummary ||
      `${metric.label} is currently interpreted as ${metric.value}. ${metric.suggestedAction || output.statusLine}`,
  }
}

function sectionToEvidence(section: OutputSection, output: GeneratedDocumentOutput): EvidenceTarget {
  return {
    kind: 'section',
    title: section.title,
    confidence: section.score,
    evidence:
      section.evidence && section.evidence.length > 0
        ? section.evidence
        : section.items.slice(0, 5),
    sourceFields: [section.title, output.insightTitle],
    affectedRecords: output.hero.value,
    reasoningSummary:
      section.description ||
      `${section.title} is supported by the listed workspace findings and should be validated against the source document.`,
  }
}

function buildEvidenceActionModal(target: EvidenceTarget, state: WorkspaceState): WorkspaceModal {
  return {
    title: `Evidence Review: ${target.title}`,
    label: 'Evidence Layer',
    description: `FlowSummary prepared the evidence context for ${target.title} using ${state.selectedKpi} and ${state.selectedDimension}.`,
    answer: `${target.title} should be reviewed against the current ${state.selectedDimension} context before it is used for a decision. The strongest available signal is: ${target.reasoningSummary} This evidence is enough to guide the next investigation, but row-level validation is still recommended before assigning ownership or generating an executive output.`,
    blocks: [
      {
        title: 'Evidence Summary',
        items: [
          target.reasoningSummary,
          typeof target.confidence === 'number' ? `Confidence: ${target.confidence}%` : 'Confidence: contextual',
          target.affectedRecords ? `Affected records: ${target.affectedRecords}` : 'Affected records depend on the source detail available.',
        ],
      },
      {
        title: 'Source Context',
        items: target.sourceFields.length > 0 ? target.sourceFields : ['Source fields will appear when row-level metadata is available.'],
      },
      {
        title: 'Validation Path',
        items:
          target.evidence.length > 0
            ? target.evidence
            : ['Validate this finding against the extracted document evidence before assigning an owner.'],
      },
    ],
    primaryAction: `Use evidence for ${target.title} before generating the next decision output.`,
  }
}

function buildMetricActionModal(
  action: string,
  metric: OutputMetric,
  output: GeneratedDocumentOutput,
  state: WorkspaceState,
): WorkspaceModal {
  const actionMap: Record<string, WorkspaceModal> = {
    Explore: {
      title: `Explore ${metric.label}`,
      label: 'KPI Exploration',
      description: `FlowSummary is opening ${metric.label} using ${state.selectedDimension}, ${state.selectedTimeRange}, ${state.selectedRegion}, and ${state.selectedProduct}.`,
      answer: `${metric.label} is the best starting point for exploration because its current value is ${metric.value}. ${metric.interpretation || metric.detail || output.statusLine} The next useful move is to isolate the dimension most likely to explain the signal, then confirm it against the evidence before turning it into an action.`,
      blocks: [
        {
          title: 'Current Signal',
          items: [
            `${metric.label}: ${metric.value}`,
            metric.interpretation || metric.detail || output.statusLine,
            `Risk: ${metric.risk || 'Medium'}`,
          ],
        },
        {
          title: 'Explore Path',
          items: [
            `Break down by ${metric.sourceFields?.[0] || state.selectedDimension}.`,
            'Compare the strongest segment against the rest of the document.',
            'Open evidence before assigning an owner.',
          ],
        },
      ],
      primaryAction: metric.suggestedAction || `Continue exploring ${metric.label}.`,
    },
    Compare: {
      title: `Compare ${metric.label}`,
      label: 'Comparison Preview',
      description: `FlowSummary prepared a comparison workspace using the current state, without asking for the same filters again.`,
      answer: `The comparison should focus on where ${metric.label} changes most across ${metric.sourceFields?.[0] || state.selectedDimension}. The goal is not to compare every available field, but to identify the clearest variance that explains ${metric.value}. If the variance is concentrated, the next action should target that segment first.`,
      blocks: [
        {
          title: 'Comparison Context',
          items: [
            `Active KPI: ${metric.label}`,
            `Dimension: ${state.selectedDimension}`,
            `Time range: ${state.selectedTimeRange}`,
          ],
        },
        {
          title: 'Recommended Comparison',
          items: [
            `Compare ${metric.label} across ${metric.sourceFields?.slice(0, 3).join(', ') || state.selectedDimension}.`,
            'Highlight the largest positive and negative variance.',
            'Use the evidence layer to validate source fields.',
          ],
        },
      ],
      primaryAction: `Suggested next: create a segmented comparison for ${metric.label}.`,
    },
    Forecast: {
      title: `Forecast ${metric.label}`,
      label: 'Forecast Preview',
      description: `FlowSummary prepared a forecast path for ${metric.label}. Historical confidence depends on recurring uploads.`,
      answer: `${metric.label} can be forecast from the current signal, but confidence depends on whether prior-period data exists. Use ${metric.value} as the baseline, treat ${metric.trend || 'the current trend'} as directional only, and validate seasonality or recurring patterns before presenting the projection as a decision forecast.`,
      blocks: [
        {
          title: 'Forecast Inputs',
          items: [
            `Primary KPI: ${metric.label}`,
            `Current value: ${metric.value}`,
            `Trend signal: ${metric.trend || 'Needs previous period'}`,
          ],
        },
        {
          title: 'Projection Logic',
          items: [
            'Use current document signal as baseline.',
            'Compare against previous upload when available.',
            'Flag risk if quality or period coverage is incomplete.',
          ],
        },
      ],
      primaryAction: `Next workspace: Forecast ${metric.label} with prior-period comparison.`,
    },
    'Drill Down': {
      title: `Drill Down: ${metric.label}`,
      label: 'Drill-down Path',
      description: 'FlowSummary created a drill path that preserves the current workspace state.',
      answer: `The drill-down should start from ${metric.sourceFields?.[0] || state.selectedDimension} because it is the nearest available context for ${metric.label}. The purpose is to find the smallest segment that explains the signal, not to open every possible breakdown. Once the segment is identified, evidence review should happen before the result becomes a recommendation.`,
      blocks: [
        {
          title: 'Suggested Drill Path',
          items: [
            `${metric.label}`,
            metric.sourceFields?.[0] || 'Region',
            metric.sourceFields?.[1] || 'Branch',
            metric.sourceFields?.[2] || 'Customer',
            'Record level evidence',
          ],
        },
        {
          title: 'What To Look For',
          items: [
            'Largest concentration.',
            'Segment with highest risk.',
            'Records that explain the variance.',
          ],
        },
      ],
      primaryAction: `Drill into ${metric.sourceFields?.[0] || state.selectedDimension} first.`,
    },
  }

  return actionMap[action] || {
    title: `${action}: ${metric.label}`,
    label: 'Workspace Action',
    description: `FlowSummary prepared ${action.toLowerCase()} for ${metric.label}.`,
    answer: `${action} should be handled in the context of ${metric.label}, where the current signal is ${metric.value}. ${metric.interpretation || metric.detail || output.statusLine}`,
    blocks: [
      {
        title: 'Context',
        items: [metric.value, metric.interpretation || metric.detail || output.statusLine],
      },
    ],
    primaryAction: metric.suggestedAction,
  }
}

function buildRecommendedActionModal(action: OutputAction, state: WorkspaceState): WorkspaceModal {
  return {
    title: action.title,
    label: 'Recommended Action',
    description: `FlowSummary generated this action using KPI ${state.selectedKpi} and dimension ${state.selectedDimension}.`,
    answer: `${action.title} is relevant because it directly follows the active workspace context: ${state.selectedKpi} under ${state.selectedDimension}. ${action.detail} Treat this as the next operational step, then confirm owner and priority before it becomes an executive deliverable.`,
    blocks: [
      {
        title: 'What Will Happen',
        items: [
          action.detail,
          `Priority: ${action.priority || 'Medium'}`,
          action.owner ? `Suggested owner: ${action.owner}` : 'Owner can be assigned after evidence review.',
        ],
      },
      {
        title: 'Preserved Context',
        items: [
          `KPI: ${state.selectedKpi}`,
          `Dimension: ${state.selectedDimension}`,
          `Time: ${state.selectedTimeRange}`,
          `Region: ${state.selectedRegion}`,
          `Product: ${state.selectedProduct}`,
        ],
      },
    ],
    primaryAction: `${action.title} is ready to continue from the current workspace state.`,
  }
}

function buildNextAnalysisModal(item: NextAnalysis, state: WorkspaceState): WorkspaceModal {
  return {
    title: item.title,
    label: 'Suggested Investigation',
    description: item.reason,
    answer: `${item.title} is the right next investigation if the current analysis needs a deeper explanation rather than a finished conclusion. It should carry forward ${state.selectedKpi} and ${state.selectedDimension}, then produce a narrower answer that confirms whether this path changes the recommended action.`,
    blocks: [
      {
        title: 'Investigation Setup',
        items: [
          `Carry forward KPI: ${state.selectedKpi}`,
          `Carry forward dimension: ${state.selectedDimension}`,
          `Renderer target: ${item.renderer || 'workspace-selected'}`,
        ],
      },
      {
        title: 'Expected Output',
        items: [
          'Preserve current filters.',
          'Generate evidence-backed findings.',
          'Recommend the next best action after this investigation.',
        ],
      },
    ],
    primaryAction: `Open ${item.title} as the next workspace when backend chaining is enabled.`,
  }
}

function buildFollowUpModal(question: string, output: GeneratedDocumentOutput, state: WorkspaceState): WorkspaceModal {
  return {
    title: question,
    label: 'Follow-up Investigation',
    description: `FlowSummary prepared an answer path using the current ${output.workspaceTitle}.`,
    answer: `To answer "${question}", FlowSummary should use the current workspace context instead of restarting from the whole document. The relevant frame is ${state.selectedKpi} inside ${state.selectedDimension}; the answer should explain what the evidence implies, what remains uncertain, and what decision can be made next.`,
    blocks: [
      {
        title: 'Current Context',
        items: [
          `Workspace: ${output.workspaceTitle}`,
          `KPI: ${state.selectedKpi}`,
          `Dimension: ${state.selectedDimension}`,
        ],
      },
      {
        title: 'Answer Plan',
        items: [
          'Use evidence already extracted from this workspace.',
          'Apply current filters automatically.',
          'Return a new focused investigation instead of a static answer.',
        ],
      },
    ],
    primaryAction: `Suggested investigation: ${question}`,
  }
}

function buildCopilotModal(
  intent: string,
  output: GeneratedDocumentOutput,
  state: WorkspaceState,
): WorkspaceModal {
  return {
    title: intent,
    label: 'AI Analyst Copilot',
    description: `Copilot is using ${state.selectedKpi}, ${state.selectedDimension}, and prior reasoning from ${output.workspaceTitle}.`,
    answer: `${intent} should be answered from the current workspace state, not from a full document recap. The active signal is ${state.selectedKpi} under ${state.selectedDimension}; FlowSummary should explain why that matters, what evidence supports it, and which next workspace or action would reduce uncertainty fastest.`,
    blocks: [
      {
        title: 'Analyst Reasoning',
        items: [
          output.aiThinkingSummary,
          `Current KPI: ${state.selectedKpi}`,
          `Current dimension: ${state.selectedDimension}`,
        ],
      },
      {
        title: 'Recommended Move',
        items: [
          output.nextAnalyses[0]?.title || 'Continue exploring the strongest signal.',
          output.nextAnalyses[0]?.reason || 'Use the current evidence layer to decide the next path.',
        ],
      },
    ],
    primaryAction: intent === 'Recommend next workspace'
      ? `Recommended next workspace: ${output.nextAnalyses[0]?.title || output.workspaceTitle}`
      : `Copilot generated context for ${intent}.`,
  }
}

function metricToneClass(tone: OutputMetric['tone']) {
  if (tone === 'positive') return 'border-emerald-400/20'
  if (tone === 'warning') return 'border-amber-400/30'
  if (tone === 'danger') return 'border-destructive/30'
  return 'border-border'
}

function heroToneClass(risk: OutputMetric['risk']) {
  if (risk === 'High' || risk === 'Critical') return 'border-destructive/30'
  if (risk === 'Medium') return 'border-amber-400/30'
  return 'border-emerald-400/20'
}
