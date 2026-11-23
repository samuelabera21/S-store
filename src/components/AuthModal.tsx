'use client'

import React, { useState } from 'react'
import { X, Loader2, AlertCircle } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  initialMode?: 'login' | 'signup'
  onClose: () => void
  onAuthSuccess?: () => void
  onSwitchUser?: (username: string) => void
}

export default function AuthModal({
  isOpen,
  initialMode = 'login',
  onClose,
  onAuthSuccess,
  onSwitchUser,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setLoading(true)

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      onAuthSuccess?.()
      onSwitchUser?.(data.user.username)
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/analytics')) {
        window.location.reload()
      }
      onClose()
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setLoading(true)

    try {
      const res = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Signup failed')
      }

      onAuthSuccess?.()
      onSwitchUser?.(data.user.username)
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/analytics')) {
        window.location.reload()
      }
      onClose()
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoSwitch = async (uname: string) => {
    try {
      await fetch('/api/v1/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: uname }),
      })
      onSwitchUser?.(uname)
      onAuthSuccess?.()
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/analytics')) {
        window.location.reload()
      }
    } catch (e) {
      console.error(e)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-[460px] bg-white rounded-3xl p-8 shadow-2xl text-center max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* S-Store Red Mark */}
        <div className="w-11 h-11 bg-pinterest-red rounded-full flex items-center justify-center mx-auto mb-3 text-white font-black text-2xl shadow-md select-none">
          S
        </div>

        <h2 className="text-2xl font-bold text-zinc-900 mb-1">
          {mode === 'login' ? 'Welcome to S-Store' : 'Sign up to find ideas'}
        </h2>
        <p className="text-xs text-zinc-500 mb-5">
          {mode === 'login'
            ? 'Find new ideas to try and save your favorite inspiration'
            : 'Explore recipes, home inspiration, style ideas and more'}
        </p>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-red-600 text-xs font-semibold text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Mode Selector Tablist */}
        <div className="flex bg-zinc-100 rounded-full p-1 mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setErrorMessage(null)
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
              mode === 'login' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup')
              setErrorMessage(null)
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition-all ${
              mode === 'signup' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Sign up
          </button>
        </div>

        {/* Login Form */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-left">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Email or username
              </label>
              <input
                type="text"
                required
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="Email or username"
                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:outline-none focus:border-zinc-400 bg-zinc-50 focus:bg-white text-sm transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:outline-none focus:border-zinc-400 bg-zinc-50 focus:bg-white text-sm transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-pinterest-red hover:bg-pinterest-redHover disabled:opacity-50 text-white font-bold text-sm rounded-full transition-colors shadow-sm flex items-center justify-center gap-2 mt-4"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Log in</span>
            </button>
          </form>
        ) : (
          /* Signup Form */
          <form onSubmit={handleSignupSubmit} className="space-y-3.5 text-left">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:outline-none focus:border-zinc-400 bg-zinc-50 focus:bg-white text-sm transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="Choose a username"
                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:outline-none focus:border-zinc-400 bg-zinc-50 focus:bg-white text-sm transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Password (at least 6 characters)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:outline-none focus:border-zinc-400 bg-zinc-50 focus:bg-white text-sm transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-pinterest-red hover:bg-pinterest-redHover disabled:opacity-50 text-white font-bold text-sm rounded-full transition-colors shadow-sm flex items-center justify-center gap-2 mt-4"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Continue</span>
            </button>
          </form>
        )}

        {/* 1-Click Fast Dev Shortcuts */}
        <div className="mt-6 pt-5 border-t border-zinc-100">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">
            1-Click Test Accounts
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleDemoSwitch('alice_designer')}
              className="flex-1 py-2 px-3 bg-zinc-100 hover:bg-zinc-200 text-xs font-bold text-zinc-800 rounded-full transition-colors truncate"
            >
              @alice_designer
            </button>
            <button
              type="button"
              onClick={() => handleDemoSwitch('bob_builder')}
              className="flex-1 py-2 px-3 bg-zinc-100 hover:bg-zinc-200 text-xs font-bold text-zinc-800 rounded-full transition-colors truncate"
            >
              @bob_builder
            </button>
          </div>
          <p className="text-[10px] text-zinc-400 mt-2">
            Password for test accounts: <span className="font-semibold text-zinc-600">password123</span>
          </p>
        </div>
      </div>
    </div>
  )
}
