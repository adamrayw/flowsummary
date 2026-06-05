export type RaytechUser = {
  id: string
  name: string
  email: string
}

function sanitizeEnvValue(value?: string) {
  if (!value) {
    return undefined
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }

  return trimmed.replace(/^['"]+|['"]+$/g, '')
}

const fallbackAuthBaseUrl = process.env.RAYTECH_AUTH_URL || 'https://auth.raytech.cloud'
const fallbackAppBaseUrl = 'http://localhost:3000'

const configuredAuthBaseUrl =
  sanitizeEnvValue(process.env.RAYTECH_AUTH_URL) ||
  sanitizeEnvValue(process.env.NEXT_PUBLIC_AUTH_URL)

export const raytechAuthBaseUrl = configuredAuthBaseUrl || fallbackAuthBaseUrl

export const flowsummaryAppBaseUrl =
  sanitizeEnvValue(process.env.NEXT_PUBLIC_APP_URL) || fallbackAppBaseUrl

export const raytechSessionCookieName =
  sanitizeEnvValue(process.env.RAYTECH_SESSION_COOKIE_NAME) ||
  sanitizeEnvValue(process.env.COOKIE_NAME) ||
  'raytech_session'

export const raytechSessionCookieNames = Array.from(
  new Set(
    raytechSessionCookieName.startsWith('__Secure-')
      ? [raytechSessionCookieName, raytechSessionCookieName.replace(/^__Secure-/, '')]
      : [raytechSessionCookieName, `__Secure-${raytechSessionCookieName}`],
  ),
)

const authDebugEnabled = process.env.RAYTECH_AUTH_DEBUG === '1'

function fallbackNameFromEmail(email: string) {
  const localPart = email.split('@')[0]?.trim()
  return localPart ? localPart : 'RayTech User'
}

function getAuthUrl(path: string) {
  return new URL(path, raytechAuthBaseUrl).toString()
}

function logAuthDebug(message: string, details?: Record<string, unknown>) {
  if (!authDebugEnabled) {
    return
  }

  console.info('[raytech-auth]', message, {
    authBaseUrl: raytechAuthBaseUrl,
    rAuth: process.env.RAYTECH_AUTH_URL || null,
    npAuth: process.env.NEXT_PUBLIC_AUTH_URL || null,
    nodeEnv: process.env.NODE_ENV || null,
    ...details,
  })
}

function isLocalHostname(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

export function resolveProductReturnTo(rawUrl?: string) {
  if (!rawUrl) {
    return undefined
  }

  try {
    const requestUrl = new URL(rawUrl)
    const appUrl = new URL(flowsummaryAppBaseUrl)

    if (isLocalHostname(requestUrl.hostname) && !isLocalHostname(appUrl.hostname)) {
      return new URL(
        `${requestUrl.pathname}${requestUrl.search}${requestUrl.hash}`,
        appUrl,
      ).toString()
    }

    return requestUrl.toString()
  } catch {
    return rawUrl
  }
}

export function buildAuthLoginUrl(returnTo?: string) {
  const url = new URL(getAuthUrl('/login'))
  if (returnTo) {
    url.searchParams.set('returnTo', returnTo)
  }
  return url.toString()
}

export function buildAuthRegisterUrl(returnTo?: string) {
  const url = new URL(getAuthUrl('/register'))
  if (returnTo) {
    url.searchParams.set('returnTo', returnTo)
  }
  return url.toString()
}

export function buildAuthLogoutUrl(returnTo?: string) {
  const url = new URL(getAuthUrl('/logout'))
  if (returnTo) {
    url.searchParams.set('returnTo', returnTo)
  }
  return url.toString()
}

export async function getRaytechUserByCookie(params: {
  cookieHeader?: string | null
  origin?: string | null
}): Promise<RaytechUser | null> {
  const headers = new Headers()

  if (params.cookieHeader) {
    headers.set('cookie', params.cookieHeader)
  }

  if (params.origin) {
    headers.set('x-raytech-origin', params.origin)
  }

  const authMeUrl = getAuthUrl('/api/me')
  logAuthDebug('request /api/me', {
    authMeUrl,
    hasCookieHeader: Boolean(params.cookieHeader),
    origin: params.origin || null,
  })

  let response: Response
  try {
    response = await fetch(authMeUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })
  } catch (error) {
    console.error('[raytech-auth] fetch /api/me failed', {
      authMeUrl,
      authBaseUrl: raytechAuthBaseUrl,
      rAuth: process.env.RAYTECH_AUTH_URL || null,
      npAuth: process.env.NEXT_PUBLIC_AUTH_URL || null,
      nodeEnv: process.env.NODE_ENV || null,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }

  if (!response.ok) {
    logAuthDebug('request /api/me returned non-ok', {
      authMeUrl,
      status: response.status,
    })
    return null
  }

  const data = (await response.json()) as Partial<RaytechUser>

  if (!data.id || !data.email) {
    return null
  }

  const normalizedEmail = data.email.toLowerCase()
  const normalizedName = data.name?.trim() || fallbackNameFromEmail(normalizedEmail)

  return {
    id: data.id,
    email: normalizedEmail,
    name: normalizedName,
  }
}

export async function getAuthorizedRaytechUser(request: Request): Promise<RaytechUser | null> {
  return getRaytechUserByCookie({
    cookieHeader: request.headers.get('cookie'),
    origin: request.headers.get('origin'),
  })
}
