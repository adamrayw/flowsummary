export type DocumentActionType = 'dashboard' | 'report' | 'presentation'

export type DocumentDNA = {
  rowCount: number
  columnCount: number
  columns: string[]
  missingValues: number
  duplicates: number
  dateRange?: string
}

export type DocumentProfile = {
  file: {
    name: string
    type: string
    sizeBytes: number
    words: number
    sheets?: number
    pages?: number
  }
  dna: DocumentDNA
  language: string
  mainMetrics: string[]
  keyDimensions: string[]
  kpis: string[]
  possibleRelationships: string[]
  potentialIssues: string[]
}

export type DocumentClassification = {
  documentType: string
  confidence: number
  explanation: string
  evidence: string[]
  alternativeTypes: Array<{
    documentType: string
    confidence: number
    reason: string
  }>
}

export type DocumentRecommendation = {
  id: string
  title: string
  description: string
  isPrimary: boolean
  type: DocumentActionType
  priorityScore: number
  confidence: number
  whyRecommended: string
  templateId: string
  exportFormats: string[]
}

export type DocumentHealth = {
  overallScore: number
  completeness: number
  consistency: number
  reliability: number
  missingValues: number
  duplicates: number
  outliers: number
  potentialRisks: number
  explanation: string
}

export type LikelyUserIntent = {
  objective: string
  probability: number
  reason: string
}

export type DocumentAnalysis = {
  documentId: string
  filename: string
  profile: DocumentProfile
  classification: DocumentClassification
  contextSummary: string[]
  documentHealth: DocumentHealth
  keyFindings: string[]
  aiInterpretation: string
  likelyUserIntent: LikelyUserIntent[]
  insightPreview: string[]
  recommendations: DocumentRecommendation[]
  model: string
}

export type OutputRendererType =
  | 'executive-dashboard'
  | 'regional-gap'
  | 'data-quality'
  | 'executive-summary'
  | 'presentation'
  | 'anomaly'
  | 'root-cause'
  | 'forecast'

export type OutputMetric = {
  label: string
  value: string
  detail?: string
  interpretation?: string
  trend?: string
  risk?: 'Low' | 'Medium' | 'High' | 'Critical'
  confidence?: number
  suggestedAction?: string
  evidence?: string[]
  sourceFields?: string[]
  affectedRecords?: string
  reasoningSummary?: string
  tone?: 'neutral' | 'positive' | 'warning' | 'danger'
}

export type OutputSection = {
  id: string
  title: string
  description?: string
  items: string[]
  evidence?: string[]
  score?: number
}

export type OutputAction = {
  title: string
  owner?: string
  priority?: 'Low' | 'Medium' | 'High' | 'Critical'
  detail: string
}

export type OutputSlide = {
  title: string
  bullets: string[]
  speakerNote?: string
}

export type NextAnalysis = {
  title: string
  reason: string
  renderer?: OutputRendererType
}

export type OutputHero = {
  label: string
  value: string
  verdict: string
  detail: string
  trend?: string
  risk?: 'Low' | 'Medium' | 'High' | 'Critical'
  confidence?: number
}

export type GeneratedDocumentOutput = {
  title: string
  workspaceTitle: string
  renderer: OutputRendererType
  purpose: string
  hero: OutputHero
  aiThinkingSummary: string
  insightTitle: string
  statusLine: string
  metrics: OutputMetric[]
  sections: OutputSection[]
  actions: OutputAction[]
  slides?: OutputSlide[]
  nextAnalyses: NextAnalysis[]
  followUpQuestions: string[]
}
