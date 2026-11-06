'use client'

import { ChangeEvent, DragEvent, useRef, useState } from 'react'
import { AccountControls, type AccountUser } from './AccountControls'

type Operation = 'uppercase' | 'lowercase' | 'json' | 'lines'
const operations: {
  id: Operation
  title: string
  description: string
  icon: string
}[] = [
  {
    id: 'uppercase',
    title: 'UPPERCASE',
    description: 'Convert every letter to uppercase',
    icon: 'Aa',
  },
  {
    id: 'lowercase',
    title: 'lowercase',
    description: 'Convert every letter to lowercase',
    icon: 'aa',
  },
  {
    id: 'json',
    title: 'Format JSON',
    description: 'Prettify and validate JSON data',
    icon: '{ }',
  },
  {
    id: 'lines',
    title: 'Clean lines',
    description: 'Trim whitespace and remove empty lines',
    icon: '≡',
  },
]

function ShieldIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3 5.5 5.8v5.6c0 4.2 2.7 7.9 6.5 9.6 3.8-1.7 6.5-5.4 6.5-9.6V5.8L12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="m9.2 12 1.8 1.8 3.9-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14m-5-5 5 5-5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m5 12.5 4.2 4L19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function App() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [operation, setOperation] = useState<Operation>('json')
  const [dragging, setDragging] = useState(false)
  const [result, setResult] = useState<{
    url: string
    name: string
    size: number
  } | null>(null)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)
  const [user, setUser] = useState<AccountUser | null | undefined>(undefined)
  const [upgradeMessage, setUpgradeMessage] = useState('')
  const maxFileBytes = user?.plan === 'pro' ? 2 * 1024 * 1024 * 1024 : 25 * 1024 * 1024
  const maxFileLabel = user?.plan === 'pro' ? '2 GB' : '25 MB'

  const chooseFile = (nextFile?: File) => {
    if (!nextFile) return
    if (nextFile.size > maxFileBytes) {
      setError(`This file is over your ${maxFileLabel} plan limit.`)
      return
    }
    if (result) URL.revokeObjectURL(result.url)
    setResult(null)
    setError('')
    setFile(nextFile)
  }
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    chooseFile(event.dataTransfer.files[0])
  }
  const handleInput = (event: ChangeEvent<HTMLInputElement>) => chooseFile(event.target.files?.[0])

  const processFile = async () => {
    if (!file) {
      inputRef.current?.click()
      return
    }
    setProcessing(true)
    setError('')
    await new Promise((resolve) => window.setTimeout(resolve, 450))
    try {
      const text = await file.text()
      let output = text
      let suffix = 'processed'
      if (operation === 'uppercase') {
        output = text.toUpperCase()
        suffix = 'uppercase'
      } else if (operation === 'lowercase') {
        output = text.toLowerCase()
        suffix = 'lowercase'
      } else if (operation === 'json') {
        output = JSON.stringify(JSON.parse(text), null, 2)
        suffix = 'formatted'
      } else {
        output = text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .join('\n')
        suffix = 'clean'
      }
      const dot = file.name.lastIndexOf('.')
      const base = dot > 0 ? file.name.slice(0, dot) : file.name
      const extension = dot > 0 ? file.name.slice(dot) : operation === 'json' ? '.json' : '.txt'
      const blob = new Blob([output], { type: file.type || 'text/plain' })
      if (result) URL.revokeObjectURL(result.url)
      setResult({
        url: URL.createObjectURL(blob),
        name: `${base}-${suffix}${extension}`,
        size: blob.size,
      })
      if (user) {
        void fetch('/api/conversions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operation,
            inputBytes: file.size,
            outputBytes: blob.size,
          }),
        })
      }
    } catch {
      setError(
        operation === 'json'
          ? 'That file does not contain valid JSON. Try another operation.'
          : 'This file could not be read as text.',
      )
    } finally {
      setProcessing(false)
    }
  }
  const reset = () => {
    if (result) URL.revokeObjectURL(result.url)
    setFile(null)
    setResult(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const requestUpgrade = async () => {
    if (!user) {
      setUpgradeMessage('Sign in or create an account before requesting Pro access.')
      return
    }
    setUpgradeMessage('SENDING REQUEST…')
    const response = await fetch('/api/upgrade-requests', { method: 'POST' })
    const data = (await response.json()) as { message?: string; error?: string }
    setUpgradeMessage(data.message || data.error || 'The request could not be sent.')
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#" aria-label="LocalConvert home">
          <span className="brand-mark">LC</span>
          <span>LocalConvert</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#how-it-works">HOW IT WORKS</a>
          <a href="#pricing">PRICING</a>
          <a href="#privacy">PRIVACY</a>
        </nav>
        <div className="header-actions">
          <AccountControls user={user} onSession={setUser} />
          {user?.plan !== 'pro' && (
            <a href="#pricing" className="upgrade-button">
              UPGRADE <ArrowIcon />
            </a>
          )}
        </div>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span /> PRIVATE BY DEFAULT
            </div>
            <h1>
              YOUR FILES.
              <br />
              <em>YOUR DEVICE.</em>
            </h1>
            <p>
              Fast, private file tools that run entirely in your browser. Nothing uploaded. Nothing
              stored. Just results.
            </p>
            <div className="trust-row">
              <span>
                <ShieldIcon /> 100% LOCAL
              </span>
              <span>NO SIGN-UP</span>
              <span>INSTANT RESULTS</span>
            </div>
          </div>
          <div className="tool-card">
            <div className="step-heading">
              <span>01</span>
              <div>
                <h2>DROP YOUR FILE</h2>
                <p>TXT, JSON, CSV · Up to {maxFileLabel}</p>
              </div>
            </div>
            <div
              className={`drop-zone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".txt,.json,.csv,text/*,application/json"
                onChange={handleInput}
                hidden
              />
              {file ? (
                <>
                  <div className="file-icon">DOC</div>
                  <div className="file-info">
                    <strong>{file.name}</strong>
                    <span>{formatSize(file.size)} · Ready locally</span>
                  </div>
                  <button
                    className="change-file"
                    onClick={(e) => {
                      e.stopPropagation()
                      inputRef.current?.click()
                    }}
                  >
                    CHANGE
                  </button>
                </>
              ) : (
                <>
                  <div className="upload-icon">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <strong>DROP IT HERE</strong>
                  <span>or click to choose from your device</span>
                </>
              )}
            </div>
            <div className="step-heading operation-heading">
              <span>02</span>
              <div>
                <h2>CHOOSE AN OPERATION</h2>
                <p>What should we do with it?</p>
              </div>
            </div>
            <div className="operation-grid">
              {operations.map((item) => (
                <button
                  key={item.id}
                  className={`operation ${operation === item.id ? 'selected' : ''}`}
                  onClick={() => {
                    setOperation(item.id)
                    setResult(null)
                    setError('')
                  }}
                >
                  <span className="operation-icon">{item.icon}</span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </span>
                  <i>{operation === item.id ? '✓' : ''}</i>
                </button>
              ))}
            </div>
            {error && <div className="error-message">{error}</div>}
            {result ? (
              <div className="result-row">
                <div>
                  <span className="success-dot" />
                  <p>
                    <strong>READY TO DOWNLOAD</strong>
                    <small>
                      {result.name} · {formatSize(result.size)}
                    </small>
                  </p>
                </div>
                <a href={result.url} download={result.name}>
                  DOWNLOAD <ArrowIcon />
                </a>
                <button onClick={reset}>START OVER</button>
              </div>
            ) : (
              <button className="process-button" onClick={processFile} disabled={processing}>
                <span>
                  {processing
                    ? 'PROCESSING LOCALLY…'
                    : file
                      ? 'PROCESS FILE'
                      : 'CHOOSE A FILE TO START'}
                </span>
                {!processing && <ArrowIcon />}
              </button>
            )}
            <p className="local-note">
              <ShieldIcon size={15} /> Processing happens locally. Your file never leaves this
              device.
            </p>
            {user && (
              <p className="account-note">
                Signed in on the {user.plan.toUpperCase()} plan · only operation and file size are
                recorded
              </p>
            )}
          </div>
        </section>
        <section className="how-section" id="how-it-works">
          <div className="section-label">HOW IT WORKS</div>
          <h2>
            NO CLOUD. NO WAITING.
            <br />
            <em>NO COMPROMISE.</em>
          </h2>
          <div className="feature-grid">
            <article>
              <span>01</span>
              <h3>DROP</h3>
              <p>Select a file from your device. It stays right where it is.</p>
            </article>
            <article>
              <span>02</span>
              <h3>PROCESS</h3>
              <p>Your browser does the work instantly using local device power.</p>
            </article>
            <article>
              <span>03</span>
              <h3>DOWNLOAD</h3>
              <p>Save the finished result directly. No server round trip required.</p>
            </article>
          </div>
        </section>
        <section className="privacy-banner" id="privacy">
          <ShieldIcon size={34} />
          <div>
            <span>THE PRIVACY PROMISE</span>
            <h2>
              WE CAN’T SEE YOUR FILES.
              <br />
              AND THAT’S THE POINT.
            </h2>
          </div>
          <p>
            LocalConvert runs in your browser. No uploads, no storage, no tracking the contents of
            your files. Close the tab and it’s gone.
          </p>
        </section>
        <section className="pricing-section" id="pricing">
          <div className="pricing-copy">
            <div className="section-label">SIMPLE PRICING</div>
            <h2>
              START FREE.
              <br />
              <em>GO FURTHER.</em>
            </h2>
            <p>Use the essentials for free. Upgrade when your workflow gets serious.</p>
          </div>
          <div className="price-card free">
            <span>FREE</span>
            <strong>$0</strong>
            <small>FOREVER</small>
            <ul>
              <li>
                <CheckIcon /> Files up to 25 MB
              </li>
              <li>
                <CheckIcon /> One file at a time
              </li>
              <li>
                <CheckIcon /> All core operations
              </li>
              <li>
                <CheckIcon /> Supported by ads
              </li>
            </ul>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              USE FOR FREE
            </button>
          </div>
          <div className="price-card pro">
            <div className="popular">MOST POPULAR</div>
            <span>PRO</span>
            <strong>
              $6<sup>/MO</sup>
            </strong>
            <small>CANCEL ANYTIME</small>
            <ul>
              <li>
                <CheckIcon /> Files up to 2 GB
              </li>
              <li>
                <CheckIcon /> Batch processing
              </li>
              <li>
                <CheckIcon /> No ads, ever
              </li>
              <li>
                <CheckIcon /> Priority new tools
              </li>
            </ul>
            <button onClick={requestUpgrade}>
              {user?.plan === 'pro' ? 'CURRENT PLAN' : 'REQUEST PRO ACCESS'} <ArrowIcon />
            </button>
            {upgradeMessage && <p className="upgrade-message">{upgradeMessage}</p>}
          </div>
        </section>
      </main>
      <footer>
        <a className="brand" href="#">
          <span className="brand-mark">LC</span>
          <span>LocalConvert</span>
        </a>
        <p>PRIVATE FILE TOOLS, BUILT FOR THE WEB.</p>
        <span>© 2025 LocalConvert</span>
      </footer>
    </div>
  )
}
