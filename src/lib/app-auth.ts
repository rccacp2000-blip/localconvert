import config from '@payload-config'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'

const SESSION_COOKIE = 'app-session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7

export type AppUserView = {
  id: string | number
  email: string
  name?: string | null
  plan: 'free' | 'pro'
}

function toUserView(user: {
  id: string | number
  email?: string | null
  name?: string | null
  plan?: 'free' | 'pro' | null
}): AppUserView {
  return {
    id: user.id,
    email: user.email ?? '',
    name: user.name,
    plan: user.plan === 'pro' ? 'pro' : 'free',
  }
}

export async function getCurrentAppUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null

  const payload = await getPayload({ config })
  const authHeaders = new Headers({ Authorization: `JWT ${token}` })
  const { user } = await payload.auth({ headers: authHeaders })
  if (!user || user.collection !== 'users') return null
  return { raw: user, view: toUserView(user) }
}

export async function loginAppUser(email: string, password: string) {
  const payload = await getPayload({ config })
  const result = await payload.login({
    collection: 'users',
    data: { email, password },
  })
  if (!result.token || !result.user) {
    throw new Error('Unable to create a secure session.')
  }

  ;(await cookies()).set(SESSION_COOKIE, result.token, {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
  return toUserView(result.user)
}

export async function createAppUser(name: string, email: string, password: string) {
  const payload = await getPayload({ config })
  await payload.create({
    collection: 'users',
    data: { name, email, password, plan: 'free' },
    draft: false,
    overrideAccess: false,
  })
  return loginAppUser(email, password)
}

export async function logoutAppUser() {
  ;(await cookies()).delete(SESSION_COOKIE)
}
