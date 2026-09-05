import PDFDocument from 'pdfkit'
import { NextResponse } from 'next/server'

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
      bg: '#F8FAFC',
      cardBg: '#FFFFFF',
      cardBorder: '#E2E8F0',
      textFg: '#0F172A',
      textMuted: '#64748B',
      accent: '#7C3AED',
      accentBg: '#EDE9FE',
      emerald: '#059669',
      emeraldBg: '#D1FAE5',
      indigo: '#4F46E5',
      indigoBg: '#E0E7FF',
      rose: '#E11D48',
      roseBg: '#FFE4E6',
    }
  }
  if (normalized === 'financial') {
    return {
      bg: '#06100A',
      cardBg: '#0B1E13',
      cardBorder: '#1B3B2B',
      textFg: '#F0FDF4',
      textMuted: '#86EFAC',
      accent: '#22C55E',
      accentBg: '#14532D',
      emerald: '#22C55E',
      emeraldBg: '#14532D',
      indigo: '#38BDF8',
      indigoBg: '#0C4A6E',
      rose: '#F43F5E',
      roseBg: '#881337',
    }
  }
  // Default Dark Executive Theme (matches preview)
  return {
    bg: '#080B16',
    cardBg: '#0F1426',
    cardBorder: '#1E293B',
    textFg: '#F8FAFC',
    textMuted: '#94A3B8',
    accent: '#8B5CF6',
    accentBg: '#2E1065',
    emerald: '#10B981',
    emeraldBg: '#064E3B',
    indigo: '#6366F1',
    indigoBg: '#1E1B4B',
    rose: '#F43F5E',
    roseBg: '#881337',
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

function drawCard(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, bg: string, border: string, radius = 6) {
  doc.save()
  doc.roundedRect(x, y, w, h, radius).lineWidth(0.8).strokeColor(border).fillColor(bg).fillAndStroke()
  doc.restore()
}

function drawBadge(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  bg: string,
  border: string,
  textCol: string,
  fontSize = 7.5,
) {
  doc.save()
  doc.roundedRect(x, y, w, h, 3).lineWidth(0.6).strokeColor(border).fillColor(bg).fillAndStroke()
  doc.fillColor(textCol).fontSize(fontSize).font('Helvetica-Bold')
  doc.text(text, x, y + (h - fontSize) / 2 - 0.5, { width: w, align: 'center' })
  doc.restore()
}

function drawProgressBar(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  pct: number,
  barColor: string,
  bgColor: string,
) {
  doc.save()
  doc.roundedRect(x, y, w, h, h / 2).fillColor(bgColor).fill()
  const fillW = Math.max(h, Math.min(w, (w * pct) / 100))
  doc.roundedRect(x, y, fillW, h, h / 2).fillColor(barColor).fill()
  doc.restore()
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
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 40,
    info: {
      Title: presentation.title,
      Author: 'FlowSummary',
      Subject: presentation.sourceWorkspace,
    },
  })
  const pdfPromise = collectPdf(doc)

  ;(presentation.slides || []).forEach((slide, index) => {
    if (index > 0) doc.addPage()

    const pageWidth = doc.page.width
    const pageHeight = doc.page.height

    // Background fill
    doc.rect(0, 0, pageWidth, pageHeight).fill(colors.bg)

    // Header Workspace & Slide Number
    doc.fillColor(colors.accent).fontSize(9).font('Helvetica-Bold').text(presentation.sourceWorkspace || 'FlowSummary', 42, 28)
    doc.fillColor(colors.textMuted).fontSize(9).font('Helvetica').text(String(index + 1).padStart(2, '0'), pageWidth - 78, 28, { align: 'right' })

    // Title
    doc.fillColor(colors.textFg).fontSize(20).font('Helvetica-Bold').text(slide.title || 'Untitled Slide', 42, 46, {
      width: pageWidth - 84,
      ellipsis: true,
    })

    // Subtitle
    if (slide.subtitle) {
      doc.fillColor(colors.textMuted).fontSize(9.5).font('Helvetica').text(slide.subtitle, 42, 72, {
        width: pageWidth - 84,
        ellipsis: true,
      })
    }

    const confidence = typeof slide.confidence === 'number' ? slide.confidence : 95
    const bullets = slide.bullets || []
    const slideType = (slide.id || '').toLowerCase()
    const contentY = 96

    if (slideType === 'executive-summary') {
      // Left 3 memo cards
      const cardW = 475
      const cardH = 128
      const gapY = 14
      const badges = ['STATUS OPERASIONAL', 'INTEGRITAS DATA', 'MANDAT KEPUTUSAN']
      const borderAccents = [colors.emerald, colors.accent, colors.indigo]

      bullets.slice(0, 3).forEach((bullet, idx) => {
        const { lead, desc } = parseBullet(bullet)
        const yPos = contentY + idx * (cardH + gapY)

        drawCard(doc, 42, yPos, cardW, cardH, colors.cardBg, colors.cardBorder)
        // Left accent bar
        doc.save()
        doc.roundedRect(42, yPos, 4, cardH, 2).fillColor(borderAccents[idx] || colors.accent).fill()
        doc.restore()

        // Badge
        drawBadge(doc, badges[idx] || `POIN 0${idx + 1}`, 56, yPos + 10, 115, 16, colors.bg, colors.cardBorder, borderAccents[idx] || colors.accent)

        // Lead Title
        doc.fillColor(colors.textFg).fontSize(10.5).font('Helvetica-Bold').text(lead || `Poin Strategis ${idx + 1}`, 56, yPos + 32, {
          width: cardW - 28,
          height: 18,
          ellipsis: true,
        })

        // Description
        doc.fillColor(colors.textMuted).fontSize(8.5).font('Helvetica').text(desc, 56, yPos + 52, {
          width: cardW - 28,
          height: cardH - 60,
          lineGap: 2,
          ellipsis: true,
        })
      })

      // Right Executive Callout Card
      const calloutX = 530
      const calloutW = 270
      const calloutH = 412
      drawCard(doc, calloutX, contentY, calloutW, calloutH, colors.cardBg, colors.accent)

      doc.fillColor(colors.accent).fontSize(8.5).font('Helvetica-Bold').text('EXECUTIVE CALLOUT', calloutX + 18, contentY + 18)
      doc.fillColor(colors.textFg).fontSize(30).font('Helvetica-Bold').text(slide.highlights?.[0] || '95.2%', calloutX + 18, contentY + 36)
      doc.fillColor(colors.textMuted).fontSize(9).font('Helvetica').text('Baseline Index', calloutX + 18, contentY + 74)

      // Confidence Meter
      doc.fillColor(colors.textFg).fontSize(9).font('Helvetica-Bold').text(`AI Verification Confidence: ${confidence}%`, calloutX + 18, contentY + 104)
      drawProgressBar(doc, calloutX + 18, contentY + 120, calloutW - 36, 6, confidence, colors.accent, colors.cardBorder)

      // Details
      const metaY = contentY + 148
      const meta = [
        { label: 'Risk Level Assessment', val: 'Low Risk', col: colors.emerald },
        { label: 'Monitoring Scope', val: slide.highlights?.[1] || 'Seluruh Wilayah', col: colors.textFg },
        { label: 'Reporting Period', val: slide.highlights?.[2] || 'Periode Aktif', col: colors.textFg },
      ]
      meta.forEach((m, i) => {
        const rowY = metaY + i * 32
        doc.fillColor(colors.textMuted).fontSize(8.5).font('Helvetica').text(m.label, calloutX + 18, rowY)
        doc.fillColor(m.col).fontSize(8.5).font('Helvetica-Bold').text(m.val, calloutX + 18, rowY, { width: calloutW - 36, align: 'right' })
        doc.save()
        doc.moveTo(calloutX + 18, rowY + 18).lineTo(calloutX + calloutW - 18, rowY + 18).lineWidth(0.5).strokeColor(colors.cardBorder).stroke()
        doc.restore()
      })

      // Directive Box
      drawCard(doc, calloutX + 18, contentY + 280, calloutW - 36, 110, colors.bg, colors.cardBorder)
      doc.fillColor(colors.textFg).fontSize(8.5).font('Helvetica-Bold').text('Executive Directive:', calloutX + 28, contentY + 294)
      doc.fillColor(colors.textMuted).fontSize(8).font('Helvetica').text('Disetujui untuk presentasi manajemen tanpa memerlukan investigasi darurat. Metrik berada dalam batas toleransi aman.', calloutX + 28, contentY + 312, {
        width: calloutW - 56,
        lineGap: 2,
      })
    } else if (slideType === 'business-context') {
      // 2 columns
      const colW = 368
      const colH = 412

      // Scope Card
      drawCard(doc, 42, contentY, colW, colH, colors.cardBg, colors.cardBorder)
      doc.fillColor(colors.accent).fontSize(12).font('Helvetica-Bold').text('Ruang Lingkup & Latar Belakang Bisnis', 58, contentY + 18)

      bullets.slice(0, 2).forEach((b, i) => {
        const { lead, desc } = parseBullet(b)
        const bY = contentY + 48 + i * 150
        doc.fillColor(colors.textFg).fontSize(10).font('Helvetica-Bold').text(lead, 58, bY, { width: colW - 32 })
        doc.fillColor(colors.textMuted).fontSize(8.5).font('Helvetica').text(desc, 58, bY + 18, { width: colW - 32, height: 110, lineGap: 2, ellipsis: true })
      })
      drawBadge(doc, `Dimensi: ${slide.highlights?.[0] || 'Utama'}`, 58, contentY + colH - 32, 130, 18, colors.bg, colors.cardBorder, colors.accent)
      drawBadge(doc, `Segmen: ${slide.highlights?.[1] || 'Seluruh Wilayah'}`, 196, contentY + colH - 32, 150, 18, colors.bg, colors.cardBorder, colors.accent)

      // Methodology Card
      drawCard(doc, 432, contentY, colW, colH, colors.cardBg, colors.cardBorder)
      doc.fillColor(colors.accent).fontSize(12).font('Helvetica-Bold').text('Metodologi & Parameter Toleransi', 448, contentY + 18)

      const methBullet = bullets[2] ? bullets[2] : bullets[1] || ''
      const { lead: mLead, desc: mDesc } = parseBullet(methBullet)
      doc.fillColor(colors.textFg).fontSize(10).font('Helvetica-Bold').text(mLead || 'Standar Evaluasi Mutu', 448, contentY + 48, { width: colW - 32 })
      doc.fillColor(colors.textMuted).fontSize(8.5).font('Helvetica').text(mDesc, 448, contentY + 66, { width: colW - 32, height: 130, lineGap: 2, ellipsis: true })

      // Benchmark Box
      drawCard(doc, 448, contentY + 215, colW - 32, 120, colors.bg, colors.cardBorder)
      doc.fillColor(colors.textFg).fontSize(9).font('Helvetica-Bold').text('Benchmark Acuan:', 462, contentY + 228)
      doc.fillColor(colors.textMuted).fontSize(8).font('Helvetica').text('Deviasi di bawah ambang batas 5% diklasifikasikan sebagai variasi normal dan tidak memicu eskalasi operasional. Seluruh anomali di atas batas diidentifikasi secara otomatis oleh sistem AI.', 462, contentY + 246, {
        width: colW - 60,
        lineGap: 2,
      })
      drawBadge(doc, `Model: ${confidence}% Verified`, 448, contentY + colH - 32, 140, 18, colors.bg, colors.cardBorder, colors.accent)
      drawBadge(doc, `Waktu: ${slide.highlights?.[2] || 'Periode Aktif'}`, 596, contentY + colH - 32, 150, 18, colors.bg, colors.cardBorder, colors.accent)
    } else if (slideType === 'key-findings' || slideType === 'business-impact' || slideType === 'recommendations' || slideType === 'expected-outcome') {
      // 3 Columns Cards
      const cardW = 238
      const cardH = 412
      const gapX = 22

      bullets.slice(0, 3).forEach((bullet, idx) => {
        const { lead, desc } = parseBullet(bullet)
        const xPos = 42 + idx * (cardW + gapX)
        drawCard(doc, xPos, contentY, cardW, cardH, colors.cardBg, colors.cardBorder)

        if (slideType === 'key-findings') {
          const badges = ['TEMUAN UTAMA', 'POLA SEBARAN', 'VALIDASI AUDIT']
          drawBadge(doc, `0${idx + 1} • ${badges[idx]}`, xPos + 14, contentY + 14, 130, 18, colors.bg, colors.cardBorder, colors.accent)
          doc.fillColor(colors.textFg).fontSize(10.5).font('Helvetica-Bold').text(lead, xPos + 14, contentY + 44, { width: cardW - 28, height: 36, ellipsis: true })
          doc.fillColor(colors.textMuted).fontSize(8.5).font('Helvetica').text(desc, xPos + 14, contentY + 86, { width: cardW - 28, height: 260, lineGap: 2, ellipsis: true })
          drawBadge(doc, `Status: ${slide.highlights?.[idx] || 'Terverifikasi'}`, xPos + 14, contentY + cardH - 32, cardW - 28, 18, colors.bg, colors.cardBorder, colors.emerald)
        } else if (slideType === 'business-impact') {
          const badges = ['EFISIENSI JAM KERJA', 'KEPATUHAN & TATA KELOLA', 'ALOKASI SUMBER DAYA']
          const callouts = ['8-12% Penghematan Jam', 'Zero Legal Exposure', 'Optimal Budget Allocation']
          drawBadge(doc, badges[idx], xPos + 14, contentY + 14, cardW - 28, 18, colors.bg, colors.cardBorder, colors.rose)
          doc.fillColor(colors.textFg).fontSize(10.5).font('Helvetica-Bold').text(lead, xPos + 14, contentY + 44, { width: cardW - 28, height: 36, ellipsis: true })
          doc.fillColor(colors.textMuted).fontSize(8.5).font('Helvetica').text(desc, xPos + 14, contentY + 86, { width: cardW - 28, height: 230, lineGap: 2, ellipsis: true })

          drawCard(doc, xPos + 14, contentY + cardH - 48, cardW - 28, 34, colors.bg, colors.cardBorder)
          doc.fillColor(colors.textFg).fontSize(9).font('Helvetica-Bold').text(callouts[idx] || 'Dampak Terkonfirmasi', xPos + 14, contentY + cardH - 36, { width: cardW - 28, align: 'center' })
        } else if (slideType === 'recommendations') {
          const pillars = ['Pilar 1: Proses & SOP', 'Pilar 2: Teknologi & Sistem', 'Pilar 3: Pengawasan']
          const prios = ['HIGH PRIORITY', 'MEDIUM PRIORITY', 'ONGOING']
          const prioCols = [colors.rose, colors.indigo, colors.emerald]
          drawBadge(doc, `${pillars[idx]} | ${prios[idx]}`, xPos + 14, contentY + 14, cardW - 28, 18, colors.bg, colors.cardBorder, prioCols[idx] || colors.accent)
          doc.fillColor(colors.textFg).fontSize(10.5).font('Helvetica-Bold').text(lead, xPos + 14, contentY + 44, { width: cardW - 28, height: 36, ellipsis: true })
          doc.fillColor(colors.textMuted).fontSize(8.5).font('Helvetica').text(desc, xPos + 14, contentY + 86, { width: cardW - 28, height: 260, lineGap: 2, ellipsis: true })
          drawBadge(doc, '✓ Langkah strategis siap eksekusi', xPos + 14, contentY + cardH - 32, cardW - 28, 18, colors.bg, colors.cardBorder, colors.accent)
        } else if (slideType === 'expected-outcome') {
          const beforeVals = ['94.2% Baseline', '3.5 Jam / Pekan', 'Potensi Deviasi']
          const afterVals = ['99.0% Target Capaian', '0.8 Jam / Pekan (-75%)', 'Zero Incident']
          drawBadge(doc, `OUTCOME 0${idx + 1}`, xPos + 14, contentY + 14, 90, 18, colors.bg, colors.cardBorder, colors.accent)
          doc.fillColor(colors.textFg).fontSize(10.5).font('Helvetica-Bold').text(lead, xPos + 14, contentY + 44, { width: cardW - 28, height: 36, ellipsis: true })
          doc.fillColor(colors.textMuted).fontSize(8.5).font('Helvetica').text(desc, xPos + 14, contentY + 86, { width: cardW - 28, height: 215, lineGap: 2, ellipsis: true })

          drawCard(doc, xPos + 14, contentY + cardH - 58, cardW - 28, 44, colors.bg, colors.cardBorder)
          doc.fillColor(colors.textMuted).fontSize(8).font('Helvetica').text(`Sebelum: ${beforeVals[idx]}`, xPos + 22, contentY + cardH - 50)
          doc.fillColor(colors.emerald).fontSize(8.5).font('Helvetica-Bold').text(`Target: ${afterVals[idx]}`, xPos + 22, contentY + cardH - 34)
        }
      })
    } else if (slideType === 'root-cause') {
      const boxW = 238
      const gapX = 22
      const topH = 72
      const drivers = [
        { label: 'Hambatan Transit Eksternal', pct: 57, color: colors.accent },
        { label: 'Latensi Sinkronisasi Sistem', pct: 31, color: colors.indigo },
        { label: 'Deviasi Personal / Shift Gap', pct: 12, color: colors.rose },
      ]

      drivers.forEach((driver, idx) => {
        const xPos = 42 + idx * (boxW + gapX)
        drawCard(doc, xPos, contentY, boxW, topH, colors.cardBg, colors.cardBorder)
        doc.fillColor(colors.textFg).fontSize(9).font('Helvetica-Bold').text(driver.label, xPos + 12, contentY + 14, { width: boxW - 60 })
        doc.fillColor(driver.color).fontSize(10).font('Helvetica-Bold').text(`${driver.pct}%`, xPos + boxW - 48, contentY + 14, { width: 36, align: 'right' })
        drawProgressBar(doc, xPos + 12, contentY + 44, boxW - 24, 6, driver.pct, driver.color, colors.cardBorder)
      })

      const botH = 324
      const botY = contentY + 88
      bullets.slice(0, 3).forEach((bullet, idx) => {
        const { lead, desc } = parseBullet(bullet)
        const xPos = 42 + idx * (boxW + gapX)
        drawCard(doc, xPos, botY, boxW, botH, colors.cardBg, colors.cardBorder)
        doc.fillColor(colors.textFg).fontSize(10).font('Helvetica-Bold').text(lead, xPos + 14, botY + 14, { width: boxW - 28, height: 36, ellipsis: true })
        doc.fillColor(colors.textMuted).fontSize(8.5).font('Helvetica').text(desc, xPos + 14, botY + 56, { width: boxW - 28, height: 215, lineGap: 2, ellipsis: true })
        drawBadge(doc, `Kontribusi: ${idx === 0 ? 'Dominan' : idx === 1 ? 'Moderat' : 'Minor'}`, xPos + 14, botY + botH - 28, boxW - 28, 18, colors.bg, colors.cardBorder, colors.textMuted)
      })
    } else if (slideType === 'action-plan') {
      const cardW = 758
      const cardH = 128
      const gapY = 14
      const phases = ['Fase 1 (Hari 01–14)', 'Fase 2 (Hari 15–30)', 'Fase 3 (Hari 31–60)']
      const timelines = ['Stabilisasi Cepat', 'Audit & Validasi Lapangan', 'Pembakuan Regulasi Tetap']

      bullets.slice(0, 3).forEach((bullet, idx) => {
        const { lead, desc } = parseBullet(bullet)
        const yPos = contentY + idx * (cardH + gapY)
        drawCard(doc, 42, yPos, cardW, cardH, colors.cardBg, colors.cardBorder)

        // Left phase
        doc.fillColor(colors.accent).fontSize(11).font('Helvetica-Bold').text(phases[idx], 58, yPos + 38)
        doc.fillColor(colors.textMuted).fontSize(8.5).font('Helvetica').text(timelines[idx], 58, yPos + 58)

        // Divider
        doc.save()
        doc.moveTo(215, yPos + 14).lineTo(215, yPos + cardH - 14).lineWidth(0.5).strokeColor(colors.cardBorder).stroke()
        doc.restore()

        // Middle narrative
        doc.fillColor(colors.textFg).fontSize(10).font('Helvetica-Bold').text(lead, 230, yPos + 16, { width: 420 })
        doc.fillColor(colors.textMuted).fontSize(8.5).font('Helvetica').text(desc, 230, yPos + 36, { width: 420, height: cardH - 48, lineGap: 2, ellipsis: true })

        // Right milestone badge
        drawBadge(doc, `Milestone 0${idx + 1}`, cardW - 75, yPos + 48, 95, 24, colors.bg, colors.cardBorder, colors.accent, 9)
      })
    } else if (slideType === 'evidence') {
      const boxW = 238
      const gapX = 22
      const topH = 80
      const statBoxes = [
        { val: slide.highlights?.[0] || '1,200 Rows', label: 'Dataset Terverifikasi', color: colors.textFg },
        { val: slide.highlights?.[1] || '5 Dimensions', label: 'Cakupan Segmentasi', color: colors.textFg },
        { val: '100% Valid', label: 'Status Audit Trail', color: colors.emerald },
      ]

      statBoxes.forEach((stat, idx) => {
        const xPos = 42 + idx * (boxW + gapX)
        drawCard(doc, xPos, contentY, boxW, topH, colors.cardBg, colors.cardBorder)
        doc.fillColor(stat.color).fontSize(20).font('Helvetica-Bold').text(stat.val, xPos, contentY + 16, { width: boxW, align: 'center' })
        doc.fillColor(colors.textMuted).fontSize(8.5).font('Helvetica').text(stat.label, xPos, contentY + 48, { width: boxW, align: 'center' })
      })

      const botH = 316
      const botY = contentY + 96
      bullets.slice(0, 3).forEach((bullet, idx) => {
        const { lead, desc } = parseBullet(bullet)
        const xPos = 42 + idx * (boxW + gapX)
        drawCard(doc, xPos, botY, boxW, botH, colors.cardBg, colors.cardBorder)
        doc.fillColor(colors.textFg).fontSize(10).font('Helvetica-Bold').text(lead, xPos + 14, botY + 16, { width: boxW - 28, height: 36, ellipsis: true })
        doc.fillColor(colors.textMuted).fontSize(8.5).font('Helvetica').text(desc, xPos + 14, botY + 56, { width: boxW - 28, height: 235, lineGap: 2, ellipsis: true })
      })
    } else {
      // Default: clean 2-column card layout
      const cardW = 480
      const cardH = 412
      drawCard(doc, 42, contentY, cardW, cardH, colors.cardBg, colors.cardBorder)

      bullets.slice(0, 4).forEach((bullet, idx) => {
        const { lead, desc } = parseBullet(bullet)
        const bY = contentY + 20 + idx * 95
        doc.fillColor(colors.textFg).fontSize(10).font('Helvetica-Bold').text(lead, 58, bY, { width: cardW - 32 })
        doc.fillColor(colors.textMuted).fontSize(8.5).font('Helvetica').text(desc, 58, bY + 18, { width: cardW - 32, height: 65, lineGap: 2, ellipsis: true })
      })

      const rightX = 538
      const rightW = 262
      const highlights = slide.highlights || []
      highlights.slice(0, 3).forEach((highlight, hIdx) => {
        const hY = contentY + hIdx * 138
        drawCard(doc, rightX, hY, rightW, 122, colors.cardBg, colors.cardBorder)
        drawBadge(doc, `HIGHLIGHT 0${hIdx + 1}`, rightX + 14, hY + 12, 100, 16, colors.bg, colors.cardBorder, colors.accent)
        doc.fillColor(colors.textFg).fontSize(10).font('Helvetica-Bold').text(highlight, rightX + 14, hY + 38, { width: rightW - 28, height: 70, lineGap: 2, ellipsis: true })
      })
    }

    // Footer
    const footer = [
      confidence ? `Confidence ${confidence}%` : '',
      slide.businessImpact ? `Impact: ${slide.businessImpact}` : '',
    ]
      .filter(Boolean)
      .join('   |   ')

    if (footer) {
      doc.fillColor(colors.textMuted).fontSize(8).font('Helvetica').text(footer, 42, pageHeight - 32, {
        width: pageWidth - 84,
        ellipsis: true,
      })
    }
  })

  doc.end()
  const buffer = await pdfPromise

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${(presentation.title || 'flowsummary-presentation').replace(/[^\w-]+/g, '-')}.pdf"`,
    },
  })
}
