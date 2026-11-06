import { getCurrentAppUser } from '@/lib/app-auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getCurrentAppUser()
  return NextResponse.json({ user: session?.view ?? null })
}
