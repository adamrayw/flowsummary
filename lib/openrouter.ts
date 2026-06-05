import { TEMPLATE_PROMPTS } from '@/lib/constants'
import type { GeneratedSummary } from '@/lib/summary-types'

const MAX_SOURCE_CHARS = 80_000
const DEFAULT_MODEL = 'meta-llama/llama-3.1-8b-instruct:free'
const DEFAULT_FALLBACK_MODEL = 'openrouter/free'

function clampText(value: string, maxChars: number) {
  if (value.length <= maxChars) {
    return value
  }

  return `${value.slice(0, maxChars)}...`
}

function stripCodeFence(value: string) {
  const cleaned = value.trim()
  if (!/^```[\w-]*\n[\s\S]*\n```$/.test(cleaned)) {
    return cleaned
  }

  return cleaned.replace(/^```[\w-]*\n/, '').replace(/\n```$/, '').trim()
}

function extractOpenRouterText(payload: unknown) {
  if (typeof payload !== 'object' || payload === null) {
    return ''
  }

  const choices = (payload as { choices?: unknown }).choices
  if (!Array.isArray(choices) || choices.length === 0) {
    return ''
  }

  const firstChoice = choices[0]
  if (typeof firstChoice !== 'object' || firstChoice === null) {
    return ''
  }

  const message = (firstChoice as { message?: unknown }).message
  if (typeof message !== 'object' || message === null) {
    return ''
  }

  const content = (message as { content?: unknown }).content
  if (typeof content === 'string') {
    return stripCodeFence(content)
  }

  if (!Array.isArray(content)) {
    return ''
  }

  const chunks: string[] = []
  for (const part of content) {
    if (typeof part !== 'object' || part === null) {
      continue
    }

    const text = (part as { text?: unknown }).text
    if (typeof text === 'string' && text.trim()) {
      chunks.push(text.trim())
    }
  }

  return stripCodeFence(chunks.join('\n\n'))
}

function getOpenRouterError(payload: unknown) {
  if (typeof payload !== 'object' || payload === null || !('error' in payload)) {
    return null
  }

  const error = (payload as { error?: { message?: unknown } }).error
  return typeof error?.message === 'string' ? error.message : null
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseGeneratedSummary(raw: string): GeneratedSummary | null {
  try {
    const parsed = JSON.parse(stripCodeFence(raw)) as Partial<GeneratedSummary>
    const title = typeof parsed.title === 'string' ? parsed.title.trim() : ''
    const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : ''
    const keyInsights = normalizeStringArray(parsed.keyInsights)
    const recommendations = normalizeStringArray(parsed.recommendations)
    const conclusion = typeof parsed.conclusion === 'string' ? parsed.conclusion.trim() : ''

    if (!summary || keyInsights.length === 0 || recommendations.length === 0 || !conclusion) {
      return null
    }

    return {
      title: title || 'Untitled Summary',
      summary,
      keyInsights,
      recommendations,
      conclusion,
    }
  } catch {
    return null
  }
}

function fallbackTitle(sourceText: string) {
  const firstLine = sourceText
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean)

  if (!firstLine) {
    return 'Untitled Summary'
  }

  return firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine
}

function getInstructions(templateId: string | null, customInstructions: string) {
  const templateInstructions = templateId ? TEMPLATE_PROMPTS[templateId] : undefined
  const effectiveInstructions = customInstructions.trim() || templateInstructions || 'Create a professional summary report.'

  return [
    'You are FlowSummary, an AI report-writing assistant.',
    'Transform raw user information into a concise professional report.',
    'Return ONLY valid JSON. Do not wrap it in markdown.',
    'JSON shape:',
    '{"title":"short report title","summary":"one concise paragraph","keyInsights":["3-5 insights"],"recommendations":["3-5 recommendations"],"conclusion":"short closing paragraph"}',
    '',
    'User instructions:',
    effectiveInstructions,
  ].join('\n')
}

export async function generateSummaryWithOpenRouter(params: {
  sourceText: string
  instructions: string
  templateId: string | null
}) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is missing. Set it in .env.local.')
  }

  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL
  const fallbackModel = process.env.OPENROUTER_FALLBACK_MODEL || DEFAULT_FALLBACK_MODEL
  const sourceText = clampText(params.sourceText, MAX_SOURCE_CHARS)

  const callOpenRouter = async (targetModel: string) =>
    fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'FlowSummary',
      },
      body: JSON.stringify({
        model: targetModel,
        messages: [
          {
            role: 'system',
            content: getInstructions(params.templateId, params.instructions),
          },
          {
            role: 'user',
            content: sourceText,
          },
        ],
        temperature: 0.2,
        max_tokens: 1200,
      }),
    })

  const primaryResponse = await callOpenRouter(model)
  const primaryPayload = (await primaryResponse.json().catch(() => null)) as unknown
  const primaryError = getOpenRouterError(primaryPayload)

  if (
    !primaryResponse.ok &&
    fallbackModel &&
    fallbackModel !== model &&
    primaryError?.includes('No endpoints found for')
  ) {
    const fallbackResponse = await callOpenRouter(fallbackModel)
    const fallbackPayload = (await fallbackResponse.json().catch(() => null)) as unknown

    if (!fallbackResponse.ok) {
      throw new Error(getOpenRouterError(fallbackPayload) || 'Failed to generate summary.')
    }

    const fallbackOutput = parseGeneratedSummary(extractOpenRouterText(fallbackPayload))
    if (!fallbackOutput) {
      throw new Error('AI returned an invalid response. Try a more specific prompt.')
    }

    return {
      output: {
        ...fallbackOutput,
        title: fallbackOutput.title || fallbackTitle(sourceText),
      },
      model: fallbackModel,
    }
  }

  if (!primaryResponse.ok) {
    throw new Error(primaryError || 'Failed to generate summary.')
  }

  const output = parseGeneratedSummary(extractOpenRouterText(primaryPayload))
  if (!output) {
    throw new Error('AI returned an invalid response. Try a more specific prompt.')
  }

  return {
    output: {
      ...output,
      title: output.title || fallbackTitle(sourceText),
    },
    model,
  }
}
