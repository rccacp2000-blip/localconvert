import { loginAppUser } from '@/lib/app-auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }
    const user = await loginAppUser(email, password)
    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ error: 'Email or password is incorrect.' }, { status: 401 })
  }
}
