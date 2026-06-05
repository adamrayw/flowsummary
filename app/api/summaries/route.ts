import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

import { getAuthorizedRaytechUser } from '@/lib/raytech-account'
import { generateSummaryWithOpenRouter } from '@/lib/openrouter'
import { prisma } from '@/lib/prisma'
import { TEMPLATE_PROMPTS } from '@/lib/constants'
import type { SummaryListItem } from '@/lib/summary-types'

const MAX_INPUT_CHARS = 100_000

function serializeSummaryListItem(summary: {
  id: string
  title: string
  template: string | null
  createdAt: Date
  updatedAt: Date
}): SummaryListItem {
  return {
    id: summary.id,
    title: summary.title,
    template: summary.template,
    createdAt: summary.createdAt.toISOString(),
    updatedAt: summary.updatedAt.toISOString(),
  }
}

function isValidTemplate(templateId: unknown): templateId is keyof typeof TEMPLATE_PROMPTS {
  return typeof templateId === 'string' && templateId in TEMPLATE_PROMPTS
}

export async function GET(request: Request) {
  const user = await getAuthorizedRaytechUser(request)
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const summaries = await prisma.summary.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      title: true,
      template: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ summaries: summaries.map(serializeSummaryListItem) })
}

export async function POST(request: Request) {
  const user = await getAuthorizedRaytechUser(request)
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const payload = (await request.json().catch(() => null)) as {
    sourceText?: unknown
    instructions?: unknown
    templateId?: unknown
  } | null

  const sourceText = typeof payload?.sourceText === 'string' ? payload.sourceText.trim() : ''
  const instructions = typeof payload?.instructions === 'string' ? payload.instructions.trim() : ''
  const rawTemplateId = payload?.templateId
  const templateId = isValidTemplate(rawTemplateId) ? rawTemplateId : null

  if (!sourceText) {
    return NextResponse.json({ message: 'Source text is required.' }, { status: 400 })
  }

  if (sourceText.length > MAX_INPUT_CHARS) {
    return NextResponse.json(
      { message: `Source text is too long. Maximum is ${MAX_INPUT_CHARS} characters.` },
      { status: 400 },
    )
  }

  try {
    const generated = await generateSummaryWithOpenRouter({
      sourceText,
      instructions,
      templateId,
    })

    const saved = await prisma.summary.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        title: generated.output.title,
        template: templateId,
        sourceText,
        instructions: instructions || (templateId ? TEMPLATE_PROMPTS[templateId] : ''),
        summary: generated.output.summary,
        keyInsights: generated.output.keyInsights as Prisma.InputJsonValue,
        recommendations: generated.output.recommendations as Prisma.InputJsonValue,
        conclusion: generated.output.conclusion,
        model: generated.model,
      },
      select: {
        id: true,
        title: true,
        template: true,
        sourceText: true,
        instructions: true,
        summary: true,
        keyInsights: true,
        recommendations: true,
        conclusion: true,
        model: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      summary: {
        id: saved.id,
        title: saved.title,
        template: saved.template,
        sourceText: saved.sourceText,
        instructions: saved.instructions,
        output: {
          title: saved.title,
          summary: saved.summary,
          keyInsights: generated.output.keyInsights,
          recommendations: generated.output.recommendations,
          conclusion: saved.conclusion,
        },
        model: saved.model,
        createdAt: saved.createdAt.toISOString(),
        updatedAt: saved.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : 'Unexpected error while generating summary.',
      },
      { status: 500 },
    )
  }
}
