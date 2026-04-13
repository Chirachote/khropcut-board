'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('ACCESS DENIED: ' + error.message.toUpperCase())
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at center, #0a1428 0%, #050810 100%)' }}
    >
      {/* Grid bg */}
      <div
        className="fixed inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(#2d3a6b 1px, transparent 1px), linear-gradient(90deg, #2d3a6b 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🎬</div>
          <h1 style={{ fontSize: '14px', color: '#00ff41', letterSpacing: '0.15em', marginBottom: '6px' }}
              className="glow">
            KHROPCUT
          </h1>
          <div style={{ fontSize: '8px', color: '#6b7db3', letterSpacing: '0.2em' }}>
            PRODUCTION BOARD v1.0
          </div>
        </div>

        {/* Login box */}
        <div
          className="pixel-border"
          style={{ background: '#0d1225', padding: '32px' }}
        >
          <div style={{ fontSize: '8px', color: '#6b7db3', letterSpacing: '0.15em', marginBottom: '24px' }}>
            {'> ENTER CREDENTIALS'}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label style={{ fontSize: '7px', color: '#6b7db3', letterSpacing: '0.1em', display: 'block', marginBottom: '6px' }}>
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="pixel-input"
                placeholder="user@khropcut.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label style={{ fontSize: '7px', color: '#6b7db3', letterSpacing: '0.1em', display: 'block', marginBottom: '6px' }}>
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pixel-input"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={{ fontSize: '7px', color: '#ff2d55', border: '1px solid #ff2d55', padding: '8px 10px', background: 'rgba(255,45,85,0.08)' }}>
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="pixel-btn pixel-btn-green"
              style={{ width: '100%', justifyContent: 'center', marginTop: '4px', fontSize: '9px', padding: '14px' }}
            >
              {loading ? '[ LOADING... ]' : '[ LOGIN ]'}
            </button>
          </form>

          {/* Decorative footer */}
          <div style={{ marginTop: '24px', fontSize: '6px', color: '#2d3a6b', textAlign: 'center', letterSpacing: '0.1em' }}>
            ████████████████████████████
          </div>
        </div>

        <div style={{ fontSize: '7px', color: '#2d3a6b', textAlign: 'center', marginTop: '16px', letterSpacing: '0.1em' }}>
          KHROPCUT STUDIO © 2026
        </div>
      </div>
    </div>
  )
}
