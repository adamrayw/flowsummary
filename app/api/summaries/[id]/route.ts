import { NextResponse } from 'next/server'

import { getAuthorizedRaytechUser } from '@/lib/raytech-account'
import { prisma } from '@/lib/prisma'

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getAuthorizedRaytechUser(request)
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const summary = await prisma.summary.findFirst({
    where: {
      id,
      userId: user.id,
    },
  })

  if (!summary) {
    return NextResponse.json({ message: 'Summary not found.' }, { status: 404 })
  }

  return NextResponse.json({
    summary: {
      id: summary.id,
      title: summary.title,
      template: summary.template,
      sourceText: summary.sourceText,
      instructions: summary.instructions,
      output: {
        title: summary.title,
        summary: summary.summary,
        keyInsights: normalizeStringArray(summary.keyInsights),
        recommendations: normalizeStringArray(summary.recommendations),
        conclusion: summary.conclusion,
      },
      model: summary.model,
      createdAt: summary.createdAt.toISOString(),
      updatedAt: summary.updatedAt.toISOString(),
    },
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
  const summary = await prisma.summary.findFirst({
    where: {
      id,
      userId: user.id,
    },
    select: {
      id: true,
    },
  })

  if (!summary) {
    return NextResponse.json({ message: 'Summary not found.' }, { status: 404 })
  }

  await prisma.summary.delete({
    where: {
      id,
    },
  })

  return NextResponse.json({ ok: true })
}
