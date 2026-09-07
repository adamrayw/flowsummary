import { NextResponse } from 'next/server'

import { generateJsonWithOpenRouter, hasOpenRouterConfig, formatLanguageInstruction } from '@/lib/openrouter'
import { getAuthorizedRaytechUser } from '@/lib/raytech-account'

type WorkspaceModalPayload = {
  title: string
  label: string
  description: string
  answer?: string
  blocks: Array<{
    title: string
    items: string[]
  }>
  primaryAction?: string
}

const MAX_CONTEXT_CHARS = 24_000

function clampJson(value: unknown, maxChars = MAX_CONTEXT_CHARS) {
  const serialized = JSON.stringify(value, null, 2)
  if (serialized.length <= maxChars) {
    return serialized
  }

  return `${serialized.slice(0, maxChars)}\n...context truncated`
}

function cleanString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function cleanStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5)
}

function normalizeModalPayload(value: unknown): WorkspaceModalPayload | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const candidate = value as Partial<WorkspaceModalPayload>
  const title = cleanString(candidate.title)
  const label = cleanString(candidate.label, 'AI Analyst')
  const description = cleanString(candidate.description)
  const answer = cleanString(candidate.answer)

  if (!title || !description) {
    return null
  }

  const blocks = Array.isArray(candidate.blocks)
    ? candidate.blocks
    .map((block) => {
      if (typeof block !== 'object' || block === null) {
        return null
      }

      const typedBlock = block as { title?: unknown; items?: unknown }
      const blockTitle = cleanString(typedBlock.title)
      const items = cleanStringArray(typedBlock.items)

      if (!blockTitle || items.length === 0) {
        return null
      }

      return {
        title: blockTitle,
        items,
      }
    })
    .filter((block): block is { title: string; items: string[] } => Boolean(block))
    .slice(0, 3)
    : []

  if (!answer && blocks.length === 0) {
    return null
  }

  return {
    title,
    label,
    description,
    answer: answer || undefined,
    blocks,
    primaryAction: cleanString(candidate.primaryAction) || undefined,
  }
}

function asRecord(value: unknown) {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function getStringField(value: unknown, key: string) {
  const field = asRecord(value)[key]
  return typeof field === 'string' ? field : ''
}

function compactOutput(output: unknown) {
  const record = asRecord(output)
  const metrics = asArray(record.metrics).slice(0, 5)
  const sections = asArray(record.sections).slice(0, 4)
  const actions = asArray(record.actions).slice(0, 4)
  const nextAnalyses = asArray(record.nextAnalyses).slice(0, 3)

  return {
    workspaceTitle: record.workspaceTitle,
    title: record.title,
    renderer: record.renderer,
    purpose: record.purpose,
    statusLine: record.statusLine,
    aiThinkingSummary: record.aiThinkingSummary,
    hero: record.hero,
    nearbyMetrics: metrics.map((metric) => ({
      label: getStringField(metric, 'label'),
      value: getStringField(metric, 'value'),
      interpretation: getStringField(metric, 'interpretation') || getStringField(metric, 'detail'),
      risk: getStringField(metric, 'risk'),
      suggestedAction: getStringField(metric, 'suggestedAction'),
      sourceFields: asRecord(metric).sourceFields,
    })),
    nearbySections: sections.map((section) => ({
      title: getStringField(section, 'title'),
      description: getStringField(section, 'description'),
      items: asArray(asRecord(section).items).slice(0, 3),
      evidence: asArray(asRecord(section).evidence).slice(0, 3),
    })),
    availableActions: actions,
    suggestedNextAnalyses: nextAnalyses,
  }
}

function buildFocusedContext(payload: {
  triggerType?: unknown
  triggerLabel?: unknown
  workspaceState?: unknown
  output?: unknown
  metric?: unknown
  action?: unknown
  nextAnalysis?: unknown
  question?: unknown
  evidence?: unknown
}) {
  return {
    instruction:
      'Focus only on the clicked object and current workspace state. Do not summarize the entire document and do not list every KPI, action, section, or recommendation.',
    workspaceState: payload.workspaceState,
    clicked: {
      type: payload.triggerType,
      label: payload.triggerLabel,
      metric: payload.metric,
      action: payload.action,
      nextAnalysis: payload.nextAnalysis,
      question: payload.question,
      evidence: payload.evidence,
    },
    documentContext: compactOutput(payload.output),
  }
}

function getSystemPrompt(language?: string) {
  return [
    'You are FlowSummary, an enterprise AI analyst embedded inside a living analytics workspace.',
    formatLanguageInstruction(language),
    'The user clicked one specific workspace button. Answer that exact click with a useful analyst response.',
    'Do not write generic SaaS marketing copy. Do not explain that you are an AI model.',
    'Do not enumerate every KPI, every action, every section, or every recommendation.',
    'Do not produce the same structure for every click. The response must change based on the clicked action type and clicked payload.',
    'Start with a detailed but concise answer in prose. Use short lists only for supporting steps or evidence.',
    'Use the provided focused context, clicked button payload, and workspace state.',
    'Preserve business context. Refer only to the most relevant KPI, evidence, source fields, risk, priority, or next analysis.',
    'If evidence is limited, state what should be validated instead of inventing numbers.',
    'Return an executive-ready answer that helps the user decide what to do next.',
    '',
    'Return ONLY this JSON shape:',
    '{"title":"string","label":"string","description":"string","answer":"specific prose answer, 3-6 sentences","blocks":[{"title":"string","items":["1-3 concise supporting bullets"]}],"primaryAction":"string"}',
    'Use 0-3 blocks. If the prose answer is enough, keep blocks minimal.',
  ].join('\n')
}

export async function POST(request: Request) {
  const user = await getAuthorizedRaytechUser(request)

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  if (!hasOpenRouterConfig()) {
    return NextResponse.json({ message: 'OPENROUTER_API_KEY is not configured.' }, { status: 503 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid JSON payload.' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ message: 'Invalid workspace action payload.' }, { status: 400 })
  }

  const payload = body as Record<string, unknown>
  const language = cleanString(payload.language, 'id')
  const triggerType = cleanString(payload.triggerType, 'workspace-action')
  const triggerLabel = cleanString(payload.triggerLabel, 'Workspace action')

  try {
    const response = await generateJsonWithOpenRouter({
      systemPrompt: getSystemPrompt(language),
      userPrompt: [
        `Clicked action type: ${triggerType}`,
        `Clicked action label: ${triggerLabel}`,
        '',
        'Focused context JSON:',
        clampJson(buildFocusedContext(payload)),
      ].join('\n'),
      maxTokens: 1200,
      temperature: 0.15,
    })

    const modal = normalizeModalPayload(response.data)

    if (!modal) {
      return NextResponse.json({ message: 'AI returned an invalid workspace modal.' }, { status: 502 })
    }

    return NextResponse.json({ modal, model: response.model })
  } catch (error) {
    console.error('[workspace-action] failed', error)
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Failed to generate workspace action.',
      },
      { status: 500 },
    )
  }
}
