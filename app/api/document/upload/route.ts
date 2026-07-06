import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

import { analyzeDocumentWithAI } from '@/lib/document-intelligence'
import { buildDocumentProfile } from '@/lib/document-profiler'
import { extractTextFromFile } from '@/lib/file-extractors'
import { prisma } from '@/lib/prisma'
import { getAuthorizedRaytechUser } from '@/lib/raytech-account'

const MAX_FILE_BYTES = 15 * 1024 * 1024

export async function POST(req: NextRequest) {
  const user = await getAuthorizedRaytechUser(req)
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ message: 'No file provided.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { message: 'File is too large. Maximum upload size is 15MB.' },
        { status: 400 },
      )
    }

    const extraction = await extractTextFromFile(file)
    const sourceText = extraction.text.trim()

    if (!sourceText) {
      return NextResponse.json(
        { message: 'No readable content was found in this file.' },
        { status: 400 },
      )
    }

    const profile = await buildDocumentProfile(file, extraction)

    const document = await prisma.document.create({
      data: {
        userId: user.id,
        filename: file.name,
        fileType: extraction.metadata.type,
        sourceText,
        extractionContext: profile as unknown as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        filename: true,
      },
    })

    const analysis = await analyzeDocumentWithAI({
      documentId: document.id,
      filename: document.filename,
      sourceText,
      profile,
    })

    await prisma.document.update({
      where: {
        id: document.id,
      },
      data: {
        classification: analysis.classification.documentType,
        confidence: analysis.classification.confidence,
        extractionContext: analysis.profile as unknown as Prisma.InputJsonValue,
        analysisContext: {
          contextSummary: analysis.contextSummary,
          documentHealth: analysis.documentHealth,
          keyFindings: analysis.keyFindings,
          aiInterpretation: analysis.aiInterpretation,
          likelyUserIntent: analysis.likelyUserIntent,
          insightPreview: analysis.insightPreview,
          model: analysis.model,
        } as unknown as Prisma.InputJsonValue,
        recommendations: analysis.recommendations as unknown as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({
      analysis: {
        documentId: document.id,
        filename: document.filename,
        ...analysis,
      },
    })
  } catch (error) {
    console.error('[document-upload] failed', error)

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : 'Failed to process document.',
      },
      { status: 500 },
    )
  }
}
