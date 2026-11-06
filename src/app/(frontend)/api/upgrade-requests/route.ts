import { getCurrentAppUser } from '@/lib/app-auth'
import config from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

export async function POST() {
  const session = await getCurrentAppUser()
  if (!session) {
    return NextResponse.json({ error: 'Sign in to request Pro access.' }, { status: 401 })
  }
  if (session.view.plan === 'pro') {
    return NextResponse.json({ message: 'Your account is already on Pro.' })
  }

  const payload = await getPayload({ config })
  const existing = await payload.find({
    collection: 'upgrade-requests',
    where: {
      and: [{ owner: { equals: session.raw.id } }, { status: { equals: 'pending' } }],
    },
    limit: 1,
    overrideAccess: false,
    user: session.raw,
  })

  if (existing.totalDocs > 0) {
    return NextResponse.json({ message: 'Your Pro request is already pending.' })
  }

  await payload.create({
    collection: 'upgrade-requests',
    data: { owner: session.raw.id, status: 'pending' },
    draft: false,
    overrideAccess: false,
    user: session.raw,
  })
  return NextResponse.json({ message: 'Your Pro request has been received.' }, { status: 201 })
}
