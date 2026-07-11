import { NextResponse } from 'next/server'

import { generateJsonWithOpenRouter, hasOpenRouterConfig } from '@/lib/openrouter'
import { getAuthorizedRaytechUser } from '@/lib/raytech-account'

type AnalystConsoleMessage = {
  role: 'user' | 'assistant'
  content: string
  supportingEvidence?: Array<{
    label: string
    value: string
  }>
  followUps?: string[]
}

const MAX_CONTEXT_CHARS = 26_000

function cleanString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function cleanStringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5)
}

function asRecord(value: unknown) {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function clampJson(value: unknown, maxChars = MAX_CONTEXT_CHARS) {
  const serialized = JSON.stringify(value, null, 2)
  if (serialized.length <= maxChars) return serialized
  return `${serialized.slice(0, maxChars)}\n...context truncated`
}

function compactOutput(output: unknown) {
  const record = asRecord(output)
  const metrics = asArray(record.metrics).slice(0, 6)
  const sections = asArray(record.sections).slice(0, 5)
  const actions = asArray(record.actions).slice(0, 5)
  const nextAnalyses = asArray(record.nextAnalyses).slice(0, 4)

  return {
    title: record.title,
    workspaceTitle: record.workspaceTitle,
    renderer: record.renderer,
    purpose: record.purpose,
    aiThinkingSummary: record.aiThinkingSummary,
    statusLine: record.statusLine,
    hero: record.hero,
    metrics,
    sections,
    recommendedActions: actions,
    nextAnalyses,
    followUpQuestions: asArray(record.followUpQuestions).slice(0, 5),
  }
}

function normalizeMessage(value: unknown): AnalystConsoleMessage | null {
  if (typeof value !== 'object' || value === null) return null

  const record = value as {
    content?: unknown
    supportingEvidence?: unknown
    followUps?: unknown
  }
  const content = cleanString(record.content)
  if (!content) return null

  const supportingEvidence = asArray(record.supportingEvidence)
    .map((item) => {
      const evidence = asRecord(item)
      const label = cleanString(evidence.label)
      const value = cleanString(evidence.value)
      if (!label || !value) return null
      return { label, value }
    })
    .filter((item): item is { label: string; value: string } => Boolean(item))
    .slice(0, 4)

  return {
    role: 'assistant',
    content,
    supportingEvidence,
    followUps: cleanStringArray(record.followUps),
  }
}

function getSystemPrompt() {
  return [
    'You are FlowSummary AI Analyst Console, a contextual enterprise investigation assistant.',
    'You are not ChatGPT. Do not start with hello, greetings, or generic help offers.',
    'Immediately answer using the current workspace state, document context, previous reasoning, current evidence, and conversation memory.',
    'The workspace is the primary product. The console continues the investigation and should not reset context.',
    'Never ask the user to repeat workspace, KPI, filters, region, time, product, evidence, or prior reasoning when provided.',
    'Answer in a concise analyst style: explain what it means, why it matters, what evidence supports it, and what to investigate next.',
    'If the user uses a slash command, execute the command directly using current context.',
    'If evidence is limited, say what needs validation. Do not invent numbers.',
    'Always include follow-up suggestions that encourage continued investigation.',
    '',
    'Return ONLY JSON:',
    '{"content":"3-7 sentence contextual analyst answer","supportingEvidence":[{"label":"string","value":"string"}],"followUps":["2-5 short follow-up chips"]}',
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
    return NextResponse.json({ message: 'Invalid analyst console payload.' }, { status: 400 })
  }

  const payload = body as {
    prompt?: unknown
    command?: unknown
    workspaceState?: unknown
    output?: unknown
    messages?: unknown
  }
  const prompt = cleanString(payload.prompt)
  const command = cleanString(payload.command)

  if (!prompt) {
    return NextResponse.json({ message: 'Prompt is required.' }, { status: 400 })
  }

  const memory = asArray(payload.messages).slice(-10).map((message) => {
    const record = asRecord(message)
    return {
      role: cleanString(record.role),
      content: cleanString(record.content),
    }
  }).filter((message) => message.role && message.content)

  try {
    const response = await generateJsonWithOpenRouter({
      systemPrompt: getSystemPrompt(),
      userPrompt: [
        command ? `Slash command: ${command}` : 'Slash command: none',
        `User prompt: ${prompt}`,
        '',
        'Context JSON:',
        clampJson({
          workspaceState: payload.workspaceState,
          documentContext: compactOutput(payload.output),
          conversationMemory: memory,
        }),
      ].join('\n'),
      maxTokens: 1300,
      temperature: 0.15,
    })

    const message = normalizeMessage(response.data)
    if (!message) {
      return NextResponse.json({ message: 'AI returned an invalid console message.' }, { status: 502 })
    }

    return NextResponse.json({ message, model: response.model })
  } catch (error) {
    console.error('[workspace-console] failed', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to continue analyst investigation.' },
      { status: 500 },
    )
  }
}
