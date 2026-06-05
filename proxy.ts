import { NextResponse, type NextRequest } from 'next/server'
import {
  buildAuthLoginUrl,
  buildAuthRegisterUrl,
  flowsummaryAppBaseUrl,
  raytechAuthBaseUrl,
  raytechSessionCookieNames,
  resolveProductReturnTo,
} from '@/lib/raytech-account'

function isInternalDataOrPrefetchRequest(request: NextRequest) {
  const accept = request.headers.get('accept') || ''

  return (
    request.nextUrl.searchParams.has('_rsc') ||
    request.nextUrl.searchParams.has('__next_rsc') ||
    request.nextUrl.searchParams.has('__next_router_prefetch') ||
    request.headers.get('rsc') === '1' ||
    request.headers.get('next-router-prefetch') === '1' ||
    request.headers.get('purpose') === 'prefetch' ||
    request.headers.get('x-middleware-prefetch') === '1' ||
    accept.includes('text/x-component')
  )
}

function isDocumentNavigation(request: NextRequest) {
  if (isInternalDataOrPrefetchRequest(request)) {
    return false
  }

  const mode = request.headers.get('sec-fetch-mode')
  const dest = request.headers.get('sec-fetch-dest')
  const accept = request.headers.get('accept') || ''

  return mode === 'navigate' || dest === 'document' || accept.includes('text/html')
}

const authDebugEnabled = process.env.RAYTECH_AUTH_DEBUG === '1'

function logProxyDebug(message: string, details?: Record<string, unknown>) {
  if (!authDebugEnabled) {
    return
  }

  console.info('[raytech-proxy]', message, {
    authBaseUrl: raytechAuthBaseUrl,
    rAuth: process.env.RAYTECH_AUTH_URL || null,
    npAuth: process.env.NEXT_PUBLIC_AUTH_URL || null,
    nodeEnv: process.env.NODE_ENV || null,
    ...details,
  })
}

function buildProductUrl(path: string) {
  return new URL(path, flowsummaryAppBaseUrl)
}

function getCookieNames(request: NextRequest) {
  return request.cookies.getAll().map((cookie) => cookie.name)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const cookieNames = getCookieNames(request)
  const sessionCookie = raytechSessionCookieNames
    .map((cookieName) => request.cookies.get(cookieName)?.value)
    .find(Boolean)
  const isAuthenticated = Boolean(sessionCookie)
  const isDocNav = isDocumentNavigation(request)

  logProxyDebug('incoming request', {
    pathname,
    hasSessionCookie: isAuthenticated,
    expectedSessionCookieNames: raytechSessionCookieNames,
    receivedCookieNames: cookieNames,
    isDocumentNavigation: isDocNav,
    search: request.nextUrl.search,
    host: request.headers.get('host'),
    xForwardedHost: request.headers.get('x-forwarded-host'),
    xForwardedProto: request.headers.get('x-forwarded-proto'),
  })

  if (pathname.startsWith('/dashboard') && !isAuthenticated) {
    const returnTo = resolveProductReturnTo(request.url)
    const signInUrl = buildProductUrl('/signin')
    if (returnTo) {
      signInUrl.searchParams.set('returnTo', returnTo)
    }
    logProxyDebug('redirect unauthenticated dashboard request to local signin', {
      redirectTo: signInUrl.toString(),
    })
    return NextResponse.redirect(signInUrl)
  }

  if (pathname === '/signin') {
    if (isDocNav) {
      const returnTo = request.nextUrl.searchParams.get('returnTo') || undefined
      const redirectTo = buildAuthLoginUrl(returnTo)
      logProxyDebug('redirect signin to auth login', { redirectTo })
      return NextResponse.redirect(new URL(redirectTo))
    }

    return NextResponse.next()
  }

  if (pathname === '/signup') {
    if (isDocNav) {
      const returnTo = request.nextUrl.searchParams.get('returnTo') || undefined
      const redirectTo = buildAuthRegisterUrl(returnTo)
      logProxyDebug('redirect signup to auth register', { redirectTo })
      return NextResponse.redirect(new URL(redirectTo))
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/signin', '/signup'],
}
