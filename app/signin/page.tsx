'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { buildAuthLoginUrl } from '@/lib/raytech-auth-client'

export default function SignInPage() {
  const [authUrl, setAuthUrl] = useState(() => buildAuthLoginUrl())

  useEffect(() => {
    const returnTo = new URLSearchParams(window.location.search).get('returnTo') ?? undefined
    const nextAuthUrl = buildAuthLoginUrl(returnTo)
    setAuthUrl(nextAuthUrl)

    window.location.replace(nextAuthUrl)
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Redirecting to RayTech Account...</p>
        <Link className="text-sm text-primary hover:text-primary/90" href={authUrl}>
          Continue to login
        </Link>
      </div>
    </main>
  )
}
