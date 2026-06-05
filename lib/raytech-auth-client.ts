const fallbackAuthBaseUrl = process.env.RAYTECH_AUTH_URL || 'https://auth.raytech.cloud'

const raytechAuthBaseUrl = process.env.NEXT_PUBLIC_AUTH_URL || fallbackAuthBaseUrl

function getAuthUrl(path: string) {
  return new URL(path, raytechAuthBaseUrl).toString()
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
