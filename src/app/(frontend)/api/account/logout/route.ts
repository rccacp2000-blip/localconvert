import { logoutAppUser } from '@/lib/app-auth'
import { NextResponse } from 'next/server'

export async function POST() {
  await logoutAppUser()
  return NextResponse.json({ success: true })
}
