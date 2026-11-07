import { useState } from 'react'

const USERS_KEY = 'showbook_demo_users'
const SESSION_KEY = 'showbook_demo_session'

function readUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]') }
  catch { return [] }
}

export default function Auth({ onSuccess }) {
  const [mode, setMode] = useState('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const switchMode = next => {
    setMode(next); setError(''); setPassword(''); setConfirmPassword('')
  }

  async function hashPassword(value) {
    // Demo-only client-side hash. Real authentication must be handled by a backend.
    const bytes = new TextEncoder().encode(value)
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !password) { setError('Please enter your email and password.'); return }
    if (mode === 'signup' && !name.trim()) { setError('Please enter your name.'); return }
    if (mode === 'signup' && password.length < 6) { setError('Use at least 6 characters for your password.'); return }
    if (mode === 'signup' && password !== confirmPassword) { setError('Passwords do not match.'); return }

    setBusy(true)
    try {
      const users = readUsers()
      const existing = users.find(user => user.email === cleanEmail)
      const passwordHash = await hashPassword(password)

      if (mode === 'signup') {
        if (existing) { setError('An account with this email already exists. Please sign in.'); return }
        const user = { name: name.trim(), email: cleanEmail, passwordHash }
        localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]))
        localStorage.setItem(SESSION_KEY, JSON.stringify({ name: user.name, email: user.email }))
        onSuccess({ name: user.name, email: user.email })
      } else {
        if (!existing || existing.passwordHash !== passwordHash) {
          setError('Incorrect email or password. If you are new, create an account first.')
          return
        }
        const session = { name: existing.name, email: existing.email }
        localStorage.setItem(SESSION_KEY, JSON.stringify(session))
        onSuccess(session)
      }
    } catch {
      setError('This browser could not save your account. Please try another browser or enable site storage.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid md:grid-cols-2 overflow-hidden rounded-3xl border border-white/10 bg-[#181820] shadow-2xl">
        <div className="relative hidden md:flex flex-col justify-between p-10 overflow-hidden bg-gradient-to-br from-red-950 via-[#24121b] to-[#181820]">
          <div className="absolute -right-16 -top-12 h-72 w-72 rounded-full bg-red-600/20 blur-3xl" />
          <div className="relative">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-400">Your next story starts here</p>
            <h1 className="mt-5 text-5xl font-black leading-tight">Big screen.<br />Big moments.</h1>
            <p className="mt-5 max-w-sm text-gray-300 leading-7">Discover movies, find your showtime, and pick the perfect seat for your next outing.</p>
          </div>
          <div className="relative rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-lg font-semibold">Lights down. World off.</p>
            <p className="mt-1 text-sm text-gray-400">Your movie night begins with ShowBook.</p>
          </div>
        </div>

        <div className="p-6 sm:p-10 md:p-12">
          <div className="mb-8 md:hidden">
            <p className="text-sm font-bold uppercase tracking-widest text-red-400">ShowBook</p>
            <h1 className="mt-2 text-3xl font-extrabold">Your next movie night awaits.</h1>
          </div>
          <div className="flex rounded-xl bg-[#101015] p-1 mb-8">
            <button type="button" onClick={() => switchMode('signin')} className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${mode === 'signin' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>Sign in</button>
            <button type="button" onClick={() => switchMode('signup')} className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${mode === 'signup' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>Create account</button>
          </div>

          <h2 className="text-2xl font-bold">{mode === 'signin' ? 'Welcome back' : 'Join ShowBook'}</h2>
          <p className="mt-2 mb-7 text-sm text-gray-400">{mode === 'signin' ? 'Sign in to continue to movies and events.' : 'Create an account to start exploring.'}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <label className="block text-sm font-medium text-gray-300">Full name
                <input value={name} onChange={e => setName(e.target.value)} autoComplete="name" placeholder="Your name" className="mt-2 w-full rounded-xl border border-white/10 bg-[#101015] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-red-500" />
              </label>
            )}
            <label className="block text-sm font-medium text-gray-300">Email address
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" className="mt-2 w-full rounded-xl border border-white/10 bg-[#101015] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-red-500" />
            </label>
            <label className="block text-sm font-medium text-gray-300">Password
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'} className="mt-2 w-full rounded-xl border border-white/10 bg-[#101015] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-red-500" />
            </label>
            {mode === 'signup' && (
              <label className="block text-sm font-medium text-gray-300">Confirm password
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" placeholder="Enter your password again" className="mt-2 w-full rounded-xl border border-white/10 bg-[#101015] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-red-500" />
              </label>
            )}
            {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
            <button disabled={busy} className="w-full rounded-xl bg-red-600 py-3 font-bold transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60" type="submit">
              {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-400">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button type="button" onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')} className="font-semibold text-red-400 hover:text-red-300">{mode === 'signin' ? 'Sign up' : 'Sign in'}</button>
          </p>
          <p className="mt-6 text-xs leading-5 text-gray-500">Demo authentication only: accounts are saved in this browser. Do not use a real or reused password. A production app needs server-side authentication.</p>
        </div>
      </div>
    </div>
  )
}
