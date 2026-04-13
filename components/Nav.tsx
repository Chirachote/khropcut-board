'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav
      className="flex items-center justify-between px-4 py-3"
      style={{ borderBottom: '2px solid #2d3a6b', background: '#080e1c' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <span style={{ fontSize: '14px', color: '#00ff41' }}>🎬</span>
        <div>
          <div style={{ fontSize: '9px', color: '#00ff41', letterSpacing: '0.1em' }}>
            KHROPCUT
          </div>
          <div style={{ fontSize: '6px', color: '#6b7db3', letterSpacing: '0.15em' }}>
            PRODUCTION BOARD
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="flex items-center gap-1">
        <Link
          href="/dashboard"
          className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}
        >
          <span>🗺️</span> MAP
        </Link>
        <Link
          href="/jobs"
          className={`nav-link ${pathname.startsWith('/jobs') ? 'active' : ''}`}
        >
          <span>📋</span> JOBS
        </Link>
        <Link
          href="/calendar"
          className={`nav-link ${pathname === '/calendar' ? 'active' : ''}`}
        >
          <span>📅</span> CALENDAR
        </Link>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link href="/jobs/new" className="pixel-btn pixel-btn-green" style={{ fontSize: '7px', padding: '7px 12px' }}>
          + NEW JOB
        </Link>
        <button
          onClick={handleLogout}
          disabled={loading}
          className="pixel-btn pixel-btn-gray"
          style={{ fontSize: '7px', padding: '7px 12px' }}
        >
          {loading ? '...' : 'LOGOUT'}
        </button>
      </div>
    </nav>
  )
}
