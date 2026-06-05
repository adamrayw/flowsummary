export type GeneratedSummary = {
  title: string
  summary: string
  keyInsights: string[]
  recommendations: string[]
  conclusion: string
}

export type SummaryListItem = {
  id: string
  title: string
  template: string | null
  createdAt: string
  updatedAt: string
}

export type SummaryDetail = SummaryListItem & {
  sourceText: string
  instructions: string
  output: GeneratedSummary
  model: string | null
}
