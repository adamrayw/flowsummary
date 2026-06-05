'use client'

import { useCallback, useEffect, useState } from 'react'

type AuthUser = {
  id: string
  name: string
  email: string
}

type Status = 'loading' | 'authenticated' | 'unauthenticated'

type SessionData = {
  user: AuthUser
} | null

export function useAuthSession() {
  const [status, setStatus] = useState<Status>('loading')
  const [data, setData] = useState<SessionData>(null)

  const refresh = useCallback(async () => {
    setStatus('loading')

    try {
      const response = await fetch('/api/auth/me', { cache: 'no-store' })
      if (!response.ok) {
        setData(null)
        setStatus('unauthenticated')
        return null
      }

      const payload = (await response.json()) as { user: AuthUser }
      if (!payload.user?.id) {
        setData(null)
        setStatus('unauthenticated')
        return null
      }

      const next = { user: payload.user }
      setData(next)
      setStatus('authenticated')
      return next
    } catch {
      setData(null)
      setStatus('unauthenticated')
      return null
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    data,
    status,
    refresh,
  }
}
