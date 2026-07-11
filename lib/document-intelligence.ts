import { generateJsonWithOpenRouter, hasOpenRouterConfig } from '@/lib/openrouter'
import type {
  DocumentAnalysis,
  DocumentClassification,
  DocumentHealth,
  DocumentProfile,
  DocumentRecommendation,
  GeneratedDocumentOutput,
  LikelyUserIntent,
} from '@/lib/document-intelligence-types'
import {
  buildRuleBasedOutput,
  normalizeOutputDraft,
  selectOutputRenderer,
  type OutputDraft,
} from '@/lib/document-output-engine'

const MAX_ANALYSIS_CHARS = 30_000
const MAX_REPORT_CHARS = 60_000

type AnalysisDraft = {
  classification?: Partial<DocumentClassification>
  contextSummary?: unknown
  documentHealth?: Partial<DocumentHealth>
  keyFindings?: unknown
  aiInterpretation?: unknown
  likelyUserIntent?: unknown
  insightPreview?: unknown
  recommendations?: unknown
}

export async function analyzeDocumentWithAI(params: {
  documentId: string
  filename: string
  sourceText: string
  profile: DocumentProfile
}): Promise<Omit<DocumentAnalysis, 'documentId' | 'filename'> & { model: string }> {
  const fallback = buildRuleBasedAnalysis(params.profile, params.sourceText)

  if (!hasOpenRouterConfig()) {
    return {
      ...fallback,
      model: 'rule-based',
    }
  }

  try {
    const response = await generateJsonWithOpenRouter({
      systemPrompt: [
        'You are FlowSummary, an enterprise document intelligence analyst.',
        'You are not a chatbot. Analyze the uploaded document as a senior business analyst, data analyst, and management consultant.',
        'Never ask what the user wants. Begin from the premise: "I analyzed your document."',
        'Never skip stages: understand, classify, extract context, explore data, score document health, infer user intent, recommend outcomes.',
        'Provide 5-10 intelligent findings before recommendations. Recommendations must be outcomes, not generic feature names.',
        'Return JSON with this shape:',
        '{"classification":{"documentType":"string","confidence":0.92,"explanation":"string","evidence":["string"],"alternativeTypes":[{"documentType":"string","confidence":0.3,"reason":"string"}]},"contextSummary":["string"],"documentHealth":{"overallScore":91,"completeness":96,"consistency":88,"reliability":94,"missingValues":11,"duplicates":3,"outliers":2,"potentialRisks":2,"explanation":"string"},"keyFindings":["5-10 findings"],"aiInterpretation":"string","likelyUserIntent":[{"objective":"Executive Summary","probability":0.94,"reason":"string"}],"insightPreview":["string"],"recommendations":[{"id":"string","title":"string","description":"string","isPrimary":true,"type":"dashboard|report|presentation","priorityScore":0.95,"confidence":0.9,"whyRecommended":"string","templateId":"string","exportFormats":["PDF","DOCX"]}]}',
        'Use concise business language. Avoid technical jargon. Do not invent precise numeric insights unless supported by the profile or document excerpt.',
      ].join('\n'),
      userPrompt: JSON.stringify({
        filename: params.filename,
        profile: params.profile,
        documentExcerpt: clampText(params.sourceText, MAX_ANALYSIS_CHARS),
      }),
      maxTokens: 2200,
      temperature: 0.15,
    })

    const normalized = normalizeAnalysisDraft(response.data as AnalysisDraft, fallback)

    return {
      ...normalized,
      model: response.model,
    }
  } catch (error) {
    console.error('[document-intelligence] AI analysis fallback used', error)
    return {
      ...fallback,
      model: 'rule-based-fallback',
    }
  }
}

export async function generateDocumentReportWithAI(params: {
  sourceText: string
  profile: DocumentProfile
  classification: DocumentClassification
  recommendation: DocumentRecommendation
}): Promise<{ output: GeneratedDocumentOutput; model: string }> {
  const fallback = buildRuleBasedReport(params)
  const renderer = selectOutputRenderer(params)

  if (!hasOpenRouterConfig()) {
    return {
      output: fallback,
      model: 'rule-based',
    }
  }

  try {
    const response = await generateJsonWithOpenRouter({
      systemPrompt: [
        'You are FlowSummary, an enterprise AI analyst that opens specialized business workspaces.',
        'A Recommended Action is not a prompt. It is an AI application with its own renderer, layout, sections, and next-analysis path.',
        `The selected renderer is "${renderer}". Do not change it unless the recommendation clearly requires a better supported renderer.`,
        'Think in workspaces, not reports. Use workspace titles such as Executive Decision Workspace, Forecast Workspace, Data Quality Audit Workspace, Root Cause Investigation Workspace, and Presentation Workspace.',
        'Every output must start from a hero outcome: the most important business signal, value, verdict, risk, trend, and confidence.',
        'Every KPI must explain business meaning, trend, risk, confidence, and suggested action. Never output raw numbers only.',
        'KPI names must adapt to document type. Attendance uses Attendance, Late, Leave, Remote, Compliance. Finance uses Revenue, Profit, Cash Flow, Expenses, Margin. Sales uses Revenue, Conversion, Top Products, Growth, Forecast. Inventory uses Stock, Turnover, Backorder, Demand, Supply. Construction uses Progress, Budget, Delay, Quality, Safety.',
        'Include one concise aiThinkingSummary paragraph describing how the AI analyzed the document and why this workspace was opened.',
        'Never return the generic sections Summary, Key Insights, Recommendations, or Conclusion.',
        'Use renderer-specific section names only. Examples: Executive Overview, Regional Ranking, Gap Analysis, Duplicate Records Found, Validation Checklist, Slide Preview, Detected Anomalies, Most Likely Cause, Forecast Summary.',
        'End with nextAnalyses and followUpQuestions that continue the workflow like a consultant.',
        'Be concrete, mention data quality caveats, and avoid unsupported numeric claims.',
        'Return JSON with this shape:',
        '{"title":"string","workspaceTitle":"string","renderer":"executive-dashboard|regional-gap|data-quality|executive-summary|presentation|anomaly|root-cause|forecast","purpose":"string","hero":{"label":"string","value":"string","verdict":"string","detail":"string","trend":"string","risk":"Low|Medium|High|Critical","confidence":91},"aiThinkingSummary":"one concise paragraph","insightTitle":"Attendance Insights|Financial Insights|Inventory Insights|Sales Insights|Project Insights|Compliance Insights|Business Insights","statusLine":"string","metrics":[{"label":"string","value":"string","detail":"string","interpretation":"string","trend":"string","risk":"Low|Medium|High|Critical","confidence":91,"suggestedAction":"string","evidence":["supporting fact"],"sourceFields":["field name"],"affectedRecords":"string","reasoningSummary":"string","tone":"neutral|positive|warning|danger"}],"sections":[{"id":"string","title":"string","description":"string","items":["string"],"evidence":["string"],"score":85}],"actions":[{"title":"Generate Executive PPT","owner":"string","priority":"Low|Medium|High|Critical","detail":"what will happen when selected"}],"slides":[{"title":"string","bullets":["string"],"speakerNote":"string"}],"nextAnalyses":[{"title":"string","reason":"string","renderer":"executive-dashboard|regional-gap|data-quality|executive-summary|presentation|anomaly|root-cause|forecast"}],"followUpQuestions":["string"]}',
      ].join('\n'),
      userPrompt: JSON.stringify({
        selectedRenderer: renderer,
        selectedRecommendation: params.recommendation,
        classification: params.classification,
        profile: params.profile,
        documentExcerpt: clampText(params.sourceText, MAX_REPORT_CHARS),
      }),
      maxTokens: 2400,
      temperature: 0.2,
    })

    return {
      output: normalizeOutputDraft(response.data as OutputDraft, fallback),
      model: response.model,
    }
  } catch (error) {
    console.error('[document-intelligence] AI report fallback used', error)
    return {
      output: fallback,
      model: 'rule-based-fallback',
    }
  }
}

function buildRuleBasedAnalysis(
  profile: DocumentProfile,
  sourceText: string,
): Pick<DocumentAnalysis, 'profile' | 'classification' | 'contextSummary' | 'documentHealth' | 'keyFindings' | 'aiInterpretation' | 'likelyUserIntent' | 'insightPreview' | 'recommendations'> {
  const classification = classifyBySignals(profile, sourceText)
  const contextSummary = buildContextSummary(profile, classification)
  const documentHealth = buildDocumentHealth(profile)
  const keyFindings = buildKeyFindings(profile, classification, documentHealth)
  const aiInterpretation = buildAiInterpretation(profile, classification, documentHealth)
  const likelyUserIntent = buildLikelyUserIntent(classification.documentType, profile)
  const recommendations = buildRecommendations(classification.documentType, profile)

  return {
    profile,
    classification,
    contextSummary,
    documentHealth,
    keyFindings,
    aiInterpretation,
    likelyUserIntent,
    insightPreview: buildInsightPreview(profile, classification, keyFindings, documentHealth),
    recommendations,
  }
}

function classifyBySignals(profile: DocumentProfile, sourceText: string): DocumentClassification {
  const text = `${profile.dna.columns.join(' ')} ${sourceText.slice(0, 5000)}`.toLowerCase()
  const candidates = [
    {
      type: 'Attendance Report',
      signals: ['attendance', 'absent', 'present', 'clock in', 'clock out', 'late', 'shift'],
      evidence: ['attendance status or timekeeping fields'],
    },
    {
      type: 'Financial Report',
      signals: ['revenue', 'expense', 'profit', 'cash flow', 'budget', 'variance', 'balance'],
      evidence: ['financial metrics such as revenue, expense, profit, or budget'],
    },
    {
      type: 'Sales Report',
      signals: ['sales', 'customer', 'product', 'pipeline', 'deal', 'revenue', 'region'],
      evidence: ['sales, customer, product, or regional performance fields'],
    },
    {
      type: 'HR Report',
      signals: ['employee', 'department', 'headcount', 'hiring', 'turnover', 'gender', 'age'],
      evidence: ['employee and workforce attributes'],
    },
    {
      type: 'Inventory Report',
      signals: ['inventory', 'stock', 'warehouse', 'sku', 'reorder', 'quantity'],
      evidence: ['stock, SKU, warehouse, or quantity fields'],
    },
    {
      type: 'Meeting Minutes',
      signals: ['meeting', 'agenda', 'attendees', 'action item', 'decision', 'minutes'],
      evidence: ['meeting agenda, decision, or action item language'],
    },
    {
      type: 'Contract',
      signals: ['agreement', 'contract', 'party', 'termination', 'payment terms', 'governing law'],
      evidence: ['contractual clauses or party obligations'],
    },
  ]

  const scored = candidates
    .map((candidate) => ({
      ...candidate,
      score: candidate.signals.filter((signal) => text.includes(signal)).length,
    }))
    .sort((a, b) => b.score - a.score)

  const best = scored[0]
  if (!best || best.score === 0) {
    return {
      documentType: profile.dna.rowCount > 0 ? 'Raw Dataset' : 'Unknown Document',
      confidence: 0.48,
      explanation:
        'I found structured content, but the available headers and text do not strongly match a specialized document type.',
      evidence: [
        `${profile.dna.rowCount.toLocaleString('en')} rows detected`,
        `${profile.dna.columnCount.toLocaleString('en')} columns or structural fields detected`,
      ],
      alternativeTypes: [],
    }
  }

  return {
    documentType: best.type,
    confidence: Math.min(0.95, 0.55 + best.score * 0.1),
    explanation: `I identified this as a ${best.type} because it contains ${best.evidence[0]}.`,
    evidence: [
      best.evidence[0],
      `${profile.dna.rowCount.toLocaleString('en')} records or content rows detected`,
      profile.dna.columns.length > 0
        ? `Relevant fields include ${profile.dna.columns.slice(0, 5).join(', ')}`
        : 'Document text contains matching domain terms',
    ],
    alternativeTypes: scored
      .filter((candidate) => candidate.type !== best.type && candidate.score > 0)
      .slice(0, 2)
      .map((candidate) => ({
        documentType: candidate.type,
        confidence: Math.min(0.65, 0.3 + candidate.score * 0.08),
        reason: `Some terms also match ${candidate.type.toLowerCase()}.`,
      })),
  }
}

function buildRecommendations(
  documentType: string,
  profile: DocumentProfile,
): DocumentRecommendation[] {
  const byType: Record<string, Array<Omit<DocumentRecommendation, 'id' | 'isPrimary' | 'priorityScore' | 'confidence' | 'exportFormats'>>> = {
    'Attendance Report': [
      {
        title: 'Executive Dashboard',
        description: 'Open a KPI dashboard for attendance rate, late arrivals, leave, remote work, regional performance, and priority actions.',
        type: 'dashboard',
        whyRecommended: 'Executives need a fast operating view before drilling into regional or employee-level issues.',
        templateId: 'attendance-executive-dashboard',
      },
      {
        title: 'Regional Attendance Gap Analysis',
        description: 'Investigate attendance differences across regions, departments, or teams and identify priority gaps.',
        type: 'report',
        whyRecommended: 'Attendance fields are useful for finding where performance differs and which segment needs attention first.',
        templateId: 'attendance-regional-gap-analysis',
      },
      {
        title: 'Duplicate Record Cleansing',
        description: 'Audit duplicate rows, affected records, possible causes, cleaning steps, and validation checklist.',
        type: 'report',
        whyRecommended: 'Attendance reports often contain repeated exports or duplicated rows that can distort absence and late-arrival KPIs.',
        templateId: 'attendance-duplicate-cleansing',
      },
      {
        title: 'Executive Summary',
        description: 'Create a management-ready summary of attendance health, risks, and recommended actions.',
        type: 'report',
        whyRecommended: 'Executives need a concise view of workforce attendance performance.',
        templateId: 'attendance-executive-summary',
      },
      {
        title: 'Presentation',
        description: 'Prepare a slide-ready management presentation with overview, KPIs, findings, recommendations, and action plan.',
        type: 'presentation',
        whyRecommended: 'Management teams often need attendance findings packaged for a recurring review meeting.',
        templateId: 'attendance-presentation',
      },
      {
        title: 'Anomaly Detection',
        description: 'Investigate abnormal late arrival, absence, duplicate, and missing-value behavior.',
        type: 'report',
        whyRecommended: 'Anomaly detection helps separate normal attendance variation from exceptions requiring operational follow-up.',
        templateId: 'attendance-anomaly-detection',
      },
      {
        title: 'Root Cause Analysis',
        description: 'Explain why the most important attendance issue is likely happening and what evidence supports it.',
        type: 'report',
        whyRecommended: 'Root cause analysis turns attendance symptoms into a practical investigation path.',
        templateId: 'attendance-root-cause-analysis',
      },
      {
        title: 'Forecast',
        description: 'Project future attendance risks and preparation steps based on trend-ready fields.',
        type: 'dashboard',
        whyRecommended: 'Recurring attendance uploads can be used to anticipate future staffing and compliance risks.',
        templateId: 'attendance-forecast',
      },
    ],
    'Financial Report': [
      {
        title: 'Board Summary',
        description: 'Generate a board-ready summary of performance, variance, risks, and next actions.',
        type: 'presentation',
        whyRecommended: 'Financial reports are commonly consumed by leadership as concise board summaries.',
        templateId: 'finance-board-summary',
      },
      {
        title: 'Expense Breakdown',
        description: 'Identify cost drivers, expense categories, and potential budget concerns.',
        type: 'report',
        whyRecommended: 'Expense and cost signals indicate a useful management analysis path.',
        templateId: 'finance-expense-breakdown',
      },
      {
        title: 'Profit and Revenue Trend',
        description: 'Analyze revenue, margin, profit, and period-over-period movement.',
        type: 'dashboard',
        whyRecommended: 'Revenue or profit metrics can be turned into trend and performance insights.',
        templateId: 'finance-profit-trend',
      },
    ],
    'Sales Report': [
      {
        title: 'Sales Performance',
        description: 'Summarize performance by product, customer, region, or period.',
        type: 'dashboard',
        whyRecommended: 'Sales reports are strongest when segmented by customer, product, and region.',
        templateId: 'sales-performance',
      },
      {
        title: 'Top Products and Customers',
        description: 'Identify the most important revenue contributors and concentration risks.',
        type: 'report',
        whyRecommended: 'Product or customer fields can reveal performance concentration.',
        templateId: 'sales-top-contributors',
      },
      {
        title: 'Sales Executive Brief',
        description: 'Create a concise sales leadership brief with wins, risks, and next actions.',
        type: 'presentation',
        whyRecommended: 'Leadership usually needs a concise narrative from sales data.',
        templateId: 'sales-executive-brief',
      },
    ],
    'Inventory Report': [
      {
        title: 'Stock Health',
        description: 'Analyze stock levels, slow-moving items, fast-moving items, and stockout risk.',
        type: 'dashboard',
        whyRecommended: 'Inventory files usually need immediate stock health and reorder visibility.',
        templateId: 'inventory-stock-health',
      },
      {
        title: 'Reorder Recommendation',
        description: 'Generate prioritized reorder and warehouse action recommendations.',
        type: 'report',
        whyRecommended: 'Quantity and stock fields can support operational replenishment decisions.',
        templateId: 'inventory-reorder',
      },
    ],
    'Meeting Minutes': [
      {
        title: 'Decision and Action Summary',
        description: 'Extract decisions, action items, owners, and follow-up risks.',
        type: 'report',
        whyRecommended: 'Meeting minutes create value when decisions and next actions are made explicit.',
        templateId: 'meeting-action-summary',
      },
      {
        title: 'Follow-up Email Draft',
        description: 'Create a polished follow-up email with decisions and assigned actions.',
        type: 'report',
        whyRecommended: 'Meeting documents often need immediate communication follow-up.',
        templateId: 'meeting-follow-up',
      },
    ],
    Contract: [
      {
        title: 'Obligation and Risk Summary',
        description: 'Summarize parties, obligations, dates, payment terms, and potential risks.',
        type: 'report',
        whyRecommended: 'Contracts require concise extraction of obligations, risks, and key dates.',
        templateId: 'contract-risk-summary',
      },
      {
        title: 'Renewal and Expiry Review',
        description: 'Identify effective dates, renewal windows, termination terms, and follow-up actions.',
        type: 'report',
        whyRecommended: 'Contract dates are operationally important and easy to miss.',
        templateId: 'contract-renewal-review',
      },
    ],
  }

  const selected = byType[documentType] ?? [
    {
      title: 'Executive Dashboard',
      description: 'Open a KPI-style dashboard with document confidence, performance signals, business impact, and priority actions.',
      type: 'dashboard',
      whyRecommended: 'A dashboard gives leaders the fastest overview before choosing a deeper analysis path.',
      templateId: 'general-executive-dashboard',
    },
    {
      title: 'Executive Summary',
      description: 'Generate a concise professional summary of the document, key findings, and next actions.',
      type: 'report',
      whyRecommended: 'This is the safest high-value output for a general or unknown document.',
      templateId: 'general-executive-summary',
    },
    {
      title: 'Duplicate Record Cleansing',
      description: 'Review duplicate records, affected fields, business risk, cleaning strategy, and validation checklist.',
      type: 'report',
      whyRecommended: 'The document has enough structure to evaluate quality before deeper analysis.',
      templateId: 'general-duplicate-cleansing',
    },
    {
      title: 'Presentation',
      description: 'Prepare slide-ready output for management review.',
      type: 'presentation',
      whyRecommended: 'Most business documents eventually need a presentation-ready narrative.',
      templateId: 'general-presentation',
    },
    {
      title: 'Root Cause Analysis',
      description: 'Investigate why the most important issue may be happening.',
      type: 'report',
      whyRecommended: 'Most business documents benefit from explaining causes before assigning actions.',
      templateId: 'general-root-cause-analysis',
    },
    {
      title: 'Forecast',
      description: 'Evaluate whether the document can support future trend projection.',
      type: 'dashboard',
      whyRecommended: 'If the upload repeats over time, forecasting becomes the next useful management workflow.',
      templateId: 'general-forecast',
    },
  ]

  return selected.map((recommendation, index) => ({
    ...recommendation,
    id: `${recommendation.templateId}-${index + 1}`,
    isPrimary: index === 0,
    priorityScore: Number((0.95 - index * 0.08).toFixed(2)),
    confidence: Math.max(0.72, 0.9 - index * 0.06),
    exportFormats: recommendation.type === 'presentation' ? ['PPTX', 'PDF'] : ['PDF', 'DOCX'],
  }))
}

function buildContextSummary(profile: DocumentProfile, classification: DocumentClassification) {
  const summary = [
    `Document type: ${classification.documentType}.`,
    `Language: ${profile.language}.`,
    `Structure: ${profile.file.type}${profile.file.sheets ? ` with ${profile.file.sheets} sheet(s)` : ''}${profile.file.pages ? ` with ${profile.file.pages} page(s)` : ''}.`,
    `Volume: ${profile.dna.rowCount.toLocaleString('en')} records and ${profile.dna.columnCount.toLocaleString('en')} columns or structural fields.`,
  ]

  if (profile.dna.dateRange) summary.push(`Reporting period: ${profile.dna.dateRange}.`)
  if (profile.mainMetrics.length > 0) summary.push(`Measures: ${profile.mainMetrics.slice(0, 6).join(', ')}.`)
  if (profile.keyDimensions.length > 0) summary.push(`Dimensions: ${profile.keyDimensions.slice(0, 6).join(', ')}.`)
  if (profile.kpis.length > 0) summary.push(`KPIs: ${profile.kpis.slice(0, 6).join(', ')}.`)

  return summary
}

function buildDocumentHealth(profile: DocumentProfile): DocumentHealth {
  const totalCells = Math.max(1, profile.dna.rowCount * Math.max(1, profile.dna.columnCount))
  const completeness = Math.max(0, Math.round((1 - profile.dna.missingValues / totalCells) * 100))
  const duplicatePenalty = Math.min(30, Math.round((profile.dna.duplicates / Math.max(1, profile.dna.rowCount)) * 100))
  const consistency = Math.max(50, 100 - duplicatePenalty - (profile.dna.columns.length === 0 ? 20 : 0))
  const potentialRisks = profile.potentialIssues.length
  const reliability = Math.max(40, Math.round((completeness + consistency) / 2) - potentialRisks * 3)
  const overallScore = Math.max(0, Math.min(100, Math.round(completeness * 0.4 + consistency * 0.3 + reliability * 0.3)))

  return {
    overallScore,
    completeness,
    consistency,
    reliability,
    missingValues: profile.dna.missingValues,
    duplicates: profile.dna.duplicates,
    outliers: 0,
    potentialRisks,
    explanation:
      potentialRisks > 0
        ? `The document is usable, but ${potentialRisks} quality issue(s) should be reviewed before management use.`
        : 'The document profile does not show major completeness, duplicate, or structural risks.',
  }
}

function buildKeyFindings(
  profile: DocumentProfile,
  classification: DocumentClassification,
  health: DocumentHealth,
) {
  const findings = [
    `The document appears to be a ${classification.documentType}, supported by ${classification.evidence[0] || 'the extracted structure'}.`,
    `The dataset contains ${profile.dna.rowCount.toLocaleString('en')} records and ${profile.dna.columnCount.toLocaleString('en')} columns or structural fields.`,
  ]

  if (profile.dna.dateRange) findings.push(`The analysis period appears to cover ${profile.dna.dateRange}.`)
  if (profile.mainMetrics.length > 0) findings.push(`The strongest measurable fields are ${profile.mainMetrics.slice(0, 5).join(', ')}.`)
  if (profile.keyDimensions.length > 0) findings.push(`The best segmentation dimensions are ${profile.keyDimensions.slice(0, 5).join(', ')}.`)
  if (health.missingValues > 0) findings.push(`${health.missingValues.toLocaleString('en')} missing values may affect completeness.`)
  if (health.duplicates > 0) findings.push(`${health.duplicates.toLocaleString('en')} duplicate records should be reviewed.`)
  if (profile.possibleRelationships.length > 0) findings.push(`Useful comparisons may include ${profile.possibleRelationships.slice(0, 3).join(', ')}.`)
  if (findings.length < 5) findings.push('No severe structural issue was detected in the initial profiling pass.')

  return findings.slice(0, 10)
}

function buildAiInterpretation(
  profile: DocumentProfile,
  classification: DocumentClassification,
  health: DocumentHealth,
) {
  return `This ${classification.documentType.toLowerCase()} is likely intended to support management review. The most useful next step is to turn the extracted structure into an executive-ready analysis, while noting a document health score of ${health.overallScore}/100.`
}

function buildLikelyUserIntent(documentType: string, profile: DocumentProfile): LikelyUserIntent[] {
  const common = [
    { objective: 'Executive Summary', probability: 0.9, reason: 'Most uploaded business documents need a concise management summary.' },
    { objective: 'Data Quality Review', probability: profile.potentialIssues.length > 0 ? 0.82 : 0.45, reason: 'The extracted profile can be checked for completeness, duplicates, and reliability.' },
  ]

  const byType: Record<string, LikelyUserIntent[]> = {
    'Attendance Report': [
      { objective: 'Attendance Anomaly Investigation', probability: 0.88, reason: 'Attendance reports are commonly uploaded to find absences, lateness, and operational risks.' },
      { objective: 'Regional or Department Performance Comparison', probability: 0.76, reason: 'Attendance fields are useful for comparing teams, regions, or departments.' },
    ],
    'Financial Report': [
      { objective: 'Board Summary', probability: 0.92, reason: 'Financial reports are usually prepared for leadership review.' },
      { objective: 'Variance and Risk Assessment', probability: 0.8, reason: 'Financial metrics usually require explanation of changes, risks, and budget impact.' },
    ],
    'Sales Report': [
      { objective: 'Sales Performance Dashboard', probability: 0.88, reason: 'Sales documents are often uploaded to understand product, customer, and regional performance.' },
      { objective: 'Top Contributor Analysis', probability: 0.76, reason: 'Sales fields can reveal top products, customers, or regions.' },
    ],
  }

  return [...(byType[documentType] || []), ...common]
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 5)
}

function buildInsightPreview(
  profile: DocumentProfile,
  classification: DocumentClassification,
  keyFindings: string[],
  health: DocumentHealth,
) {
  const preview = [
    'I analyzed your document.',
    `Classified as ${classification.documentType} with ${Math.round(classification.confidence * 100)}% confidence.`,
    `Document health score: ${health.overallScore}/100.`,
    `Detected ${profile.dna.rowCount.toLocaleString('en')} records and ${profile.dna.columnCount.toLocaleString('en')} columns or structural fields.`,
  ]

  if (profile.dna.dateRange) {
    preview.push(`Detected period: ${profile.dna.dateRange}.`)
  }
  if (profile.mainMetrics.length > 0) {
    preview.push(`Main metrics include ${profile.mainMetrics.slice(0, 4).join(', ')}.`)
  }
  if (profile.keyDimensions.length > 0) {
    preview.push(`Useful dimensions include ${profile.keyDimensions.slice(0, 4).join(', ')}.`)
  }
  preview.push(...keyFindings.slice(0, 3))

  return Array.from(new Set(preview)).slice(0, 8)
}

function normalizeAnalysisDraft(
  draft: AnalysisDraft,
  fallback: Pick<DocumentAnalysis, 'profile' | 'classification' | 'contextSummary' | 'documentHealth' | 'keyFindings' | 'aiInterpretation' | 'likelyUserIntent' | 'insightPreview' | 'recommendations'>,
) {
  const classification = normalizeClassification(draft.classification, fallback.classification)
  const contextSummary = normalizeStringArray(draft.contextSummary, fallback.contextSummary).slice(0, 10)
  const documentHealth = normalizeDocumentHealth(draft.documentHealth, fallback.documentHealth)
  const keyFindings = normalizeStringArray(draft.keyFindings, fallback.keyFindings).slice(0, 10)
  const aiInterpretation = normalizeString(draft.aiInterpretation) || fallback.aiInterpretation
  const likelyUserIntent = normalizeLikelyUserIntent(draft.likelyUserIntent, fallback.likelyUserIntent)
  const insightPreview = normalizeStringArray(draft.insightPreview, fallback.insightPreview).slice(0, 8)
  const recommendations = normalizeRecommendations(draft.recommendations, fallback.recommendations)

  return {
    profile: fallback.profile,
    classification,
    contextSummary,
    documentHealth,
    keyFindings,
    aiInterpretation,
    likelyUserIntent,
    insightPreview,
    recommendations,
  }
}

function normalizeClassification(
  value: Partial<DocumentClassification> | undefined,
  fallback: DocumentClassification,
): DocumentClassification {
  if (!value || typeof value !== 'object') {
    return fallback
  }

  return {
    documentType: normalizeString(value.documentType) || fallback.documentType,
    confidence: normalizeScore(value.confidence, fallback.confidence),
    explanation: normalizeString(value.explanation) || fallback.explanation,
    evidence: normalizeStringArray(value.evidence, fallback.evidence).slice(0, 5),
    alternativeTypes: Array.isArray(value.alternativeTypes)
      ? value.alternativeTypes
          .map((item) => ({
            documentType: normalizeString(item.documentType),
            confidence: normalizeScore(item.confidence, 0.35),
            reason: normalizeString(item.reason),
          }))
          .filter((item) => item.documentType && item.reason)
          .slice(0, 3)
      : fallback.alternativeTypes,
  }
}

function normalizeRecommendations(value: unknown, fallback: DocumentRecommendation[]) {
  if (!Array.isArray(value)) {
    return fallback
  }

  const normalized = value
    .map((item, index) => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const record = item as Partial<DocumentRecommendation>
      const title = normalizeString(record.title)
      const description = normalizeString(record.description)
      const templateId = normalizeString(record.templateId) || slugify(title)
      const type = normalizeActionType(record.type)

      if (!title || !description) {
        return null
      }

      return {
        id: normalizeString(record.id) || `${templateId}-${index + 1}`,
        title,
        description,
        isPrimary: Boolean(record.isPrimary),
        type,
        priorityScore: normalizeScore(record.priorityScore, 0.8 - index * 0.05),
        confidence: normalizeScore(record.confidence, 0.78),
        whyRecommended: normalizeString(record.whyRecommended) || description,
        templateId,
        exportFormats: normalizeStringArray(record.exportFormats, ['PDF', 'DOCX']).slice(0, 4),
      }
    })
    .filter((item): item is DocumentRecommendation => Boolean(item))
    .slice(0, 6)

  if (normalized.length === 0) {
    return fallback
  }

  if (!normalized.some((item) => item.isPrimary)) {
    normalized[0] = {
      ...normalized[0],
      isPrimary: true,
    }
  }

  return normalized
}

function normalizeDocumentHealth(
  value: Partial<DocumentHealth> | undefined,
  fallback: DocumentHealth,
): DocumentHealth {
  if (!value || typeof value !== 'object') {
    return fallback
  }

  return {
    overallScore: normalizePercent(value.overallScore, fallback.overallScore),
    completeness: normalizePercent(value.completeness, fallback.completeness),
    consistency: normalizePercent(value.consistency, fallback.consistency),
    reliability: normalizePercent(value.reliability, fallback.reliability),
    missingValues: normalizeNonNegativeInteger(value.missingValues, fallback.missingValues),
    duplicates: normalizeNonNegativeInteger(value.duplicates, fallback.duplicates),
    outliers: normalizeNonNegativeInteger(value.outliers, fallback.outliers),
    potentialRisks: normalizeNonNegativeInteger(value.potentialRisks, fallback.potentialRisks),
    explanation: normalizeString(value.explanation) || fallback.explanation,
  }
}

function normalizeLikelyUserIntent(value: unknown, fallback: LikelyUserIntent[]) {
  if (!Array.isArray(value)) {
    return fallback
  }

  const normalized = value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const record = item as Partial<LikelyUserIntent>
      const objective = normalizeString(record.objective)
      const reason = normalizeString(record.reason)

      if (!objective || !reason) {
        return null
      }

      return {
        objective,
        probability: normalizeScore(record.probability, 0.5),
        reason,
      }
    })
    .filter((item): item is LikelyUserIntent => Boolean(item))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 5)

  return normalized.length > 0 ? normalized : fallback
}

function buildRuleBasedReport(params: {
  profile: DocumentProfile
  classification: DocumentClassification
  recommendation: DocumentRecommendation
}): GeneratedDocumentOutput {
  return buildRuleBasedOutput(params)
}

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback
  }

  const normalized = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)

  return normalized.length > 0 ? normalized : fallback
}

function normalizeScore(value: unknown, fallback: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback
  }

  return Math.max(0, Math.min(1, value))
}

function normalizePercent(value: unknown, fallback: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback
  }

  return Math.max(0, Math.min(100, Math.round(value)))
}

function normalizeNonNegativeInteger(value: unknown, fallback: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback
  }

  return Math.max(0, Math.round(value))
}

function normalizeActionType(value: unknown) {
  return value === 'dashboard' || value === 'presentation' || value === 'report' ? value : 'report'
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function clampText(value: string, maxChars: number) {
  return value.length > maxChars ? `${value.slice(0, maxChars)}...` : value
}
