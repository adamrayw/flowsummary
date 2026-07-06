import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

import { generateDocumentReportWithAI } from '@/lib/document-intelligence'
import type {
  DocumentClassification,
  DocumentRecommendation,
} from '@/lib/document-intelligence-types'
import { normalizeStoredDocumentProfile } from '@/lib/document-storage'
import { prisma } from '@/lib/prisma'
import { getAuthorizedRaytechUser } from '@/lib/raytech-account'

export async function POST(request: Request) {
  const user = await getAuthorizedRaytechUser(request)
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const payload = (await request.json().catch(() => null)) as {
    documentId?: unknown
    recommendationId?: unknown
  } | null

  const documentId = typeof payload?.documentId === 'string' ? payload.documentId : ''
  const recommendationId =
    typeof payload?.recommendationId === 'string' ? payload.recommendationId : ''

  if (!documentId || !recommendationId) {
    return NextResponse.json(
      { message: 'documentId and recommendationId are required.' },
      { status: 400 },
    )
  }

  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      userId: user.id,
    },
  })

  if (!document) {
    return NextResponse.json({ message: 'Document not found.' }, { status: 404 })
  }

  if (!document.sourceText) {
    return NextResponse.json(
      { message: 'This document does not have source text available for report generation.' },
      { status: 409 },
    )
  }

  const profile = normalizeStoredDocumentProfile({
    value: document.extractionContext,
    filename: document.filename,
    fileType: document.fileType,
  })
  const recommendations = normalizeRecommendations(document.recommendations)
  const selectedRecommendation = recommendations.find(
    (recommendation) => recommendation.id === recommendationId,
  )

  if (!profile || !selectedRecommendation) {
    return NextResponse.json(
      { message: 'Stored document analysis is incomplete. Upload the document again.' },
      { status: 409 },
    )
  }

  const classification: DocumentClassification = {
    documentType: document.classification || 'Unknown Document',
    confidence: document.confidence ?? 0.5,
    explanation: `The document was classified as ${document.classification || 'Unknown Document'} during upload analysis.`,
    evidence: [
      `${profile.dna.rowCount.toLocaleString('en')} records detected`,
      `${profile.dna.columnCount.toLocaleString('en')} columns or structural fields detected`,
    ],
    alternativeTypes: [],
  }

  try {
    const generated = await generateDocumentReportWithAI({
      sourceText: document.sourceText,
      profile,
      classification,
      recommendation: selectedRecommendation,
    })

    const saved = await prisma.generatedReport.create({
      data: {
        documentId: document.id,
        userId: user.id,
        title: generated.output.title,
        reportType: selectedRecommendation.templateId,
        content: {
          ...generated.output,
          model: generated.model,
          recommendationId: selectedRecommendation.id,
        } as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        title: true,
        reportType: true,
        content: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      report: {
        id: saved.id,
        documentId: document.id,
        title: saved.title,
        reportType: saved.reportType,
        output: generated.output,
        model: generated.model,
        createdAt: saved.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('[document-report] failed', error)

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : 'Failed to generate report.',
      },
      { status: 500 },
    )
  }
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

function getString(value: Prisma.JsonValue | undefined) {
  return typeof value === 'string' ? value.trim() : ''
}

function getNumber(value: Prisma.JsonValue | undefined, fallback: number) {
  return typeof value === 'number' && !Number.isNaN(value) ? value : fallback
}

function getStringArray(value: Prisma.JsonValue | undefined) {
  if (!Array.isArray(value)) {
    return ['PDF', 'DOCX']
  }

  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

function getActionType(value: Prisma.JsonValue | undefined) {
  return value === 'dashboard' || value === 'presentation' || value === 'report'
    ? value
    : 'report'
}
