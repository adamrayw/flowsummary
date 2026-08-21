import { NextResponse } from 'next/server'
import pptxgen from 'pptxgenjs'

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

function themeColors(style?: string) {
  const normalized = style?.toLowerCase()
  if (normalized === 'light') return { bg: 'F8FAFC', fg: '111827', accent: '7C3AED', muted: '475569' }
  if (normalized === 'government') return { bg: '0F172A', fg: 'FFFFFF', accent: '38BDF8', muted: 'CBD5E1' }
  if (normalized === 'financial') return { bg: '07110B', fg: 'FFFFFF', accent: '22C55E', muted: 'C8D5CC' }
  if (normalized === 'startup') return { bg: '120A2A', fg: 'FFFFFF', accent: 'A855F7', muted: 'D8B4FE' }
  return { bg: '080B16', fg: 'FFFFFF', accent: '8B5CF6', muted: 'CBD5E1' }
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

  const colors = themeColors(presentation.style)
  const pptx = new pptxgen()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.author = 'FlowSummary'
  pptx.company = 'RayTech'
  pptx.subject = presentation.sourceWorkspace || presentation.title || 'FlowSummary Workspace'
  pptx.title = presentation.title || 'FlowSummary Presentation'
  pptx.theme = {
    headFontFace: 'Aptos Display',
    bodyFontFace: 'Aptos',
  }

  for (const [index, slideModel] of (presentation.slides || []).entries()) {
    const slide = pptx.addSlide()
    slide.background = { color: colors.bg }

    slide.addText(presentation.sourceWorkspace || 'FlowSummary', {
      x: 0.55,
      y: 0.3,
      w: 5,
      h: 0.25,
      fontSize: 8,
      color: colors.accent,
      bold: true,
      margin: 0,
    })
    slide.addText(`${index + 1}`.padStart(2, '0'), {
      x: 12,
      y: 0.3,
      w: 0.6,
      h: 0.25,
      fontSize: 8,
      color: colors.muted,
      align: 'right',
      margin: 0,
    })
    slide.addText(slideModel.title || 'Untitled Slide', {
      x: 0.55,
      y: 0.78,
      w: 7.2,
      h: 0.78,
      fontSize: 26,
      color: colors.fg,
      bold: true,
      margin: 0,
      fit: 'shrink',
    })
    if (slideModel.subtitle) {
      slide.addText(slideModel.subtitle, {
        x: 0.58,
        y: 1.58,
        w: 6.6,
        h: 0.3,
        fontSize: 10,
        color: colors.muted,
        margin: 0,
      })
    }

    const bullets = slideModel.bullets || []
    slide.addText(bullets.map((bullet) => ({ text: bullet, options: { bullet: { type: 'bullet' } } })), {
      x: 0.75,
      y: 2.12,
      w: 6.5,
      h: 2.9,
      fontSize: 13,
      color: colors.fg,
      breakLine: false,
      fit: 'shrink',
      paraSpaceAfter: 8,
    })

    const highlights = slideModel.highlights || []
    highlights.slice(0, 3).forEach((highlight, highlightIndex) => {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 8.1,
        y: 1.15 + highlightIndex * 1.15,
        w: 4.35,
        h: 0.86,
        rectRadius: 0.08,
        fill: { color: colors.accent, transparency: 82 },
        line: { color: colors.accent, transparency: 45 },
      })
      slide.addText(highlight, {
        x: 8.35,
        y: 1.32 + highlightIndex * 1.15,
        w: 3.85,
        h: 0.45,
        fontSize: 12,
        color: colors.fg,
        bold: true,
        margin: 0,
        fit: 'shrink',
      })
    })

    const footer = [
      slideModel.confidence ? `Confidence ${slideModel.confidence}%` : '',
      slideModel.businessImpact ? `Impact: ${slideModel.businessImpact}` : '',
    ].filter(Boolean).join('   |   ')

    if (footer) {
      slide.addText(footer, {
        x: 0.55,
        y: 6.65,
        w: 11.8,
        h: 0.25,
        fontSize: 8,
        color: colors.muted,
        margin: 0,
        fit: 'shrink',
      })
    }

    const notes = [
      slideModel.speakerNotes?.keyMessage,
      ...(slideModel.speakerNotes?.emphasize || []),
      ...(slideModel.speakerNotes?.possibleQuestions || []).map((question) => `Possible question: ${question}`),
      ...(slideModel.speakerNotes?.suggestedAnswers || []).map((answer) => `Suggested answer: ${answer}`),
    ].filter(Boolean)
    if (notes.length > 0) {
      slide.addNotes(notes.join('\n'))
    }
  }

  const buffer = await pptx.write({ outputType: 'nodebuffer' })

  return new Response(buffer as Buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': `attachment; filename="${(presentation.title || 'flowsummary-presentation').replace(/[^\w-]+/g, '-')}.pptx"`,
    },
  })
}
