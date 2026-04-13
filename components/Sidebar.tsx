'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

const NAV = [
  { href: '/dashboard', icon: '⬡', label: 'COMMAND CENTER',    exact: true  },
  { href: '/jobs',      icon: '▦', label: 'PRODUCTION BOARD',  exact: false },
  { href: '/team',      icon: '◉', label: 'TEAM ROOM',         exact: true  },
  { href: '/deals',     icon: '◇', label: 'DEAL ROOM',         exact: true  },
  { href: '/inbox',     icon: '◎', label: 'INBOX',             exact: true  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router  = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  async function logout() {
    setLoggingOut(true)
    await createClient().auth.signOut()
    router.push('/')
  }

  function isActive(item: typeof NAV[0]) {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href)
  }

  return (
    <aside style={{
      width: '220px', minWidth: '220px',
      height: '100vh', position: 'sticky', top: 0,
      background: '#080c17',
      borderRight: '1px solid rgba(0,170,255,0.15)',
      display: 'flex', flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* ── Logo ── */}
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(0,170,255,0.12)' }}>
        <div style={{ fontSize: '11px', color: '#00ff41', letterSpacing: '0.1em', marginBottom: '4px' }}>
          🎬 KHROPCUT
        </div>
        <div style={{ fontSize: '6px', color: '#3a4a6b', letterSpacing: '0.25em' }}>
          STUDIO COMMAND
        </div>
      </div>

      {/* ── New Job button ── */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(0,170,255,0.08)' }}>
        <Link
          href="/jobs/new"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '9px', fontSize: '7px',
            background: 'rgba(0,255,65,0.08)', color: '#00ff41',
            border: '1px solid rgba(0,255,65,0.4)',
            textDecoration: 'none', letterSpacing: '0.1em',
            transition: 'background 0.1s',
          }}
        >
          + NEW JOB
        </Link>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: '8px 0' }}>
        {NAV.map(item => {
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '11px 16px',
                fontSize: '7px',
                color: active ? '#00aaff' : '#4a5a7b',
                textDecoration: 'none',
                background: active ? 'rgba(0,170,255,0.07)' : 'transparent',
                borderLeft: active ? '3px solid #00aaff' : '3px solid transparent',
                letterSpacing: '0.1em',
                transition: 'all 0.1s',
              }}
            >
              <span style={{ fontSize: '13px', width: '18px', textAlign: 'center', opacity: active ? 1 : 0.6 }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* ── Bottom ── */}
      <div style={{ borderTop: '1px solid rgba(0,170,255,0.12)' }}>
        <Link
          href="/settings"
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '11px 16px', fontSize: '7px',
            color: pathname === '/settings' ? '#ffd700' : '#4a5a7b',
            textDecoration: 'none',
            borderLeft: pathname === '/settings' ? '3px solid #ffd700' : '3px solid transparent',
            letterSpacing: '0.1em',
          }}
        >
          <span style={{ fontSize: '13px', width: '18px', textAlign: 'center' }}>⚙</span>
          SETTINGS
        </Link>
        <button
          onClick={logout}
          disabled={loggingOut}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '11px 16px', fontSize: '7px',
            color: '#4a5a7b', background: 'transparent', border: 'none',
            cursor: 'pointer', width: '100%',
            letterSpacing: '0.1em', borderLeft: '3px solid transparent',
            marginBottom: '4px',
          }}
        >
          <span style={{ fontSize: '13px', width: '18px', textAlign: 'center' }}>⏻</span>
          {loggingOut ? '...' : 'LOGOUT'}
        </button>
      </div>
    </aside>
  )
}
