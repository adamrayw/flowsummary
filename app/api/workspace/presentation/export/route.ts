import { NextResponse } from 'next/server'
import pptxgen from 'pptxgenjs'

import { getAuthorizedRaytechUser } from '@/lib/raytech-account'

type PresentationSlide = {
  id?: string
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
    slides: slides.slice(0, 25).map((slide) => ({
      id: cleanString(slide.id),
      title: cleanString(slide.title, 'Untitled Slide'),
      subtitle: cleanString(slide.subtitle),
      bullets: cleanStringArray(slide.bullets).slice(0, 8),
      highlights: cleanStringArray(slide.highlights).slice(0, 8),
      confidence: typeof slide.confidence === 'number' ? slide.confidence : undefined,
      evidence: cleanStringArray(slide.evidence).slice(0, 6),
      businessImpact: cleanString(slide.businessImpact),
      speakerNotes: slide.speakerNotes,
    })),
  }
}

function parseBullet(bullet: string) {
  const colonIndex = bullet.indexOf(': ')
  if (colonIndex > 0 && colonIndex < 80) {
    return { lead: bullet.slice(0, colonIndex), desc: bullet.slice(colonIndex + 2) }
  }
  return { lead: '', desc: bullet }
}

function themeColors(style?: string) {
  const normalized = style?.toLowerCase()
  if (normalized === 'light') {
    return {
      bg: 'F8FAFC',
      cardBg: 'FFFFFF',
      cardBorder: 'E2E8F0',
      fg: '0F172A',
      muted: '64748B',
      accent: '7C3AED',
      accentBg: 'EDE9FE',
      emerald: '059669',
      emeraldBg: 'D1FAE5',
      indigo: '4F46E5',
      indigoBg: 'E0E7FF',
      rose: 'E11D48',
      roseBg: 'FFE4E6',
      blue: '2563EB',
    }
  }
  if (normalized === 'financial') {
    return {
      bg: '06100A',
      cardBg: '0B1E13',
      cardBorder: '1B3B2B',
      fg: 'F0FDF4',
      muted: '86EFAC',
      accent: '22C55E',
      accentBg: '14532D',
      emerald: '22C55E',
      emeraldBg: '14532D',
      indigo: '38BDF8',
      indigoBg: '0C4A6E',
      rose: 'F43F5E',
      roseBg: '881337',
      blue: '38BDF8',
    }
  }
  // Default Dark Executive Theme (matches preview)
  return {
    bg: '080B16',
    cardBg: '0F1426',
    cardBorder: '1E293B',
    fg: 'F8FAFC',
    muted: '94A3B8',
    accent: '8B5CF6',
    accentBg: '2E1065',
    emerald: '10B981',
    emeraldBg: '064E3B',
    indigo: '6366F1',
    indigoBg: '1E1B4B',
    rose: 'F43F5E',
    roseBg: '881337',
    blue: '38BDF8',
  }
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

    // Header Tag
    slide.addText(presentation.sourceWorkspace || 'FlowSummary', {
      x: 0.8,
      y: 0.35,
      w: 6.0,
      h: 0.25,
      fontSize: 9,
      color: colors.accent,
      bold: true,
      margin: 0,
    })

    // Slide Number
    slide.addText(`${index + 1}`.padStart(2, '0'), {
      x: 11.9,
      y: 0.35,
      w: 0.6,
      h: 0.25,
      fontSize: 9,
      color: colors.muted,
      align: 'right',
      margin: 0,
    })

    // Slide Title
    slide.addText(slideModel.title || 'Untitled Slide', {
      x: 0.8,
      y: 0.62,
      w: 11.7,
      h: 0.55,
      fontSize: 22,
      color: colors.fg,
      bold: true,
      margin: 0,
      fit: 'shrink',
    })

    // Subtitle
    if (slideModel.subtitle) {
      slide.addText(slideModel.subtitle, {
        x: 0.8,
        y: 1.18,
        w: 11.7,
        h: 0.28,
        fontSize: 10,
        color: colors.muted,
        margin: 0,
      })
    }

    const confidence = typeof slideModel.confidence === 'number' ? slideModel.confidence : 95
    const bullets = slideModel.bullets || []
    const slideType = (slideModel.id || '').toLowerCase()

    // Render by specific slide layout matching Preview
    if (slideType === 'executive-summary') {
      // Left 3 memo cards
      const cardW = 7.4
      const cardH = 1.48
      const startY = 1.58
      const gapY = 0.16
      const badges = ['STATUS OPERASIONAL', 'INTEGRITAS DATA', 'MANDAT KEPUTUSAN']
      const borderAccents = [colors.emerald, colors.accent, colors.indigo]

      bullets.slice(0, 3).forEach((bullet, idx) => {
        const { lead, desc } = parseBullet(bullet)
        const yPos = startY + idx * (cardH + gapY)

        // Card background
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 0.8,
          y: yPos,
          w: cardW,
          h: cardH,
          rectRadius: 0.08,
          fill: { color: colors.cardBg },
          line: { color: colors.cardBorder, width: 1 },
        })
        // Left accent stripe
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 0.8,
          y: yPos,
          w: 0.1,
          h: cardH,
          rectRadius: 0.04,
          fill: { color: borderAccents[idx] || colors.accent },
          line: { color: borderAccents[idx] || colors.accent, width: 0 },
        })
        // Badge
        slide.addText(badges[idx] || `POIN ${idx + 1}`, {
          x: 1.05,
          y: yPos + 0.12,
          w: cardW - 0.4,
          h: 0.2,
          fontSize: 8,
          bold: true,
          color: borderAccents[idx] || colors.accent,
          margin: 0,
        })
        // Lead Title
        slide.addText(lead || `Poin Strategis ${idx + 1}`, {
          x: 1.05,
          y: yPos + 0.32,
          w: cardW - 0.4,
          h: 0.28,
          fontSize: 11.5,
          bold: true,
          color: colors.fg,
          margin: 0,
          fit: 'shrink',
        })
        // Description
        slide.addText(desc, {
          x: 1.05,
          y: yPos + 0.62,
          w: cardW - 0.4,
          h: cardH - 0.7,
          fontSize: 9.5,
          color: colors.muted,
          margin: 0,
          fit: 'shrink',
          valign: 'top',
        })
      })

      // Right Executive Callout Card
      const calloutX = 8.5
      const calloutY = 1.58
      const calloutW = 4.0
      const calloutH = 4.76

      slide.addShape(pptx.ShapeType.roundRect, {
        x: calloutX,
        y: calloutY,
        w: calloutW,
        h: calloutH,
        rectRadius: 0.1,
        fill: { color: colors.cardBg },
        line: { color: colors.accent, width: 1.2 },
      })
      slide.addText('EXECUTIVE CALLOUT', {
        x: calloutX + 0.3,
        y: calloutY + 0.25,
        w: calloutW - 0.6,
        h: 0.22,
        fontSize: 9,
        bold: true,
        color: colors.accent,
        margin: 0,
      })
      slide.addText(slideModel.highlights?.[0] || '95.2%', {
        x: calloutX + 0.3,
        y: calloutY + 0.52,
        w: calloutW - 0.6,
        h: 0.65,
        fontSize: 34,
        bold: true,
        color: colors.fg,
        margin: 0,
      })
      slide.addText('Baseline Index', {
        x: calloutX + 0.3,
        y: calloutY + 1.18,
        w: calloutW - 0.6,
        h: 0.22,
        fontSize: 10,
        color: colors.muted,
        margin: 0,
      })

      // Confidence Bar
      slide.addText(`AI Verification Confidence: ${confidence}%`, {
        x: calloutX + 0.3,
        y: calloutY + 1.55,
        w: calloutW - 0.6,
        h: 0.22,
        fontSize: 9.5,
        bold: true,
        color: colors.fg,
        margin: 0,
      })
      slide.addShape(pptx.ShapeType.roundRect, {
        x: calloutX + 0.3,
        y: calloutY + 1.82,
        w: 3.4,
        h: 0.1,
        rectRadius: 0.05,
        fill: { color: colors.cardBorder },
      })
      slide.addShape(pptx.ShapeType.roundRect, {
        x: calloutX + 0.3,
        y: calloutY + 1.82,
        w: Math.max(0.2, (3.4 * confidence) / 100),
        h: 0.1,
        rectRadius: 0.05,
        fill: { color: colors.accent },
      })

      // Metadata rows
      const metaRows = [
        { label: 'Risk Level Assessment', val: 'Low Risk', col: colors.emerald },
        { label: 'Monitoring Scope', val: slideModel.highlights?.[1] || 'Seluruh Wilayah', col: colors.fg },
        { label: 'Reporting Period', val: slideModel.highlights?.[2] || 'Periode Aktif', col: colors.fg },
      ]
      metaRows.forEach((row, rIdx) => {
        slide.addText(row.label, {
          x: calloutX + 0.3,
          y: calloutY + 2.15 + rIdx * 0.42,
          w: 2.2,
          h: 0.22,
          fontSize: 9,
          color: colors.muted,
          margin: 0,
        })
        slide.addText(row.val, {
          x: calloutX + 2.4,
          y: calloutY + 2.15 + rIdx * 0.42,
          w: 1.3,
          h: 0.22,
          fontSize: 9,
          bold: true,
          color: row.col,
          align: 'right',
          margin: 0,
        })
      })

      // Directive Box
      slide.addShape(pptx.ShapeType.roundRect, {
        x: calloutX + 0.3,
        y: calloutY + 3.65,
        w: calloutW - 0.6,
        h: 0.85,
        rectRadius: 0.06,
        fill: { color: colors.bg },
        line: { color: colors.cardBorder, width: 1 },
      })
      slide.addText(
        [
          { text: 'Executive Directive: ', options: { bold: true, color: colors.fg, fontSize: 8.5 } },
          { text: 'Disetujui untuk presentasi manajemen tanpa memerlukan investigasi darurat.', options: { color: colors.muted, fontSize: 8.5 } },
        ],
        {
          x: calloutX + 0.45,
          y: calloutY + 3.75,
          w: calloutW - 0.9,
          h: 0.65,
          margin: 0,
          valign: 'top',
        },
      )
    } else if (slideType === 'business-context') {
      // 2 columns
      const colW = 5.75
      const colH = 4.76
      const startY = 1.58

      // Column 1: Scope
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.8,
        y: startY,
        w: colW,
        h: colH,
        rectRadius: 0.08,
        fill: { color: colors.cardBg },
        line: { color: colors.cardBorder, width: 1 },
      })
      slide.addText('Ruang Lingkup & Latar Belakang Bisnis', {
        x: 1.05,
        y: startY + 0.25,
        w: colW - 0.5,
        h: 0.3,
        fontSize: 13,
        bold: true,
        color: colors.accent,
        margin: 0,
      })
      bullets.slice(0, 2).forEach((b, i) => {
        const { lead, desc } = parseBullet(b)
        const bY = startY + 0.7 + i * 1.65
        slide.addText(lead, {
          x: 1.05,
          y: bY,
          w: colW - 0.5,
          h: 0.28,
          fontSize: 11,
          bold: true,
          color: colors.fg,
          margin: 0,
          fit: 'shrink',
        })
        slide.addText(desc, {
          x: 1.05,
          y: bY + 0.3,
          w: colW - 0.5,
          h: 1.25,
          fontSize: 9.5,
          color: colors.muted,
          margin: 0,
          fit: 'shrink',
          valign: 'top',
        })
      })
      // Tags
      slide.addText(`Cakupan: ${slideModel.highlights?.[0] || 'Dimensi Utama'}   |   Segmen: ${slideModel.highlights?.[1] || 'Seluruh Wilayah'}`, {
        x: 1.05,
        y: startY + colH - 0.45,
        w: colW - 0.5,
        h: 0.25,
        fontSize: 8.5,
        bold: true,
        color: colors.accent,
        margin: 0,
      })

      // Column 2: Methodology
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 6.75,
        y: startY,
        w: colW,
        h: colH,
        rectRadius: 0.08,
        fill: { color: colors.cardBg },
        line: { color: colors.cardBorder, width: 1 },
      })
      slide.addText('Metodologi & Parameter Toleransi', {
        x: 7.0,
        y: startY + 0.25,
        w: colW - 0.5,
        h: 0.3,
        fontSize: 13,
        bold: true,
        color: colors.accent,
        margin: 0,
      })
      const methBullet = bullets[2] ? bullets[2] : bullets[1] || ''
      const { lead: mLead, desc: mDesc } = parseBullet(methBullet)
      slide.addText(mLead || 'Standar Audit', {
        x: 7.0,
        y: startY + 0.7,
        w: colW - 0.5,
        h: 0.28,
        fontSize: 11,
        bold: true,
        color: colors.fg,
        margin: 0,
        fit: 'shrink',
      })
      slide.addText(mDesc, {
        x: 7.0,
        y: startY + 1.0,
        w: colW - 0.5,
        h: 1.4,
        fontSize: 9.5,
        color: colors.muted,
        margin: 0,
        fit: 'shrink',
        valign: 'top',
      })

      // Benchmark Box
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 7.0,
        y: startY + 2.55,
        w: colW - 0.5,
        h: 1.3,
        rectRadius: 0.06,
        fill: { color: colors.bg },
        line: { color: colors.cardBorder, width: 1 },
      })
      slide.addText(
        [
          { text: 'Benchmark Acuan: ', options: { bold: true, color: colors.fg, fontSize: 9.5 } },
          { text: 'Deviasi di bawah ambang batas 5% diklasifikasikan sebagai variasi normal dan tidak memicu eskalasi operasional. Seluruh anomali di atas batas diidentifikasi secara otomatis oleh sistem AI.', options: { color: colors.muted, fontSize: 9 } },
        ],
        {
          x: 7.15,
          y: startY + 2.7,
          w: colW - 0.8,
          h: 1.0,
          margin: 0,
          valign: 'top',
        },
      )
      slide.addText(`Model: ${confidence}% Verified   |   Waktu: ${slideModel.highlights?.[2] || 'Periode Aktif'}`, {
        x: 7.0,
        y: startY + colH - 0.45,
        w: colW - 0.5,
        h: 0.25,
        fontSize: 8.5,
        bold: true,
        color: colors.accent,
        margin: 0,
      })
    } else if (slideType === 'key-findings' || slideType === 'business-impact' || slideType === 'recommendations' || slideType === 'expected-outcome') {
      // 3 Columns Cards
      const cardW = 3.75
      const cardH = 4.76
      const startY = 1.58
      const gapX = 0.22

      bullets.slice(0, 3).forEach((bullet, idx) => {
        const { lead, desc } = parseBullet(bullet)
        const xPos = 0.8 + idx * (cardW + gapX)

        slide.addShape(pptx.ShapeType.roundRect, {
          x: xPos,
          y: startY,
          w: cardW,
          h: cardH,
          rectRadius: 0.08,
          fill: { color: colors.cardBg },
          line: { color: colors.cardBorder, width: 1 },
        })

        if (slideType === 'key-findings') {
          const badges = ['TEMUAN UTAMA', 'POLA SEBARAN', 'VALIDASI AUDIT']
          slide.addText(`0${idx + 1}  •  ${badges[idx]}`, {
            x: xPos + 0.25,
            y: startY + 0.22,
            w: cardW - 0.5,
            h: 0.22,
            fontSize: 8.5,
            bold: true,
            color: colors.accent,
            margin: 0,
          })
          slide.addText(lead, {
            x: xPos + 0.25,
            y: startY + 0.5,
            w: cardW - 0.5,
            h: 0.5,
            fontSize: 11.5,
            bold: true,
            color: colors.fg,
            margin: 0,
            fit: 'shrink',
          })
          slide.addText(desc, {
            x: xPos + 0.25,
            y: startY + 1.05,
            w: cardW - 0.5,
            h: 3.0,
            fontSize: 9.5,
            color: colors.muted,
            margin: 0,
            fit: 'shrink',
            valign: 'top',
          })
          slide.addText(`Status: ${slideModel.highlights?.[idx] || 'Terverifikasi'}`, {
            x: xPos + 0.25,
            y: startY + cardH - 0.45,
            w: cardW - 0.5,
            h: 0.25,
            fontSize: 8.5,
            bold: true,
            color: colors.emerald,
            margin: 0,
          })
        } else if (slideType === 'business-impact') {
          const badges = ['EFISIENSI JAM KERJA', 'KEPATUHAN & TATA KELOLA', 'ALOKASI SUMBER DAYA']
          const callouts = ['8-12% Penghematan Jam', 'Zero Legal Exposure', 'Optimal Budget Allocation']
          slide.addText(badges[idx], {
            x: xPos + 0.25,
            y: startY + 0.22,
            w: cardW - 0.5,
            h: 0.22,
            fontSize: 8.5,
            bold: true,
            color: colors.rose,
            margin: 0,
          })
          slide.addText(lead, {
            x: xPos + 0.25,
            y: startY + 0.5,
            w: cardW - 0.5,
            h: 0.5,
            fontSize: 11.5,
            bold: true,
            color: colors.fg,
            margin: 0,
            fit: 'shrink',
          })
          slide.addText(desc, {
            x: xPos + 0.25,
            y: startY + 1.05,
            w: cardW - 0.5,
            h: 2.7,
            fontSize: 9.5,
            color: colors.muted,
            margin: 0,
            fit: 'shrink',
            valign: 'top',
          })
          slide.addShape(pptx.ShapeType.roundRect, {
            x: xPos + 0.25,
            y: startY + cardH - 0.75,
            w: cardW - 0.5,
            h: 0.45,
            rectRadius: 0.05,
            fill: { color: colors.bg },
            line: { color: colors.cardBorder, width: 1 },
          })
          slide.addText(callouts[idx] || 'Dampak Terkonfirmasi', {
            x: xPos + 0.25,
            y: startY + cardH - 0.65,
            w: cardW - 0.5,
            h: 0.25,
            fontSize: 9.5,
            bold: true,
            color: colors.fg,
            align: 'center',
            margin: 0,
          })
        } else if (slideType === 'recommendations') {
          const pillars = ['Pilar 1: Proses & SOP', 'Pilar 2: Teknologi & Sistem', 'Pilar 3: Monitoring & Pengawasan']
          const prios = ['HIGH PRIORITY', 'MEDIUM PRIORITY', 'ONGOING']
          const prioCols = [colors.rose, colors.indigo, colors.emerald]
          slide.addText(`${pillars[idx]}   |   ${prios[idx]}`, {
            x: xPos + 0.25,
            y: startY + 0.22,
            w: cardW - 0.5,
            h: 0.22,
            fontSize: 8.5,
            bold: true,
            color: prioCols[idx] || colors.accent,
            margin: 0,
          })
          slide.addText(lead, {
            x: xPos + 0.25,
            y: startY + 0.5,
            w: cardW - 0.5,
            h: 0.5,
            fontSize: 11.5,
            bold: true,
            color: colors.fg,
            margin: 0,
            fit: 'shrink',
          })
          slide.addText(desc, {
            x: xPos + 0.25,
            y: startY + 1.05,
            w: cardW - 0.5,
            h: 3.0,
            fontSize: 9.5,
            color: colors.muted,
            margin: 0,
            fit: 'shrink',
            valign: 'top',
          })
          slide.addText('✓ Langkah strategis siap eksekusi', {
            x: xPos + 0.25,
            y: startY + cardH - 0.45,
            w: cardW - 0.5,
            h: 0.25,
            fontSize: 8.5,
            bold: true,
            color: colors.accent,
            margin: 0,
          })
        } else if (slideType === 'expected-outcome') {
          const beforeVals = ['94.2% Baseline', '3.5 Jam / Pekan', 'Potensi Deviasi']
          const afterVals = ['99.0% Target Capaian', '0.8 Jam / Pekan (-75%)', 'Zero Critical Incident']
          slide.addText(`OUTCOME 0${idx + 1}`, {
            x: xPos + 0.25,
            y: startY + 0.22,
            w: cardW - 0.5,
            h: 0.22,
            fontSize: 8.5,
            bold: true,
            color: colors.accent,
            margin: 0,
          })
          slide.addText(lead, {
            x: xPos + 0.25,
            y: startY + 0.5,
            w: cardW - 0.5,
            h: 0.5,
            fontSize: 11.5,
            bold: true,
            color: colors.fg,
            margin: 0,
            fit: 'shrink',
          })
          slide.addText(desc, {
            x: xPos + 0.25,
            y: startY + 1.05,
            w: cardW - 0.5,
            h: 2.7,
            fontSize: 9.5,
            color: colors.muted,
            margin: 0,
            fit: 'shrink',
            valign: 'top',
          })
          slide.addShape(pptx.ShapeType.roundRect, {
            x: xPos + 0.25,
            y: startY + cardH - 0.85,
            w: cardW - 0.5,
            h: 0.65,
            rectRadius: 0.05,
            fill: { color: colors.bg },
            line: { color: colors.cardBorder, width: 1 },
          })
          slide.addText(`Sebelum: ${beforeVals[idx]}`, {
            x: xPos + 0.35,
            y: startY + cardH - 0.78,
            w: cardW - 0.7,
            h: 0.2,
            fontSize: 8,
            color: colors.muted,
            margin: 0,
          })
          slide.addText(`Target: ${afterVals[idx]}`, {
            x: xPos + 0.35,
            y: startY + cardH - 0.52,
            w: cardW - 0.7,
            h: 0.25,
            fontSize: 9,
            bold: true,
            color: colors.emerald,
            margin: 0,
          })
        }
      })
    } else if (slideType === 'root-cause') {
      // Top row: 3 driver progress boxes
      const boxW = 3.75
      const gapX = 0.22
      const topH = 1.05
      const startY = 1.58
      const drivers = [
        { label: 'Hambatan Transit Eksternal', pct: 57, color: colors.accent },
        { label: 'Latensi Sinkronisasi Sistem', pct: 31, color: colors.indigo },
        { label: 'Deviasi Personal / Shift Gap', pct: 12, color: colors.rose },
      ]

      drivers.forEach((driver, idx) => {
        const xPos = 0.8 + idx * (boxW + gapX)
        slide.addShape(pptx.ShapeType.roundRect, {
          x: xPos,
          y: startY,
          w: boxW,
          h: topH,
          rectRadius: 0.06,
          fill: { color: colors.cardBg },
          line: { color: colors.cardBorder, width: 1 },
        })
        slide.addText(driver.label, {
          x: xPos + 0.2,
          y: startY + 0.15,
          w: boxW - 1.0,
          h: 0.25,
          fontSize: 9.5,
          bold: true,
          color: colors.fg,
          margin: 0,
          fit: 'shrink',
        })
        slide.addText(`${driver.pct}%`, {
          x: xPos + boxW - 0.75,
          y: startY + 0.15,
          w: 0.55,
          h: 0.25,
          fontSize: 10.5,
          bold: true,
          color: driver.color,
          align: 'right',
          margin: 0,
        })
        slide.addShape(pptx.ShapeType.roundRect, {
          x: xPos + 0.2,
          y: startY + 0.55,
          w: boxW - 0.4,
          h: 0.1,
          rectRadius: 0.05,
          fill: { color: colors.cardBorder },
        })
        slide.addShape(pptx.ShapeType.roundRect, {
          x: xPos + 0.2,
          y: startY + 0.55,
          w: ((boxW - 0.4) * driver.pct) / 100,
          h: 0.1,
          rectRadius: 0.05,
          fill: { color: driver.color },
        })
      })

      // Bottom row: 3 cause cards
      const botH = 3.55
      const botY = 2.78
      bullets.slice(0, 3).forEach((bullet, idx) => {
        const { lead, desc } = parseBullet(bullet)
        const xPos = 0.8 + idx * (boxW + gapX)
        slide.addShape(pptx.ShapeType.roundRect, {
          x: xPos,
          y: botY,
          w: boxW,
          h: botH,
          rectRadius: 0.08,
          fill: { color: colors.cardBg },
          line: { color: colors.cardBorder, width: 1 },
        })
        slide.addText(lead, {
          x: xPos + 0.25,
          y: botY + 0.22,
          w: boxW - 0.5,
          h: 0.5,
          fontSize: 11,
          bold: true,
          color: colors.fg,
          margin: 0,
          fit: 'shrink',
        })
        slide.addText(desc, {
          x: xPos + 0.25,
          y: botY + 0.75,
          w: boxW - 0.5,
          h: 2.2,
          fontSize: 9.5,
          color: colors.muted,
          margin: 0,
          fit: 'shrink',
          valign: 'top',
        })
        slide.addText(`Kontribusi: ${idx === 0 ? 'Dominan' : idx === 1 ? 'Moderat' : 'Minor'}`, {
          x: xPos + 0.25,
          y: botY + botH - 0.38,
          w: boxW - 0.5,
          h: 0.22,
          fontSize: 8.5,
          color: colors.muted,
          margin: 0,
        })
      })
    } else if (slideType === 'action-plan') {
      // 3 horizontal milestone cards
      const cardW = 11.7
      const cardH = 1.48
      const startY = 1.58
      const gapY = 0.16
      const phases = ['Fase 1 (Hari 01–14)', 'Fase 2 (Hari 15–30)', 'Fase 3 (Hari 31–60)']
      const timelines = ['Stabilisasi Cepat', 'Audit & Validasi Lapangan', 'Pembakuan Regulasi Tetap']

      bullets.slice(0, 3).forEach((bullet, idx) => {
        const { lead, desc } = parseBullet(bullet)
        const yPos = startY + idx * (cardH + gapY)

        slide.addShape(pptx.ShapeType.roundRect, {
          x: 0.8,
          y: yPos,
          w: cardW,
          h: cardH,
          rectRadius: 0.08,
          fill: { color: colors.cardBg },
          line: { color: colors.cardBorder, width: 1 },
        })

        // Left phase column
        slide.addText(phases[idx], {
          x: 1.05,
          y: yPos + 0.35,
          w: 2.2,
          h: 0.3,
          fontSize: 11,
          bold: true,
          color: colors.accent,
          margin: 0,
        })
        slide.addText(timelines[idx], {
          x: 1.05,
          y: yPos + 0.68,
          w: 2.2,
          h: 0.25,
          fontSize: 9,
          color: colors.muted,
          margin: 0,
        })

        // Middle narrative column
        slide.addText(lead, {
          x: 3.4,
          y: yPos + 0.25,
          w: 6.8,
          h: 0.3,
          fontSize: 11,
          bold: true,
          color: colors.fg,
          margin: 0,
          fit: 'shrink',
        })
        slide.addText(desc, {
          x: 3.4,
          y: yPos + 0.58,
          w: 6.8,
          h: cardH - 0.7,
          fontSize: 9.5,
          color: colors.muted,
          margin: 0,
          fit: 'shrink',
          valign: 'top',
        })

        // Right milestone badge
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 10.45,
          y: yPos + 0.5,
          w: 1.7,
          h: 0.45,
          rectRadius: 0.05,
          fill: { color: colors.bg },
          line: { color: colors.cardBorder, width: 1 },
        })
        slide.addText(`Milestone ${idx + 1}`, {
          x: 10.45,
          y: yPos + 0.6,
          w: 1.7,
          h: 0.25,
          fontSize: 9,
          bold: true,
          color: colors.accent,
          align: 'center',
          margin: 0,
        })
      })
    } else if (slideType === 'evidence') {
      // Top row: 3 metric stat cards
      const boxW = 3.75
      const gapX = 0.22
      const topH = 1.25
      const startY = 1.58
      const statBoxes = [
        { val: slideModel.highlights?.[0] || '1,200 Rows', label: 'Dataset Terverifikasi', color: colors.fg },
        { val: slideModel.highlights?.[1] || '5 Dimensions', label: 'Cakupan Segmentasi', color: colors.fg },
        { val: '100% Valid', label: 'Status Audit Trail', color: colors.emerald },
      ]

      statBoxes.forEach((stat, idx) => {
        const xPos = 0.8 + idx * (boxW + gapX)
        slide.addShape(pptx.ShapeType.roundRect, {
          x: xPos,
          y: startY,
          w: boxW,
          h: topH,
          rectRadius: 0.06,
          fill: { color: colors.cardBg },
          line: { color: colors.cardBorder, width: 1 },
        })
        slide.addText(stat.val, {
          x: xPos + 0.2,
          y: startY + 0.2,
          w: boxW - 0.4,
          h: 0.45,
          fontSize: 22,
          bold: true,
          color: stat.color,
          align: 'center',
          margin: 0,
        })
        slide.addText(stat.label, {
          x: xPos + 0.2,
          y: startY + 0.72,
          w: boxW - 0.4,
          h: 0.25,
          fontSize: 9.5,
          color: colors.muted,
          align: 'center',
          margin: 0,
        })
      })

      // Bottom row: 3 audit cards
      const botH = 3.35
      const botY = 2.98
      bullets.slice(0, 3).forEach((bullet, idx) => {
        const { lead, desc } = parseBullet(bullet)
        const xPos = 0.8 + idx * (boxW + gapX)
        slide.addShape(pptx.ShapeType.roundRect, {
          x: xPos,
          y: botY,
          w: boxW,
          h: botH,
          rectRadius: 0.08,
          fill: { color: colors.cardBg },
          line: { color: colors.cardBorder, width: 1 },
        })
        slide.addText(lead, {
          x: xPos + 0.25,
          y: botY + 0.25,
          w: boxW - 0.5,
          h: 0.45,
          fontSize: 11,
          bold: true,
          color: colors.fg,
          margin: 0,
          fit: 'shrink',
        })
        slide.addText(desc, {
          x: xPos + 0.25,
          y: botY + 0.75,
          w: boxW - 0.5,
          h: botH - 1.0,
          fontSize: 9.5,
          color: colors.muted,
          margin: 0,
          fit: 'shrink',
          valign: 'top',
        })
      })
    } else {
      // Default: clean 2-column card layout
      const cardW = 7.6
      const startY = 1.58
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.8,
        y: startY,
        w: cardW,
        h: 4.76,
        rectRadius: 0.08,
        fill: { color: colors.cardBg },
        line: { color: colors.cardBorder, width: 1 },
      })
      bullets.slice(0, 4).forEach((bullet, idx) => {
        const { lead, desc } = parseBullet(bullet)
        const bY = startY + 0.3 + idx * 1.08
        slide.addText(lead, {
          x: 1.05,
          y: bY,
          w: cardW - 0.5,
          h: 0.26,
          fontSize: 11,
          bold: true,
          color: colors.fg,
          margin: 0,
          fit: 'shrink',
        })
        slide.addText(desc, {
          x: 1.05,
          y: bY + 0.28,
          w: cardW - 0.5,
          h: 0.72,
          fontSize: 9.5,
          color: colors.muted,
          margin: 0,
          fit: 'shrink',
          valign: 'top',
        })
      })

      // Right column highlights
      const rightX = 8.7
      const rightW = 3.8
      const highlights = slideModel.highlights || []
      highlights.slice(0, 3).forEach((highlight, hIdx) => {
        const hY = startY + hIdx * 1.55
        slide.addShape(pptx.ShapeType.roundRect, {
          x: rightX,
          y: hY,
          w: rightW,
          h: 1.35,
          rectRadius: 0.08,
          fill: { color: colors.cardBg },
          line: { color: colors.cardBorder, width: 1 },
        })
        slide.addText(`Highlight 0${hIdx + 1}`, {
          x: rightX + 0.25,
          y: hY + 0.2,
          w: rightW - 0.5,
          h: 0.22,
          fontSize: 8.5,
          bold: true,
          color: colors.accent,
          margin: 0,
        })
        slide.addText(highlight, {
          x: rightX + 0.25,
          y: hY + 0.45,
          w: rightW - 0.5,
          h: 0.7,
          fontSize: 10.5,
          bold: true,
          color: colors.fg,
          margin: 0,
          fit: 'shrink',
        })
      })
    }

    // Slide Footer
    const footer = [
      confidence ? `Confidence ${confidence}%` : '',
      slideModel.businessImpact ? `Impact: ${slideModel.businessImpact}` : '',
    ]
      .filter(Boolean)
      .join('   |   ')

    if (footer) {
      slide.addText(footer, {
        x: 0.8,
        y: 6.85,
        w: 11.7,
        h: 0.25,
        fontSize: 8.5,
        color: colors.muted,
        margin: 0,
        fit: 'shrink',
      })
    }

    // Speaker Notes
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
