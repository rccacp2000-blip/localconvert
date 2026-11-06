import { createAppUser } from '@/lib/app-auth'
import { NextResponse } from 'next/server'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!name || !EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { error: 'Enter your name and a valid email address.' },
        { status: 400 },
      )
    }
    if (password.length < 8 || password.length > 72) {
      return NextResponse.json(
        { error: 'Password must be between 8 and 72 characters.' },
        { status: 400 },
      )
    }

    const user = await createAppUser(name, email, password)
    return NextResponse.json({ user }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'An account with that email may already exist.' },
      { status: 409 },
    )
  }
}
