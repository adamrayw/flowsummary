import { NextResponse } from 'next/server'

import { getAuthorizedRaytechUser } from '@/lib/raytech-account'

export async function GET(request: Request) {
  const user = await getAuthorizedRaytechUser(request)

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ user })
}
