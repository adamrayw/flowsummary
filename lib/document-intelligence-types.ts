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

export type GeneratedDocumentReport = {
  title: string
  summary: string
  keyInsights: string[]
  recommendations: string[]
  conclusion: string
}
