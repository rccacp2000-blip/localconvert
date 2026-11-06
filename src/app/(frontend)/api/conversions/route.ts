import { getCurrentAppUser } from '@/lib/app-auth'
import config from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

const OPERATIONS = new Set(['uppercase', 'lowercase', 'json', 'lines'])

export async function POST(request: Request) {
  const session = await getCurrentAppUser()
  if (!session) return NextResponse.json({ error: 'Sign in to track usage.' }, { status: 401 })

  try {
    const body = (await request.json()) as Record<string, unknown>
    const operation = typeof body.operation === 'string' ? body.operation : ''
    const inputBytes = typeof body.inputBytes === 'number' ? body.inputBytes : -1
    const outputBytes = typeof body.outputBytes === 'number' ? body.outputBytes : -1
    if (
      !OPERATIONS.has(operation) ||
      !Number.isSafeInteger(inputBytes) ||
      !Number.isSafeInteger(outputBytes)
    ) {
      return NextResponse.json({ error: 'Invalid conversion metadata.' }, { status: 400 })
    }
    const validOperation = operation as 'uppercase' | 'lowercase' | 'json' | 'lines'

    const payload = await getPayload({ config })
    await payload.create({
      collection: 'conversion-events',
      data: {
        owner: session.raw.id,
        operation: validOperation,
        inputBytes,
        outputBytes,
        success: true,
      },
      draft: false,
      overrideAccess: false,
      user: session.raw,
    })
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Usage could not be recorded.' }, { status: 400 })
  }
}
