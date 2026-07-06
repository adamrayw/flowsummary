import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { getAuthorizedRaytechUser } from '@/lib/raytech-account'
import type { SummaryListItem } from '@/lib/summary-types'

export async function GET(request: Request) {
  const user = await getAuthorizedRaytechUser(request)
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const documents = await prisma.document.findMany({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      filename: true,
      classification: true,
      createdAt: true,
      updatedAt: true,
      reports: {
        select: {
          title: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 1,
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: 50,
  })

  const summaries: SummaryListItem[] = documents.map((document) => {
    const latestReport = document.reports[0]
    const title =
      latestReport?.title ||
      [document.classification || 'Document Analysis', document.filename]
        .filter(Boolean)
        .join(' - ')

    return {
      id: document.id,
      title,
      template: document.classification,
      createdAt: document.createdAt.toISOString(),
      updatedAt: (latestReport?.updatedAt || document.updatedAt).toISOString(),
    }
  })

  return NextResponse.json({ summaries })
}
