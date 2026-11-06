'use client'

import { FormEvent, useEffect, useState } from 'react'

export type AccountUser = {
  id: string | number
  email: string
  name?: string | null
  plan: 'free' | 'pro'
}

export function AccountControls({
  user,
  onSession,
}: {
  user: AccountUser | null | undefined
  onSession: (user: AccountUser | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/account/session')
      .then((response) => response.json())
      .then((data: { user: AccountUser | null }) => onSession(data.user))
      .catch(() => onSession(null))
  }, [onSession])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPending(true)
    setError('')
    const data = Object.fromEntries(new FormData(event.currentTarget))
    try {
      const response = await fetch(`/api/account/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = (await response.json()) as { user?: AccountUser; error?: string }
      if (!response.ok || !result.user) throw new Error(result.error || 'Please try again.')
      onSession(result.user)
      setOpen(false)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Please try again.')
    } finally {
      setPending(false)
    }
  }

  const logout = async () => {
    await fetch('/api/account/logout', { method: 'POST' })
    onSession(null)
  }

  return (
    <>
      {user ? (
        <div className="account-menu">
          <span>
            {user.name || user.email}
            <small>{user.plan} plan</small>
          </span>
          <button onClick={logout}>SIGN OUT</button>
        </div>
      ) : (
        <button className="account-button" onClick={() => setOpen(true)}>
          {user === undefined ? 'LOADING…' : 'SIGN IN'}
        </button>
      )}

      {open && (
        <div className="account-overlay" role="presentation" onMouseDown={() => setOpen(false)}>
          <div
            className="account-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setOpen(false)}
              aria-label="Close account dialog"
            >
              ×
            </button>
            <span className="section-label">LOCALCONVERT ACCOUNT</span>
            <h2 id="account-title">
              {mode === 'login' ? 'WELCOME BACK.' : 'CREATE YOUR ACCOUNT.'}
            </h2>
            <p>
              {mode === 'login'
                ? 'Sign in to access your plan and usage history.'
                : 'Create a free account. Your files still never leave your device.'}
            </p>
            <form onSubmit={submit}>
              {mode === 'signup' && (
                <label>
                  NAME
                  <input name="name" required maxLength={80} autoComplete="name" />
                </label>
              )}
              <label>
                EMAIL
                <input name="email" type="email" required autoComplete="email" />
              </label>
              <label>
                PASSWORD
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  maxLength={72}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </label>
              {error && <div className="error-message">{error}</div>}
              <button className="process-button" disabled={pending}>
                {pending ? 'PLEASE WAIT…' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
              </button>
            </form>
            <button
              className="mode-switch"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setError('')
              }}
            >
              {mode === 'login'
                ? 'NEW HERE? CREATE AN ACCOUNT'
                : 'ALREADY HAVE AN ACCOUNT? SIGN IN'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
