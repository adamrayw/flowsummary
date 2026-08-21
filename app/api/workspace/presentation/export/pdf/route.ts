import PDFDocument from 'pdfkit'
import { NextResponse } from 'next/server'

import { getAuthorizedRaytechUser } from '@/lib/raytech-account'

type PresentationSlide = {
  title?: string
  subtitle?: string
  bullets?: string[]
  highlights?: string[]
  confidence?: number
  evidence?: string[]
  businessImpact?: string
  speakerNotes?: {
    keyMessage?: string
    emphasize?: string[]
    possibleQuestions?: string[]
    suggestedAnswers?: string[]
  }
}

type PresentationPayload = {
  title?: string
  audience?: string
  style?: string
  sourceWorkspace?: string
  slides?: PresentationSlide[]
}

function cleanString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function cleanStringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
    .map((item) => item.trim())
}

function normalizePresentation(value: unknown): PresentationPayload | null {
  if (typeof value !== 'object' || value === null) return null
  const presentation = value as PresentationPayload
  const slides = Array.isArray(presentation.slides) ? presentation.slides : []
  if (slides.length === 0) return null

  return {
    title: cleanString(presentation.title, 'FlowSummary Presentation'),
    audience: cleanString(presentation.audience, 'Executive Board'),
    style: cleanString(presentation.style, 'Corporate'),
    sourceWorkspace: cleanString(presentation.sourceWorkspace, 'FlowSummary Workspace'),
    slides: slides.slice(0, 20).map((slide) => ({
      title: cleanString(slide.title, 'Untitled Slide'),
      subtitle: cleanString(slide.subtitle),
      bullets: cleanStringArray(slide.bullets).slice(0, 6),
      highlights: cleanStringArray(slide.highlights).slice(0, 4),
      confidence: typeof slide.confidence === 'number' ? slide.confidence : undefined,
      evidence: cleanStringArray(slide.evidence).slice(0, 4),
      businessImpact: cleanString(slide.businessImpact),
      speakerNotes: slide.speakerNotes,
    })),
  }
}

function collectPdf(doc: PDFKit.PDFDocument) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })
}

export async function POST(request: Request) {
  const user = await getAuthorizedRaytechUser(request)
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid JSON payload.' }, { status: 400 })
  }

  const payload = typeof body === 'object' && body !== null ? (body as { presentation?: unknown }) : {}
  const presentation = normalizePresentation(payload.presentation)

  if (!presentation) {
    return NextResponse.json({ message: 'Presentation JSON is required.' }, { status: 400 })
  }

  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 42,
    info: {
      Title: presentation.title,
      Author: 'FlowSummary',
      Subject: presentation.sourceWorkspace,
    },
  })
  const pdfPromise = collectPdf(doc)

  ;(presentation.slides || []).forEach((slide, index) => {
    if (index > 0) doc.addPage()

    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#080B16')
    doc.fillColor('#8B5CF6').fontSize(9).font('Helvetica-Bold').text(presentation.sourceWorkspace || 'FlowSummary', 42, 32)
    doc.fillColor('#94A3B8').fontSize(9).text(String(index + 1).padStart(2, '0'), doc.page.width - 78, 32, { align: 'right' })

    doc.fillColor('#FFFFFF').fontSize(27).font('Helvetica-Bold').text(slide.title || 'Untitled Slide', 42, 74, {
      width: 500,
      lineGap: 2,
    })

    if (slide.subtitle) {
      doc.fillColor('#CBD5E1').fontSize(11).font('Helvetica').text(slide.subtitle, 44, 138, { width: 460 })
    }

    let y = 184
    doc.fillColor('#FFFFFF').fontSize(13).font('Helvetica')
    for (const bullet of slide.bullets || []) {
      doc.circle(54, y + 6, 2.5).fill('#8B5CF6')
      doc.fillColor('#FFFFFF').text(bullet, 68, y, { width: 430, lineGap: 3 })
      y += 42
    }

    let highlightY = 108
    for (const highlight of (slide.highlights || []).slice(0, 3)) {
      doc.roundedRect(548, highlightY, 240, 56, 8).fillAndStroke('#17112F', '#6D4AE8')
      doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold').text(highlight, 566, highlightY + 17, {
        width: 205,
        height: 24,
        ellipsis: true,
      })
      highlightY += 76
    }

    const footer = [
      slide.confidence ? `Confidence ${slide.confidence}%` : '',
      slide.businessImpact ? `Impact: ${slide.businessImpact}` : '',
    ].filter(Boolean).join('   |   ')

    if (footer) {
      doc.fillColor('#CBD5E1').fontSize(8).font('Helvetica').text(footer, 42, doc.page.height - 54, {
        width: doc.page.width - 84,
        ellipsis: true,
      })
    }
  })

  doc.end()
  const buffer = await pdfPromise

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${(presentation.title || 'flowsummary-presentation').replace(/[^\w-]+/g, '-')}.pdf"`,
    },
  })
}
