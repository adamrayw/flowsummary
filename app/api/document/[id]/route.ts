import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

import type {
  DocumentHealth,
  LikelyUserIntent,
  DocumentRecommendation,
  GeneratedDocumentReport,
} from '@/lib/document-intelligence-types'
import { normalizeStoredDocumentProfile } from '@/lib/document-storage'
import { prisma } from '@/lib/prisma'
import { getAuthorizedRaytechUser } from '@/lib/raytech-account'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getAuthorizedRaytechUser(request)
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const document = await prisma.document.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      reports: {
        orderBy: {
          updatedAt: 'desc',
        },
        take: 1,
      },
    },
  })

  if (!document) {
    return NextResponse.json({ message: 'Document not found.' }, { status: 404 })
  }

  const profile = normalizeStoredDocumentProfile({
    value: document.extractionContext,
    filename: document.filename,
    fileType: document.fileType,
  })
  const recommendations = normalizeRecommendations(document.recommendations)
  const storedAnalysis = normalizeAnalysisContext(document.analysisContext)
  const latestReport = document.reports[0]
  const output = latestReport ? normalizeReportOutput(latestReport.content) : null

  if (!profile) {
    return NextResponse.json(
      { message: 'Stored document analysis is incomplete.' },
      { status: 409 },
    )
  }

  return NextResponse.json({
    analysis: {
      documentId: document.id,
      filename: document.filename,
      profile,
      classification: {
        documentType: document.classification || 'Unknown Document',
        confidence: document.confidence ?? 0.5,
        explanation: `I identified this as ${document.classification || 'an Unknown Document'} based on the stored document profile and extracted structure.`,
      },
      contextSummary:
        pickNonEmpty(storedAnalysis.contextSummary) ||
        buildContextSummary(profile, document.classification, document.confidence),
      documentHealth: storedAnalysis.documentHealth || buildDocumentHealth(profile),
      keyFindings:
        pickNonEmpty(storedAnalysis.keyFindings) ||
        buildKeyFindings(profile, document.classification, document.confidence),
      aiInterpretation:
        storedAnalysis.aiInterpretation ||
        `This document is most useful as a management analysis input because it contains ${profile.dna.rowCount.toLocaleString('en')} records or structural lines that can be summarized, reviewed, and turned into actions.`,
      likelyUserIntent:
        pickNonEmpty(storedAnalysis.likelyUserIntent) ||
        buildLikelyUserIntent(document.classification || 'Unknown Document'),
      insightPreview:
        pickNonEmpty(storedAnalysis.insightPreview) ||
        buildInsightPreview(profile, document.classification, document.confidence),
      recommendations,
      model: output?.model || storedAnalysis.model || 'stored-analysis',
    },
    report: output
      ? {
          id: latestReport.id,
          title: latestReport.title,
          output,
          model: output.model,
          createdAt: latestReport.createdAt.toISOString(),
        }
      : null,
  })
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getAuthorizedRaytechUser(request)
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const document = await prisma.document.findFirst({
    where: {
      id,
      userId: user.id,
    },
    select: {
      id: true,
    },
  })

  if (!document) {
    return NextResponse.json({ message: 'Document not found.' }, { status: 404 })
  }

  await prisma.document.delete({
    where: {
      id,
    },
  })

  return NextResponse.json({ ok: true })
}

function normalizeRecommendations(value: Prisma.JsonValue): DocumentRecommendation[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null
      }

      const record = item as Record<string, Prisma.JsonValue>
      const id = getString(record.id)
      const title = getString(record.title)
      const description = getString(record.description)
      const templateId = getString(record.templateId)

      if (!id || !title || !description || !templateId) {
        return null
      }

      return {
        id,
        title,
        description,
        isPrimary: Boolean(record.isPrimary),
        type: getActionType(record.type),
        priorityScore: getNumber(record.priorityScore, 0.7),
        confidence: getNumber(record.confidence, 0.7),
        whyRecommended: getString(record.whyRecommended) || description,
        templateId,
        exportFormats: getStringArray(record.exportFormats),
      }
    })
    .filter((item): item is DocumentRecommendation => Boolean(item))
}

function normalizeReportOutput(value: Prisma.JsonValue) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const record = value as Record<string, Prisma.JsonValue>
  const title = getString(record.title)
  const summary = getString(record.summary)
  const keyInsights = getStringArray(record.keyInsights)
  const recommendations = getStringArray(record.recommendations)
  const conclusion = getString(record.conclusion)

  if (!title || !summary || keyInsights.length === 0 || recommendations.length === 0 || !conclusion) {
    return null
  }

  return {
    title,
    summary,
    keyInsights,
    recommendations,
    conclusion,
    model: getString(record.model),
  } satisfies GeneratedDocumentReport & { model: string }
}

function buildInsightPreview(
  profile: NonNullable<ReturnType<typeof normalizeStoredDocumentProfile>>,
  classification: string | null,
  confidence: number | null,
) {
  const preview = [
    'I analyzed your document.',
    `Classified as ${classification || 'Unknown Document'} with ${Math.round((confidence ?? 0.5) * 100)}% confidence.`,
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
  if (profile.potentialIssues.length > 0) {
    preview.push(profile.potentialIssues[0])
  }

  return preview
}

function normalizeAnalysisContext(value: Prisma.JsonValue) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  const record = value as Record<string, Prisma.JsonValue>

  return {
    contextSummary: getStringArray(record.contextSummary),
    documentHealth: normalizeDocumentHealth(record.documentHealth),
    keyFindings: getStringArray(record.keyFindings),
    aiInterpretation: getString(record.aiInterpretation),
    likelyUserIntent: normalizeLikelyUserIntent(record.likelyUserIntent),
    insightPreview: getStringArray(record.insightPreview),
    model: getString(record.model),
  }
}

function pickNonEmpty<T>(items: T[] | undefined) {
  return items && items.length > 0 ? items : null
}

function buildContextSummary(
  profile: NonNullable<ReturnType<typeof normalizeStoredDocumentProfile>>,
  classification: string | null,
  confidence: number | null,
) {
  const summary = [
    `Document type: ${classification || 'Unknown Document'} (${Math.round((confidence ?? 0.5) * 100)}% confidence).`,
    `Language: ${profile.language}.`,
    `Structure: ${profile.file.type}${profile.file.sheets ? ` with ${profile.file.sheets} sheet(s)` : ''}${profile.file.pages ? ` with ${profile.file.pages} page(s)` : ''}.`,
    `Volume: ${profile.dna.rowCount.toLocaleString('en')} records and ${profile.dna.columnCount.toLocaleString('en')} columns or structural fields.`,
  ]

  if (profile.dna.dateRange) summary.push(`Reporting period: ${profile.dna.dateRange}.`)
  if (profile.mainMetrics.length > 0) summary.push(`Measures: ${profile.mainMetrics.slice(0, 6).join(', ')}.`)
  if (profile.keyDimensions.length > 0) summary.push(`Dimensions: ${profile.keyDimensions.slice(0, 6).join(', ')}.`)

  return summary
}

function buildDocumentHealth(
  profile: NonNullable<ReturnType<typeof normalizeStoredDocumentProfile>>,
): DocumentHealth {
  const totalCells = Math.max(1, profile.dna.rowCount * Math.max(1, profile.dna.columnCount))
  const completeness = Math.max(0, Math.round((1 - profile.dna.missingValues / totalCells) * 100))
  const consistency = Math.max(50, 100 - Math.min(30, profile.dna.duplicates))
  const reliability = Math.max(40, Math.round((completeness + consistency) / 2))
  const overallScore = Math.round(completeness * 0.4 + consistency * 0.3 + reliability * 0.3)

  return {
    overallScore,
    completeness,
    consistency,
    reliability,
    missingValues: profile.dna.missingValues,
    duplicates: profile.dna.duplicates,
    outliers: 0,
    potentialRisks: profile.potentialIssues.length,
    explanation:
      profile.potentialIssues.length > 0
        ? `${profile.potentialIssues.length} document quality issue(s) should be reviewed.`
        : 'No major quality issues were found in the stored profile.',
  }
}

function buildKeyFindings(
  profile: NonNullable<ReturnType<typeof normalizeStoredDocumentProfile>>,
  classification: string | null,
  confidence: number | null,
) {
  return [
    `The document was classified as ${classification || 'Unknown Document'} with ${Math.round((confidence ?? 0.5) * 100)}% confidence.`,
    `The document contains ${profile.dna.rowCount.toLocaleString('en')} records and ${profile.dna.columnCount.toLocaleString('en')} columns or structural fields.`,
    profile.dna.dateRange ? `The detected period is ${profile.dna.dateRange}.` : 'No reliable reporting period was detected.',
    profile.mainMetrics.length > 0
      ? `Primary measures include ${profile.mainMetrics.slice(0, 5).join(', ')}.`
      : 'No obvious numeric measures were detected from the stored profile.',
    profile.keyDimensions.length > 0
      ? `Useful dimensions include ${profile.keyDimensions.slice(0, 5).join(', ')}.`
      : 'No strong segmentation dimensions were detected from the stored profile.',
  ]
}

function buildLikelyUserIntent(classification: string): LikelyUserIntent[] {
  const primary =
    classification === 'Financial Report'
      ? 'Board Summary'
      : classification === 'Attendance Report'
        ? 'Attendance Anomaly Investigation'
        : classification === 'Sales Report'
          ? 'Sales Performance Dashboard'
          : 'Executive Summary'

  return [
    {
      objective: primary,
      probability: 0.86,
      reason: 'This is the most common high-value outcome for this document type.',
    },
    {
      objective: 'Data Quality Review',
      probability: 0.62,
      reason: 'The stored profile can be reviewed for completeness, duplicates, and reliability.',
    },
  ]
}

function normalizeDocumentHealth(value: Prisma.JsonValue | undefined): DocumentHealth | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined
  }

  const record = value as Record<string, Prisma.JsonValue>
  return {
    overallScore: getPercent(record.overallScore, 0),
    completeness: getPercent(record.completeness, 0),
    consistency: getPercent(record.consistency, 0),
    reliability: getPercent(record.reliability, 0),
    missingValues: getNumber(record.missingValues, 0),
    duplicates: getNumber(record.duplicates, 0),
    outliers: getNumber(record.outliers, 0),
    potentialRisks: getNumber(record.potentialRisks, 0),
    explanation: getString(record.explanation),
  }
}

function normalizeLikelyUserIntent(value: Prisma.JsonValue | undefined): LikelyUserIntent[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null
      const record = item as Record<string, Prisma.JsonValue>
      const objective = getString(record.objective)
      const reason = getString(record.reason)
      if (!objective || !reason) return null
      return {
        objective,
        probability: getProbability(record.probability, 0.5),
        reason,
      }
    })
    .filter((item): item is LikelyUserIntent => Boolean(item))
}

function getString(value: Prisma.JsonValue | undefined) {
  return typeof value === 'string' ? value.trim() : ''
}

function getNumber(value: Prisma.JsonValue | undefined, fallback: number) {
  return typeof value === 'number' && !Number.isNaN(value) ? value : fallback
}

function getPercent(value: Prisma.JsonValue | undefined, fallback: number) {
  return Math.max(0, Math.min(100, Math.round(getNumber(value, fallback))))
}

function getProbability(value: Prisma.JsonValue | undefined, fallback: number) {
  return Math.max(0, Math.min(1, getNumber(value, fallback)))
}

function getStringArray(value: Prisma.JsonValue | undefined) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

function getActionType(value: Prisma.JsonValue | undefined) {
  return value === 'dashboard' || value === 'presentation' || value === 'report'
    ? value
    : 'report'
}
