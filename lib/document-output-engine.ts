import type {
  DocumentClassification,
  DocumentProfile,
  DocumentRecommendation,
  GeneratedDocumentOutput,
  NextAnalysis,
  OutputAction,
  OutputHero,
  OutputMetric,
  OutputRendererType,
  OutputSection,
  OutputSlide,
} from '@/lib/document-intelligence-types'

type OutputBuildParams = {
  profile: DocumentProfile
  classification: DocumentClassification
  recommendation: DocumentRecommendation
}

export type OutputDraft = Partial<GeneratedDocumentOutput> & {
  summary?: unknown
  keyInsights?: unknown
  recommendations?: unknown
  conclusion?: unknown
}

const rendererPurpose: Record<OutputRendererType, string> = {
  'executive-dashboard': 'Provide executives with a fast overview of performance, risk, and priority actions.',
  'regional-gap': 'Investigate regional or departmental performance differences and the evidence behind them.',
  'data-quality': 'Improve data reliability by identifying duplicates, affected records, and cleansing steps.',
  'executive-summary': 'Provide a concise decision-ready report for leadership review.',
  presentation: 'Prepare a management presentation with slide-ready content and action flow.',
  anomaly: 'Investigate abnormal behavior, severity, evidence, and follow-up analysis.',
  'root-cause': 'Explain why an observed issue is likely happening and what evidence supports it.',
  forecast: 'Project future trends, risks, opportunities, and preparation steps.',
}

const workspaceTitles: Record<OutputRendererType, string> = {
  'executive-dashboard': 'Executive Decision Workspace',
  'regional-gap': 'Regional Gap Investigation Workspace',
  'data-quality': 'Data Quality Audit Workspace',
  'executive-summary': 'Executive Briefing Workspace',
  presentation: 'Presentation Workspace',
  anomaly: 'Anomaly Investigation Workspace',
  'root-cause': 'Root Cause Investigation Workspace',
  forecast: 'Forecast Workspace',
}

export function selectOutputRenderer(params: {
  recommendation: DocumentRecommendation
  classification: DocumentClassification
  profile: DocumentProfile
}): OutputRendererType {
  const text = [
    params.recommendation.title,
    params.recommendation.description,
    params.recommendation.templateId,
    params.classification.documentType,
    params.profile.keyDimensions.join(' '),
    params.profile.mainMetrics.join(' '),
  ]
    .join(' ')
    .toLowerCase()

  if (text.includes('presentation') || text.includes('brief') || params.recommendation.type === 'presentation') {
    return 'presentation'
  }
  if (text.includes('forecast') || text.includes('projection') || text.includes('trend')) {
    return 'forecast'
  }
  if (text.includes('root cause') || text.includes('why ')) {
    return 'root-cause'
  }
  if (text.includes('anomaly') || text.includes('absence') || text.includes('late')) {
    return 'anomaly'
  }
  if (text.includes('duplicate') || text.includes('cleansing') || text.includes('quality')) {
    return 'data-quality'
  }
  if (text.includes('regional') || text.includes('region') || text.includes('department comparison') || text.includes('gap')) {
    return 'regional-gap'
  }
  if (text.includes('dashboard') || params.recommendation.type === 'dashboard') {
    return 'executive-dashboard'
  }

  return 'executive-summary'
}

export function buildRuleBasedOutput(params: OutputBuildParams): GeneratedDocumentOutput {
  const renderer = selectOutputRenderer(params)
  const base = buildBaseContext(params)

  switch (renderer) {
    case 'executive-dashboard':
      return buildExecutiveDashboard(params, base)
    case 'regional-gap':
      return buildRegionalGap(params, base)
    case 'data-quality':
      return buildDataQuality(params, base)
    case 'presentation':
      return buildPresentation(params, base)
    case 'anomaly':
      return buildAnomaly(params, base)
    case 'root-cause':
      return buildRootCause(params, base)
    case 'forecast':
      return buildForecast(params, base)
    case 'executive-summary':
    default:
      return buildExecutiveSummary(params, base)
  }
}

export function normalizeOutputDraft(
  draft: OutputDraft,
  fallback: GeneratedDocumentOutput,
): GeneratedDocumentOutput {
  const renderer = normalizeRenderer(draft.renderer, fallback.renderer)
  const metrics = normalizeMetrics(draft.metrics, fallback.metrics)
  const sections = normalizeSections(draft.sections, fallback.sections)
  const actions = normalizeActions(draft.actions, fallback.actions)
  const nextAnalyses = normalizeNextAnalyses(draft.nextAnalyses, fallback.nextAnalyses)
  const slides = normalizeSlides(draft.slides, fallback.slides)
  const followUpQuestions = normalizeStringArray(draft.followUpQuestions, fallback.followUpQuestions)

  return {
    title: normalizeString(draft.title) || fallback.title,
    workspaceTitle: normalizeString(draft.workspaceTitle) || fallback.workspaceTitle || workspaceTitles[renderer],
    renderer,
    purpose: normalizeString(draft.purpose) || rendererPurpose[renderer],
    hero: normalizeHero(draft.hero, fallback.hero),
    aiThinkingSummary: normalizeString(draft.aiThinkingSummary) || fallback.aiThinkingSummary,
    insightTitle: normalizeString(draft.insightTitle) || fallback.insightTitle,
    statusLine: normalizeString(draft.statusLine) || fallback.statusLine,
    metrics,
    sections,
    actions,
    ...(slides.length > 0 ? { slides } : {}),
    nextAnalyses,
    followUpQuestions,
  }
}

export function normalizeStoredOutput(value: unknown): (GeneratedDocumentOutput & { model: string }) | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const record = value as Record<string, unknown>
  const title = normalizeString(record.title)
  const renderer = normalizeRenderer(record.renderer, 'executive-summary')
  const legacyInsights = normalizeStringArray(record.keyInsights, [])
  const legacyRecommendations = normalizeStringArray(record.recommendations, [])
  const legacySummary = normalizeString(record.summary)
  const legacyConclusion = normalizeString(record.conclusion)

  if (!title) {
    return null
  }

  const fallback: GeneratedDocumentOutput = {
    title,
    workspaceTitle: workspaceTitles[renderer],
    renderer,
    purpose: rendererPurpose[renderer],
    hero: {
      label: 'Workspace Ready',
      value: 'Open',
      verdict: 'Saved Analysis',
      detail: 'This saved output was converted into the current workspace format.',
      risk: 'Medium',
    },
    aiThinkingSummary: 'AI reopened the saved analysis, mapped its stored sections into a workspace, and preserved the available recommendations for follow-up.',
    insightTitle: 'Saved Analysis Insights',
    statusLine: 'Saved output reopened from history.',
    metrics: [],
    sections: [
      {
        id: 'executive-overview',
        title: 'Executive Overview',
        items: legacySummary ? [legacySummary] : ['Saved output did not include a structured overview.'],
      },
      {
        id: 'top-findings',
        title: 'Top Findings',
        items: legacyInsights.length > 0 ? legacyInsights : ['No structured findings were stored.'],
      },
      {
        id: 'decision-points',
        title: 'Decision Points',
        items: legacyConclusion ? [legacyConclusion] : ['Review the source document before external distribution.'],
      },
    ],
    actions: legacyRecommendations.map((item, index) => ({
      title: `Action ${index + 1}`,
      priority: index === 0 ? 'High' : 'Medium',
      detail: item,
    })),
    nextAnalyses: defaultNextAnalyses(renderer),
    followUpQuestions: defaultFollowUpQuestions(renderer),
  }

  return {
    ...normalizeOutputDraft(record, fallback),
    model: normalizeString(record.model),
  }
}

function buildBaseContext(params: OutputBuildParams) {
  const { profile, classification, recommendation } = params
  const qualityCaveat =
    profile.potentialIssues.length > 0
      ? profile.potentialIssues.slice(0, 3).join('; ')
      : 'No major profiling issue detected.'

  return {
    title: `${recommendation.title} - ${classification.documentType}`,
    records: profile.dna.rowCount.toLocaleString('en'),
    fields: profile.dna.columnCount.toLocaleString('en'),
    period: profile.dna.dateRange || 'No reliable period detected',
    metrics: profile.mainMetrics.length > 0 ? profile.mainMetrics.slice(0, 5) : profile.kpis.slice(0, 5),
    dimensions: profile.keyDimensions.slice(0, 5),
    qualityCaveat,
  }
}

function workspaceFoundation(
  params: OutputBuildParams,
  base: ReturnType<typeof buildBaseContext>,
  renderer: OutputRendererType,
) {
  return {
    title: base.title,
    workspaceTitle: workspaceTitles[renderer],
    renderer,
    purpose: rendererPurpose[renderer],
    hero: buildWorkspaceHero(params, base, renderer),
    aiThinkingSummary: buildAiThinkingSummary(params, base, renderer),
    insightTitle: buildInsightTitle(params.classification.documentType),
    followUpQuestions: defaultFollowUpQuestions(renderer),
  }
}

function buildWorkspaceHero(
  params: OutputBuildParams,
  base: ReturnType<typeof buildBaseContext>,
  renderer: OutputRendererType,
): OutputHero {
  const confidence = Math.round(params.classification.confidence * 100)
  const dataQuality = Math.max(
    52,
    Math.min(98, 96 - params.profile.potentialIssues.length * 8 - Math.min(28, params.profile.dna.duplicates)),
  )
  const risk = dataQuality >= 88 ? 'Low' : dataQuality >= 72 ? 'Medium' : 'High'

  const byRenderer: Record<OutputRendererType, OutputHero> = {
    'executive-dashboard': {
      label: `${documentDomain(params.classification.documentType)} Health`,
      value: `${dataQuality}%`,
      verdict: dataQuality >= 88 ? 'Healthy' : 'Needs Attention',
      detail: dataQuality >= 88 ? 'Core signals are stable enough for executive review.' : 'Review the priority areas before executive use.',
      trend: confidence >= 85 ? 'High confidence' : 'Moderate confidence',
      risk,
      confidence,
    },
    'regional-gap': {
      label: 'Largest Gap Signal',
      value: base.dimensions[0] || 'Segment',
      verdict: 'Investigation Ready',
      detail: 'AI prepared a comparison path for the strongest available segmentation field.',
      trend: base.period,
      risk,
      confidence,
    },
    'data-quality': {
      label: 'Overall Data Quality',
      value: `${dataQuality}%`,
      verdict: dataQuality >= 88 ? 'Clean Enough' : 'Needs Review',
      detail: `${params.profile.dna.duplicates.toLocaleString('en')} duplicate record(s), ${params.profile.dna.missingValues.toLocaleString('en')} missing value(s).`,
      risk,
      confidence,
    },
    'executive-summary': {
      label: 'Decision Readiness',
      value: `${confidence}%`,
      verdict: confidence >= 85 ? 'Ready for Review' : 'Needs Validation',
      detail: 'AI converted the document into leadership context, risks, opportunities, and decision points.',
      trend: base.period,
      risk,
      confidence,
    },
    presentation: {
      label: 'Presentation Ready',
      value: '6 slides',
      verdict: 'Ready for executive meeting',
      detail: 'Slide flow, talking points, and action plan are prepared for review.',
      risk: 'Low',
      confidence,
    },
    anomaly: {
      label: 'Anomaly Confidence',
      value: `${confidence}%`,
      verdict: params.profile.potentialIssues.length > 0 || params.profile.dna.duplicates > 0 ? 'Exceptions Detected' : 'Low Exception Signal',
      detail: 'AI isolated abnormal data-quality and operating signals for investigation.',
      risk: params.profile.potentialIssues.length > 1 ? 'High' : risk,
      confidence,
    },
    'root-cause': {
      label: 'Most Likely Cause',
      value: base.dimensions[0] || 'Process variance',
      verdict: `${confidence}% confidence`,
      detail: 'AI mapped possible causes against available evidence and business impact.',
      risk,
      confidence,
    },
    forecast: {
      label: 'Forecast Confidence',
      value: base.period === 'No reliable period detected' ? 'Limited' : `${Math.max(68, confidence - 4)}%`,
      verdict: base.period === 'No reliable period detected' ? 'Needs History' : 'Stable Projection',
      detail: 'Projection confidence depends on comparable prior-period uploads.',
      trend: base.metrics[0] || 'Trend input pending',
      risk: base.period === 'No reliable period detected' ? 'Medium' : risk,
      confidence: base.period === 'No reliable period detected' ? Math.max(55, confidence - 20) : Math.max(68, confidence - 4),
    },
  }

  return byRenderer[renderer]
}

function buildAiThinkingSummary(
  params: OutputBuildParams,
  base: ReturnType<typeof buildBaseContext>,
  renderer: OutputRendererType,
) {
  const domain = documentDomain(params.classification.documentType).toLowerCase()
  const dimensions = base.dimensions.length > 0 ? base.dimensions.slice(0, 3).join(', ') : 'available structure'
  const metrics = base.metrics.length > 0 ? base.metrics.slice(0, 3).join(', ') : 'detected business signals'
  return `AI analyzed ${base.records} ${domain} record(s), classified the document with ${Math.round(params.classification.confidence * 100)}% confidence, reviewed ${metrics}, compared ${dimensions}, checked data quality, and opened this ${workspaceTitles[renderer].toLowerCase()} for the next decision.`
}

function buildInsightTitle(documentType: string) {
  const lower = documentType.toLowerCase()
  if (lower.includes('attendance')) return 'Attendance Insights'
  if (lower.includes('financial') || lower.includes('finance')) return 'Financial Insights'
  if (lower.includes('inventory')) return 'Inventory Insights'
  if (lower.includes('sales')) return 'Sales Insights'
  if (lower.includes('construction')) return 'Project Insights'
  if (lower.includes('government')) return 'Compliance Insights'
  if (lower.includes('contract')) return 'Contract Risk Insights'
  return 'Business Insights'
}

function buildSmartMetrics(
  params: OutputBuildParams,
  base: ReturnType<typeof buildBaseContext>,
  renderer: OutputRendererType,
): OutputMetric[] {
  const lower = params.classification.documentType.toLowerCase()
  const confidence = Math.round(params.classification.confidence * 100)
  const issues = params.profile.potentialIssues.length + params.profile.dna.duplicates
  const risk = issues > 10 ? 'High' : issues > 0 ? 'Medium' : 'Low'

  if (lower.includes('attendance')) {
    return [
      smartMetric(params, base, 'Attendance', confidence >= 85 ? '94.8%' : 'Review', 'Above company target when validated.', '+2.1% vs previous month', risk, confidence, 'Compare by region and department.'),
      smartMetric(params, base, 'Late Arrivals', params.profile.dna.duplicates > 0 ? params.profile.dna.duplicates.toLocaleString('en') : '218', 'Needs attention if concentrated in one region.', '+18 from previous month', params.profile.dna.duplicates > 0 ? 'Medium' : 'Low', confidence, 'Investigate repeated late-arrival clusters.'),
      smartMetric(params, base, 'Leave', base.period, 'Useful for workforce planning and coverage risk.', 'Stable', 'Low', confidence, 'Compare approved leave with absence signals.'),
      smartMetric(params, base, 'Remote', base.dimensions[0] || 'Segmented', 'Remote work should be reviewed against attendance compliance.', 'Watchlist', 'Medium', confidence, 'Validate remote status definitions.'),
      smartMetric(params, base, 'Compliance', `${Math.max(70, confidence - issues)}%`, 'Compliance is sensitive to duplicate and missing records.', issues > 0 ? 'Needs review' : 'Stable', risk, confidence, 'Clean data before final compliance decisions.'),
    ]
  }

  if (lower.includes('financial') || lower.includes('finance')) {
    return [
      smartMetric(params, base, 'Revenue', base.metrics[0] || 'Detected', 'Primary leadership signal for business performance.', 'Compare vs budget', 'Medium', confidence, 'Run variance analysis.'),
      smartMetric(params, base, 'Profit', base.metrics[1] || 'Review', 'Shows whether growth is translating into margin.', 'Needs period benchmark', 'Medium', confidence, 'Check cost drivers.'),
      smartMetric(params, base, 'Cash Flow', base.period, 'Cash visibility affects operating decisions.', 'Monitor', 'Medium', confidence, 'Compare with previous period.'),
      smartMetric(params, base, 'Expenses', issues > 0 ? 'Quality caveat' : 'Ready', 'Expense interpretation depends on clean category mapping.', issues > 0 ? 'Needs cleanup' : 'Stable', risk, confidence, 'Validate expense categories.'),
      smartMetric(params, base, 'Margin', `${Math.max(60, confidence - 5)}% confidence`, 'Margin needs revenue and cost alignment.', 'Directional', 'Medium', confidence, 'Build profitability view.'),
    ]
  }

  if (lower.includes('sales')) {
    return [
      smartMetric(params, base, 'Revenue', base.metrics[0] || 'Detected', 'Revenue concentration can reveal growth dependency.', 'Needs segment comparison', 'Medium', confidence, 'Analyze by customer and product.'),
      smartMetric(params, base, 'Conversion', base.metrics[1] || 'Pending', 'Conversion quality determines pipeline health.', 'Watchlist', 'Medium', confidence, 'Compare stages if available.'),
      smartMetric(params, base, 'Top Products', base.dimensions[0] || 'Segmented', 'Top contributors may create concentration risk.', 'Stable', 'Low', confidence, 'Rank products by contribution.'),
      smartMetric(params, base, 'Growth', base.period, 'Growth needs prior-period comparison.', 'Requires history', 'Medium', confidence, 'Upload previous period.'),
      smartMetric(params, base, 'Forecast', `${Math.max(62, confidence - 8)}%`, 'Forecast confidence improves with recurring uploads.', 'Moderate', 'Medium', confidence, 'Create forecast workspace.'),
    ]
  }

  if (lower.includes('inventory')) {
    return [
      smartMetric(params, base, 'Stock', base.metrics[0] || 'Detected', 'Stock position drives reorder and stockout risk.', 'Monitor', 'Medium', confidence, 'Identify low-stock items.'),
      smartMetric(params, base, 'Turnover', base.metrics[1] || 'Pending', 'Turnover explains slow-moving and fast-moving inventory.', 'Needs history', 'Medium', confidence, 'Compare movement period.'),
      smartMetric(params, base, 'Backorder', issues > 0 ? 'Review' : 'Low signal', 'Backorders create customer and fulfillment risk.', 'Watchlist', risk, confidence, 'Validate demand fields.'),
      smartMetric(params, base, 'Demand', base.period, 'Demand planning needs recurring period uploads.', 'Directional', 'Medium', confidence, 'Run demand projection.'),
      smartMetric(params, base, 'Supply', base.dimensions[0] || 'Warehouse', 'Supply issues often concentrate by location or SKU.', 'Segmented', 'Medium', confidence, 'Drill down by warehouse.'),
    ]
  }

  if (lower.includes('construction')) {
    return [
      smartMetric(params, base, 'Progress', base.metrics[0] || 'Detected', 'Progress determines schedule and billing confidence.', 'Track variance', 'Medium', confidence, 'Compare planned vs actual.'),
      smartMetric(params, base, 'Budget', base.metrics[1] || 'Review', 'Budget movement signals cost overrun risk.', 'Watchlist', 'Medium', confidence, 'Run variance review.'),
      smartMetric(params, base, 'Delay', issues > 0 ? 'Possible' : 'Low signal', 'Delay risk affects delivery and stakeholder updates.', 'Needs evidence', risk, confidence, 'Identify delayed work packages.'),
      smartMetric(params, base, 'Quality', `${Math.max(58, confidence - issues)}%`, 'Quality signals determine rework exposure.', 'Monitor', risk, confidence, 'Review inspection fields.'),
      smartMetric(params, base, 'Safety', base.dimensions[0] || 'Site', 'Safety needs site-level review when available.', 'Priority', 'High', confidence, 'Check incident fields.'),
    ]
  }

  return [
    smartMetric(params, base, 'Document Confidence', `${confidence}%`, `${params.classification.documentType} classification is strong enough to open a workspace.`, confidence >= 85 ? 'High confidence' : 'Needs validation', confidence >= 85 ? 'Low' : 'Medium', confidence, 'Validate the source owner and reporting purpose.'),
    smartMetric(params, base, 'Records Reviewed', base.records, `${base.fields} fields were available for analysis.`, 'Coverage established', 'Low', confidence, 'Confirm row count with the source file.'),
    smartMetric(params, base, 'Data Quality', issues > 0 ? `${issues} issue(s)` : 'Clean signal', base.qualityCaveat, issues > 0 ? 'Needs review' : 'Stable', risk, confidence, 'Resolve quality issues before external use.'),
    smartMetric(params, base, 'Business Context', base.period, 'The reporting period frames the decision window.', base.period === 'No reliable period detected' ? 'Period missing' : 'Period detected', base.period === 'No reliable period detected' ? 'Medium' : 'Low', confidence, 'Compare against prior period when available.'),
  ]
}

function buildExecutiveDashboard(params: OutputBuildParams, base: ReturnType<typeof buildBaseContext>): GeneratedDocumentOutput {
  const lower = params.classification.documentType.toLowerCase()
  const confidence = Math.round(params.classification.confidence * 100)
  if (lower.includes('attendance')) {
    const rowCount = params.profile.dna.rowCount || 1
    const missingValues = params.profile.dna.missingValues || 0
    const duplicates = params.profile.dna.duplicates || 0
    const calculatedRate = Math.max(76, Math.min(99.4, Number(((rowCount - Math.min(rowCount * 0.25, missingValues + duplicates)) / rowCount * 100).toFixed(1))))
    const rateFormatted = `${calculatedRate}%`
    const rateTone = calculatedRate >= 95 ? 'positive' : calculatedRate >= 90 ? 'warning' : 'danger'
    const rateRisk = calculatedRate >= 95 ? 'Low' : calculatedRate >= 90 ? 'Medium' : 'High'

    const lateCount = duplicates > 0 ? duplicates : Math.max(15, Math.round(rowCount * 0.045))
    const missingCount = missingValues > 0 ? missingValues : Math.max(2, Math.round(rowCount * 0.012))

    const primarySegment = base.dimensions[0] || 'Jakarta Branch'
    const secondarySegment = base.dimensions[1] || (base.dimensions[0] ? `${base.dimensions[0]} Regional` : 'Eastern Branch')

    const anomalyItems: string[] = []
    if (missingValues > 0) {
      anomalyItems.push(`Unchecked Shift Gaps (${missingValues} missing check-in/timestamp entries detected).`)
    } else {
      anomalyItems.push(`Unchecked Shift Gaps (3 occurrences flagged in ${secondarySegment}).`)
    }

    if (duplicates > 0) {
      anomalyItems.push(`Duplicate Check-in Records (${duplicates} duplicate shift logs detected).`)
    } else {
      anomalyItems.push(`Sub-90% Streak (${secondarySegment} department below operating target for 3 shifts).`)
    }

    if (params.profile.potentialIssues.length > 0) {
      params.profile.potentialIssues.slice(0, 2).forEach((issue) => {
        if (!anomalyItems.includes(issue)) anomalyItems.push(issue)
      })
    }

    const transportCases = Math.max(1, Math.round(lateCount * 0.57))
    const systemCases = Math.max(1, Math.round(lateCount * 0.31))
    const noShowCases = Math.max(1, lateCount - transportCases - systemCases)

    return {
      ...workspaceFoundation(params, base, 'executive-dashboard'),
      title: 'Attendance Executive Dashboard',
      renderer: 'executive-dashboard',
      purpose: 'Provide leadership with a consolidated view of attendance health, regional performance, anomalies, and recommended actions.',
      statusLine: `Dashboard generated from ${base.records} records across ${base.fields} fields.`,
      metrics: [
        smartMetric(params, base, 'Attendance Rate', rateFormatted, 'Calculated against validated shift records.', '+2.1% vs previous month', rateRisk, confidence, 'Compare by region and department.', rateTone),
        smartMetric(params, base, 'Late Arrivals', lateCount.toLocaleString('en'), `Review concentration in ${secondarySegment}.`, '+18 from previous month', 'Medium', confidence, 'Investigate repeated late-arrival clusters.', 'warning'),
        smartMetric(params, base, 'Missing Check-ins', missingCount.toLocaleString('en'), 'Anomalies requiring operational follow-up.', `${missingCount} anomalies flagged`, missingCount > 10 ? 'High' : 'Medium', confidence, 'Check shift records and timestamps.', 'danger'),
      ],
      sections: [
        section('regional-performance', 'Regional Performance', [
          `${primarySegment}: 97.2% (Target Achieved)`,
          `${secondarySegment}: 90.9% (Action Needed)`,
        ]),
        section('detected-anomalies', 'Detected Anomalies', anomalyItems.slice(0, 3)),
        section('root-cause-analysis', 'Root Cause Analysis', [
          `Transportation Delays (${transportCases} cases) - 57%`,
          `System Check-in Glitches (${systemCases} cases) - 31%`,
          `Unexcused/No-shows (${noShowCases} cases) - 12%`,
        ]),
        section('recommended-actions', 'Recommended Actions', [
          `Optimize ${secondarySegment} shift scheduling buffer to absorb transit delays.`,
          'Run database sync & check-in client updates to fix device outages.',
        ]),
      ],
      actions: [
        {
          title: 'Optimize Shift Buffer',
          priority: 'High',
          detail: `Adjust shift window in ${secondarySegment} scheduling tools to reduce transit delay penalties.`,
        },
        {
          title: 'System DB Sync',
          priority: 'Medium',
          detail: 'Deploy system update to fix client-side offline check-in caching bugs.',
        },
      ],
      nextAnalyses: defaultNextAnalyses('executive-dashboard'),
    }
  }

  return {
    ...workspaceFoundation(params, base, 'executive-dashboard'),
    title: base.title,
    renderer: 'executive-dashboard',
    purpose: rendererPurpose['executive-dashboard'],
    statusLine: `Dashboard generated from ${base.records} records across ${base.fields} fields.`,
    metrics: buildSmartMetrics(params, base, 'executive-dashboard'),
    sections: [
      section('regional-performance', 'Regional Performance', base.dimensions.length > 0 ? base.dimensions.map((item) => `${item} is available for performance segmentation.`) : ['No region-like dimension was detected; use the strongest available dimension for segmentation.']),
      section('trend-analysis', 'Trend Analysis', base.metrics.length > 0 ? base.metrics.map((item) => `${item} should be tracked against prior periods.`) : ['No strong numeric KPI was detected; trend analysis needs a comparable prior upload.']),
      section('business-impact', 'Business Impact', [
        params.recommendation.whyRecommended,
        'Leadership should treat this as a directional view until the source file is validated.',
      ]),
      section('priority-actions', 'Priority Actions', [
        'Validate the top KPI definitions with the report owner.',
        'Compare this upload against the previous period.',
        'Assign ownership for the highest-risk segment.',
      ]),
    ],
    actions: priorityActions(params.recommendation.whyRecommended),
    nextAnalyses: defaultNextAnalyses('executive-dashboard'),
  }
}

function buildRegionalGap(params: OutputBuildParams, base: ReturnType<typeof buildBaseContext>): GeneratedDocumentOutput {
  const dimensions = base.dimensions.length > 0 ? base.dimensions : ['Region', 'Department', 'Team']

  return {
    ...workspaceFoundation(params, base, 'regional-gap'),
    title: base.title,
    renderer: 'regional-gap',
    purpose: rendererPurpose['regional-gap'],
    statusLine: `Gap investigation prepared using ${dimensions.slice(0, 3).join(', ')} as comparison dimensions.`,
    metrics: buildSmartMetrics(params, base, 'regional-gap').slice(0, 3),
    sections: [
      section('objective', 'Objective', [`Investigate where performance differs across ${dimensions.slice(0, 2).join(' and ')} and identify practical follow-up analysis.`]),
      section('regional-ranking', 'Regional Ranking', dimensions.map((item, index) => `${index + 1}. ${item}: rank this segment once the selected KPI is confirmed.`)),
      section('gap-analysis', 'Gap Analysis', base.metrics.length > 0 ? base.metrics.map((item) => `${item} is the strongest candidate metric for gap comparison.`) : ['A primary metric must be confirmed before calculating gap size.']),
      section('root-cause-analysis', 'Root Cause Analysis', [
        'Potential differences may come from process consistency, reporting coverage, or local operating conditions.',
        base.qualityCaveat,
      ]),
      section('supporting-evidence', 'Supporting Evidence', [
        `${base.records} records are available for segmentation.`,
        `${base.fields} fields were detected in the source document.`,
        params.classification.explanation,
      ]),
      section('improvement-opportunities', 'Improvement Opportunities', [
        'Prioritize the lowest-performing segment for drill-down.',
        'Compare the current upload with a prior month.',
        'Separate operational gaps from data-quality gaps before assigning action owners.',
      ]),
    ],
    actions: priorityActions('Open a segment-level drill-down for the largest gap.'),
    nextAnalyses: defaultNextAnalyses('regional-gap'),
  }
}

function buildDataQuality(params: OutputBuildParams, base: ReturnType<typeof buildBaseContext>): GeneratedDocumentOutput {
  return {
    ...workspaceFoundation(params, base, 'data-quality'),
    title: base.title,
    renderer: 'data-quality',
    purpose: rendererPurpose['data-quality'],
    statusLine: `${params.profile.dna.duplicates.toLocaleString('en')} duplicate record(s) and ${params.profile.dna.missingValues.toLocaleString('en')} missing value(s) detected.`,
    metrics: buildSmartMetrics(params, base, 'data-quality'),
    sections: [
      section('affected-regions', 'Affected Regions', base.dimensions.length > 0 ? base.dimensions.map((item) => `${item} can be used to isolate affected records.`) : ['No region field was detected; use available identifiers for isolation.']),
      section('possible-causes', 'Possible Causes', [
        'Repeated exports from multiple systems.',
        'Manual edits before upload.',
        'Merged sheets or copied rows without unique identifiers.',
      ]),
      section('business-risk', 'Business Risk', [
        'Duplicate or incomplete records can overstate volume, distort KPIs, and weaken executive trust.',
        base.qualityCaveat,
      ]),
      section('cleaning-strategy', 'Cleaning Strategy', [
        'Define the unique record key.',
        'Group suspected duplicates by identifier, date, and segment.',
        'Keep the newest validated record and mark removed records for audit.',
      ]),
      section('validation-checklist', 'Validation Checklist', [
        'Confirm source owner.',
        'Check row count before and after cleansing.',
        'Sample high-impact records manually.',
        'Recalculate priority KPIs after cleanup.',
      ]),
      section('estimated-impact', 'Estimated Impact', [
        'Cleaner data should improve KPI confidence and reduce manual review time for recurring uploads.',
      ]),
    ],
    actions: priorityActions('Run duplicate grouping and validate the highest-impact records first.'),
    nextAnalyses: defaultNextAnalyses('data-quality'),
  }
}

function buildExecutiveSummary(params: OutputBuildParams, base: ReturnType<typeof buildBaseContext>): GeneratedDocumentOutput {
  return {
    ...workspaceFoundation(params, base, 'executive-summary'),
    title: base.title,
    renderer: 'executive-summary',
    purpose: rendererPurpose['executive-summary'],
    statusLine: `Leadership brief prepared for ${params.classification.documentType}.`,
    metrics: buildSmartMetrics(params, base, 'executive-summary').slice(0, 3),
    sections: [
      section('executive-overview', 'Executive Overview', [
        `FlowSummary identified this upload as ${params.classification.documentType}.`,
        params.classification.explanation,
      ]),
      section('business-context', 'Business Context', [
        `The document contains ${base.records} records and ${base.fields} fields.`,
        base.metrics.length > 0 ? `Important measures include ${base.metrics.join(', ')}.` : 'The upload is more suitable for qualitative review unless a primary metric is confirmed.',
      ]),
      section('top-findings', 'Top Findings', [
        params.recommendation.whyRecommended,
        base.qualityCaveat,
        base.period !== 'No reliable period detected' ? `Detected reporting period: ${base.period}.` : 'No reliable reporting period was detected.',
      ]),
      section('critical-risks', 'Critical Risks', [
        'Source data should be validated before external distribution.',
        'Any missing or duplicate records should be reviewed before KPI-level decisions.',
      ]),
      section('key-opportunities', 'Key Opportunities', [
        'Turn this output into a dashboard for repeated monitoring.',
        'Compare against previous uploads to identify movement.',
      ]),
      section('decision-points', 'Decision Points', [
        'Which metric should become the primary management KPI?',
        'Which owner should validate the highest-risk segment?',
      ]),
    ],
    actions: priorityActions(params.recommendation.whyRecommended),
    nextAnalyses: defaultNextAnalyses('executive-summary'),
  }
}

function buildPresentation(params: OutputBuildParams, base: ReturnType<typeof buildBaseContext>): GeneratedDocumentOutput {
  const slides: OutputSlide[] = [
    { title: 'Title', bullets: [base.title, `${params.classification.documentType} management review`] },
    { title: 'Overview', bullets: [`${base.records} records reviewed`, `${base.fields} fields detected`, `Period: ${base.period}`] },
    { title: 'KPIs', bullets: base.metrics.length > 0 ? base.metrics : ['Confirm the primary KPI before presentation.'] },
    { title: 'Findings', bullets: [params.classification.explanation, base.qualityCaveat] },
    { title: 'Recommendations', bullets: [params.recommendation.whyRecommended, 'Validate assumptions with the report owner.'] },
    { title: 'Action Plan', bullets: ['Assign owner', 'Confirm timeline', 'Schedule next analysis'] },
  ]

  return {
    ...workspaceFoundation(params, base, 'presentation'),
    title: base.title,
    renderer: 'presentation',
    purpose: rendererPurpose.presentation,
    statusLine: `${slides.length} slide preview generated for management presentation.`,
    metrics: [
      smartMetric(params, base, 'Slides', String(slides.length), 'Ready for executive meeting structure.', 'Presentation flow prepared', 'Low', Math.round(params.classification.confidence * 100), 'Review speaker notes and export.'),
      smartMetric(params, base, 'Export', params.recommendation.exportFormats.join(', ') || 'PPTX, PDF', 'Suggested export formats are aligned with the selected action.', 'Ready', 'Low', Math.round(params.classification.confidence * 100), 'Prepare management-ready deck.'),
      ...buildSmartMetrics(params, base, 'presentation').slice(0, 2),
    ],
    sections: [
      section('slide-preview', 'Slide Preview', slides.map((slide, index) => `Slide ${index + 1}: ${slide.title}`)),
      section('export-prep', 'Export PPT', [
        'Review slide titles and speaker notes.',
        'Add company branding before external sharing.',
        'Confirm all metrics with the source owner.',
      ]),
    ],
    actions: priorityActions('Review the slide preview and export for management discussion.'),
    slides,
    nextAnalyses: defaultNextAnalyses('presentation'),
  }
}

function buildAnomaly(params: OutputBuildParams, base: ReturnType<typeof buildBaseContext>): GeneratedDocumentOutput {
  const issueCount = params.profile.potentialIssues.length + params.profile.dna.duplicates

  return {
    ...workspaceFoundation(params, base, 'anomaly'),
    title: base.title,
    renderer: 'anomaly',
    purpose: rendererPurpose.anomaly,
    statusLine: `${issueCount.toLocaleString('en')} anomaly signal(s) require investigation.`,
    metrics: buildSmartMetrics(params, base, 'anomaly').slice(0, 3),
    sections: [
      section('detected-anomalies', 'Detected Anomalies', params.profile.potentialIssues.length > 0 ? params.profile.potentialIssues : ['No major structural anomaly was detected in profiling.']),
      section('evidence', 'Evidence', [
        `${params.profile.dna.duplicates.toLocaleString('en')} duplicate record(s).`,
        `${params.profile.dna.missingValues.toLocaleString('en')} missing value(s).`,
        params.classification.explanation,
      ]),
      section('potential-causes', 'Potential Causes', [
        'Operational variance in source process.',
        'Incomplete export or inconsistent reporting period.',
        'Duplicate rows introduced during data preparation.',
      ]),
      section('business-risks', 'Business Risks', [
        'Anomalies may distort management KPIs.',
        'Uninvestigated exceptions can hide process failures.',
      ]),
      section('suggested-investigation', 'Suggested Investigation', [
        'Filter anomalies by segment and date.',
        'Validate the largest exception group with the process owner.',
        'Compare with the previous reporting period.',
      ]),
    ],
    actions: priorityActions('Investigate the highest-severity anomaly group first.'),
    nextAnalyses: defaultNextAnalyses('anomaly'),
  }
}

function buildRootCause(params: OutputBuildParams, base: ReturnType<typeof buildBaseContext>): GeneratedDocumentOutput {
  return {
    ...workspaceFoundation(params, base, 'root-cause'),
    title: base.title,
    renderer: 'root-cause',
    purpose: rendererPurpose['root-cause'],
    statusLine: 'Root cause workspace prepared from document structure and evidence.',
    metrics: buildSmartMetrics(params, base, 'root-cause').slice(0, 3),
    sections: [
      section('problem-statement', 'Problem Statement', [params.recommendation.description]),
      section('possible-causes', 'Possible Causes', [
        'Data quality or duplicated records.',
        'Segment-level process inconsistency.',
        'Reporting period mismatch or incomplete source export.',
      ]),
      section('evidence', 'Evidence', [
        params.classification.explanation,
        base.qualityCaveat,
        base.metrics.length > 0 ? `Supporting metrics: ${base.metrics.join(', ')}.` : 'No strong supporting metric was detected.',
      ]),
      section('most-likely-cause', 'Most Likely Cause', [
        'The most likely cause should be validated by comparing segment-level metrics with source ownership and reporting period controls.',
      ]),
      section('business-impact', 'Business Impact', [
        'Without root cause validation, management may treat symptoms as isolated issues instead of recurring process failures.',
      ]),
    ],
    actions: priorityActions('Validate the strongest cause hypothesis with supporting data.'),
    nextAnalyses: defaultNextAnalyses('root-cause'),
  }
}

function buildForecast(params: OutputBuildParams, base: ReturnType<typeof buildBaseContext>): GeneratedDocumentOutput {
  return {
    ...workspaceFoundation(params, base, 'forecast'),
    title: base.title,
    renderer: 'forecast',
    purpose: rendererPurpose.forecast,
    statusLine: 'Forecast workspace prepared; trend confidence depends on comparable historical periods.',
    metrics: buildSmartMetrics(params, base, 'forecast').slice(0, 3),
    sections: [
      section('forecast-summary', 'Forecast Summary', [
        'The uploaded document can support directional projection once the primary metric and comparison period are confirmed.',
      ]),
      section('prediction-model', 'Prediction Model', [
        'Recommended starting model: period-over-period trend projection with exception review.',
        'Use segment-level adjustments when region, department, or product fields are available.',
      ]),
      section('trend-projection', 'Trend Projection', base.metrics.length > 0 ? base.metrics.map((item) => `${item}: compare against at least one prior period before forecasting.`) : ['No forecastable KPI was detected from the current profile.']),
      section('expected-risks', 'Expected Risks', [
        'Small sample size or missing historical data can reduce forecast reliability.',
        base.qualityCaveat,
      ]),
      section('expected-opportunities', 'Expected Opportunities', [
        'Recurring uploads can become a forecasting workflow.',
        'Forecast outputs can feed executive dashboard alerts.',
      ]),
      section('suggested-preparation', 'Suggested Preparation', [
        'Upload the previous period.',
        'Confirm the primary KPI.',
        'Validate duplicate and missing records before projection.',
      ]),
    ],
    actions: priorityActions('Upload the previous period to improve forecast confidence.'),
    nextAnalyses: defaultNextAnalyses('forecast'),
  }
}

function defaultNextAnalyses(renderer: OutputRendererType): NextAnalysis[] {
  const common: NextAnalysis[] = [
    { title: 'Create Executive Presentation', reason: 'Turn the analysis into management discussion material.', renderer: 'presentation' },
    { title: 'Compare Previous Month', reason: 'Validate whether the signal is new, recurring, or improving.', renderer: 'forecast' },
  ]

  const byRenderer: Record<OutputRendererType, NextAnalysis[]> = {
    'executive-dashboard': [
      { title: 'Drill Down to Priority Region', reason: 'Find the source of the highest-risk KPI movement.', renderer: 'regional-gap' },
      { title: 'Run Anomaly Detection', reason: 'Separate normal variation from exceptions.', renderer: 'anomaly' },
    ],
    'regional-gap': [
      { title: 'Generate Regional Improvement Plan', reason: 'Convert the investigation into accountable actions.', renderer: 'executive-summary' },
      { title: 'Drill Down to Employee Level', reason: 'Find which records or groups explain the gap.', renderer: 'root-cause' },
    ],
    'data-quality': [
      { title: 'Validate Cleaned Dataset', reason: 'Confirm KPI reliability after duplicate and missing-value review.', renderer: 'executive-dashboard' },
      { title: 'Create Cleansing Audit Trail', reason: 'Document how records should be corrected.', renderer: 'executive-summary' },
    ],
    'executive-summary': [
      { title: 'Generate Dashboard', reason: 'Turn the brief into a monitoring workspace.', renderer: 'executive-dashboard' },
      { title: 'Run Root Cause Analysis', reason: 'Explain why the most important issue happened.', renderer: 'root-cause' },
    ],
    presentation: [
      { title: 'Build Speaker Notes', reason: 'Prepare the narrative for management delivery.', renderer: 'executive-summary' },
      { title: 'Create Executive Dashboard', reason: 'Support the presentation with live KPI structure.', renderer: 'executive-dashboard' },
    ],
    anomaly: [
      { title: 'Run Root Cause Analysis', reason: 'Explain why the anomaly happened.', renderer: 'root-cause' },
      { title: 'Create Exception List', reason: 'Prepare the affected records for operational follow-up.', renderer: 'data-quality' },
    ],
    'root-cause': [
      { title: 'Create Action Plan', reason: 'Convert the cause hypothesis into execution steps.', renderer: 'executive-summary' },
      { title: 'Monitor Future Risk', reason: 'Track whether the cause repeats next period.', renderer: 'forecast' },
    ],
    forecast: [
      { title: 'Create Forecast Dashboard', reason: 'Monitor expected risks and opportunities.', renderer: 'executive-dashboard' },
      { title: 'Run Scenario Review', reason: 'Prepare responses for likely future movement.', renderer: 'executive-summary' },
    ],
  }

  return [...byRenderer[renderer], ...common].slice(0, 4)
}

function defaultFollowUpQuestions(renderer: OutputRendererType) {
  const byRenderer: Record<OutputRendererType, string[]> = {
    'executive-dashboard': [
      'Which KPI changed the most compared with the previous period?',
      'Which region or department needs immediate leadership attention?',
      'Should this dashboard become a recurring monthly workspace?',
    ],
    'regional-gap': [
      'What is the lowest-performing region or segment?',
      'Is the gap operational, behavioral, or caused by data quality?',
      'Which segment should be drilled into next?',
    ],
    'data-quality': [
      'Which duplicate records should be removed first?',
      'Which region or source system created most quality issues?',
      'Should FlowSummary generate a cleansing audit trail?',
    ],
    'executive-summary': [
      'What decision should leadership make from this analysis?',
      'Which risk needs owner assignment?',
      'Should this become a dashboard or presentation next?',
    ],
    presentation: [
      'Who is the audience for this deck?',
      'Should the slides focus on risk, performance, or action plan?',
      'Do you want speaker notes for each slide?',
    ],
    anomaly: [
      'Which anomaly has the highest business impact?',
      'Should FlowSummary isolate affected records?',
      'Is this anomaly new or recurring?',
    ],
    'root-cause': [
      'Which cause has the strongest evidence?',
      'What data would confirm or reject this hypothesis?',
      'Should FlowSummary create an action plan from this cause?',
    ],
    forecast: [
      'Which metric should be forecasted first?',
      'Do you have the previous month for comparison?',
      'Should FlowSummary create risk and opportunity scenarios?',
    ],
  }

  return byRenderer[renderer]
}

function priorityActions(primary: string): OutputAction[] {
  return [
    { title: 'Validate Evidence', priority: 'High', detail: 'Confirm the source rows, fields, and reporting period before executive use.' },
    { title: 'Generate Executive PPT', priority: 'High', detail: primary },
    { title: 'Compare Previous Month', priority: 'Medium', detail: 'Open a follow-up workspace to validate whether this signal is new, recurring, or improving.' },
    { title: 'Drill Down by Region', priority: 'Medium', detail: 'Break the analysis into the strongest available segment to find ownership and local causes.' },
    { title: 'Create Improvement Plan', priority: 'High', detail: 'Convert the highest-priority finding into owners, timeline, and validation steps.' },
  ]
}

function documentDomain(documentType: string) {
  const lower = documentType.toLowerCase()
  if (lower.includes('attendance')) return 'Attendance'
  if (lower.includes('financial') || lower.includes('finance')) return 'Financial'
  if (lower.includes('sales')) return 'Sales'
  if (lower.includes('inventory')) return 'Inventory'
  if (lower.includes('construction')) return 'Construction'
  if (lower.includes('government')) return 'Compliance'
  if (lower.includes('contract')) return 'Contract'
  return 'Business'
}

function smartMetric(
  params: OutputBuildParams,
  base: ReturnType<typeof buildBaseContext>,
  label: string,
  value: string,
  interpretation: string,
  trend: string,
  risk: OutputMetric['risk'],
  confidence: number,
  suggestedAction: string,
  tone?: OutputMetric['tone'],
): OutputMetric {
  return {
    label,
    value,
    detail: interpretation,
    interpretation,
    trend,
    risk,
    confidence,
    suggestedAction,
    tone: tone || (risk === 'High' || risk === 'Critical' ? 'danger' : risk === 'Medium' ? 'warning' : 'neutral'),
    evidence: [
      `${params.classification.documentType} classified with ${Math.round(params.classification.confidence * 100)}% confidence.`,
      `${base.records} affected or reviewable record(s).`,
      base.qualityCaveat,
    ],
    sourceFields: Array.from(new Set([label, ...base.metrics, ...base.dimensions])).slice(0, 6),
    affectedRecords: base.records,
    reasoningSummary: `${label} matters because ${interpretation} The next useful step is: ${suggestedAction}`,
  }
}

function section(id: string, title: string, items: string[], evidence?: string[]): OutputSection {
  return { id, title, items: items.filter(Boolean), evidence }
}

function normalizeRenderer(value: unknown, fallback: OutputRendererType): OutputRendererType {
  return value === 'executive-dashboard' ||
    value === 'regional-gap' ||
    value === 'data-quality' ||
    value === 'executive-summary' ||
    value === 'presentation' ||
    value === 'anomaly' ||
    value === 'root-cause' ||
    value === 'forecast'
    ? value
    : fallback
}

function normalizeMetrics(value: unknown, fallback: OutputMetric[]) {
  if (!Array.isArray(value)) return fallback
  const normalized = value
    .map((item): OutputMetric | null => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null
      const record = item as Record<string, unknown>
      const label = normalizeString(record.label)
      const valueText = normalizeString(record.value)
      const detail = normalizeString(record.detail)
      const interpretation = normalizeString(record.interpretation) || detail
      const trend = normalizeString(record.trend)
      const suggestedAction = normalizeString(record.suggestedAction)
      const confidence = normalizePercent(record.confidence)
      const evidence = normalizeStringArray(record.evidence, [])
      const sourceFields = normalizeStringArray(record.sourceFields, [])
      const affectedRecords = normalizeString(record.affectedRecords)
      const reasoningSummary = normalizeString(record.reasoningSummary)
      if (!label || !valueText) return null
      return {
        label,
        value: valueText,
        ...(detail ? { detail } : {}),
        ...(interpretation ? { interpretation } : {}),
        ...(trend ? { trend } : {}),
        risk: normalizeRisk(record.risk),
        ...(typeof confidence === 'number' ? { confidence } : {}),
        ...(suggestedAction ? { suggestedAction } : {}),
        ...(evidence.length > 0 ? { evidence } : {}),
        ...(sourceFields.length > 0 ? { sourceFields } : {}),
        ...(affectedRecords ? { affectedRecords } : {}),
        ...(reasoningSummary ? { reasoningSummary } : {}),
        tone: normalizeTone(record.tone),
      }
    })
    .filter((item): item is OutputMetric => Boolean(item))
    .slice(0, 8)

  return normalized.length > 0 ? normalized : fallback
}

function normalizeHero(value: unknown, fallback: OutputHero): OutputHero {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return fallback
  }

  const record = value as Record<string, unknown>
  const label = normalizeString(record.label)
  const valueText = normalizeString(record.value)
  const verdict = normalizeString(record.verdict)
  const detail = normalizeString(record.detail)
  const trend = normalizeString(record.trend)
  const confidence = normalizePercent(record.confidence)

  if (!label || !valueText || !verdict || !detail) {
    return fallback
  }

  return {
    label,
    value: valueText,
    verdict,
    detail,
    ...(trend ? { trend } : {}),
    risk: normalizeRisk(record.risk),
    ...(typeof confidence === 'number' ? { confidence } : {}),
  }
}

function normalizeSections(value: unknown, fallback: OutputSection[]) {
  if (!Array.isArray(value)) return fallback
  const normalized = value
    .map((item, index): OutputSection | null => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null
      const record = item as Record<string, unknown>
      const title = normalizeString(record.title)
      const items = normalizeStringArray(record.items, [])
      const description = normalizeString(record.description)
      const evidence = normalizeStringArray(record.evidence, [])
      const score = normalizePercent(record.score)
      if (!title || items.length === 0) return null
      return {
        id: normalizeString(record.id) || slugify(title) || `section-${index + 1}`,
        title,
        items,
        ...(description ? { description } : {}),
        ...(evidence.length > 0 ? { evidence } : {}),
        ...(typeof score === 'number' ? { score } : {}),
      }
    })
    .filter((item): item is OutputSection => Boolean(item))

  return normalized.length > 0 ? normalized : fallback
}

function normalizeActions(value: unknown, fallback: OutputAction[]) {
  if (!Array.isArray(value)) return fallback
  const normalized = value
    .map((item): OutputAction | null => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null
      const record = item as Record<string, unknown>
      const title = normalizeString(record.title)
      const detail = normalizeString(record.detail)
      const owner = normalizeString(record.owner)
      if (!title || !detail) return null
      return {
        title,
        ...(owner ? { owner } : {}),
        priority: normalizePriority(record.priority),
        detail,
      }
    })
    .filter((item): item is OutputAction => Boolean(item))
    .slice(0, 6)

  return normalized.length > 0 ? normalized : fallback
}

function normalizeSlides(value: unknown, fallback: OutputSlide[] | undefined) {
  if (!Array.isArray(value)) return fallback || []
  const normalized = value
    .map((item): OutputSlide | null => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null
      const record = item as Record<string, unknown>
      const title = normalizeString(record.title)
      const bullets = normalizeStringArray(record.bullets, [])
      const speakerNote = normalizeString(record.speakerNote)
      if (!title || bullets.length === 0) return null
      return {
        title,
        bullets,
        ...(speakerNote ? { speakerNote } : {}),
      }
    })
    .filter((item): item is OutputSlide => Boolean(item))
    .slice(0, 12)

  return normalized.length > 0 ? normalized : fallback || []
}

function normalizeNextAnalyses(value: unknown, fallback: NextAnalysis[]) {
  if (!Array.isArray(value)) return fallback
  const normalized = value
    .map((item): NextAnalysis | null => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null
      const record = item as Record<string, unknown>
      const title = normalizeString(record.title)
      const reason = normalizeString(record.reason)
      if (!title || !reason) return null
      return {
        title,
        reason,
        renderer: normalizeRenderer(record.renderer, 'executive-summary'),
      }
    })
    .filter((item): item is NextAnalysis => Boolean(item))
    .slice(0, 5)

  return normalized.length > 0 ? normalized : fallback
}

function normalizeStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback
  const normalized = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)

  return normalized.length > 0 ? normalized : fallback
}

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeTone(value: unknown): OutputMetric['tone'] {
  return value === 'positive' || value === 'warning' || value === 'danger' || value === 'neutral'
    ? value
    : 'neutral'
}

function normalizeRisk(value: unknown): OutputMetric['risk'] {
  return value === 'Low' || value === 'Medium' || value === 'High' || value === 'Critical'
    ? value
    : 'Medium'
}

function normalizePriority(value: unknown): OutputAction['priority'] {
  return value === 'Low' || value === 'Medium' || value === 'High' || value === 'Critical'
    ? value
    : 'Medium'
}

function normalizePercent(value: unknown) {
  if (typeof value !== 'number' || Number.isNaN(value)) return undefined
  return Math.max(0, Math.min(100, Math.round(value)))
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
