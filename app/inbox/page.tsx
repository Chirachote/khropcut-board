import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'
import Link from 'next/link'
import { STATUS_COLORS, techColorMap, type Job, type TechnicianRecord } from '@/lib/types'

export default async function InboxPage() {
  const supabase = await createClient()

  const [{ data: jobs }, { data: techsData }] = await Promise.all([
    supabase.from('jobs').select('*').neq('status', 'cancelled').order('deadline', { ascending: true, nullsFirst: false }),
    supabase.from('technicians').select('*').order('sort_order'),
  ])

  const techs: TechnicianRecord[] = techsData || []
  const allJobs: Job[] = jobs || []
  const colorMap = techColorMap(techs)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Build alerts
  type Alert = { id: string; type: 'overdue' | 'due-today' | 'due-soon' | 'review'; job: Job; label: string }
  const alerts: Alert[] = []

  for (const job of allJobs) {
    if (job.status === 'done') continue

    if (job.deadline) {
      const dl = new Date(job.deadline); dl.setHours(0,0,0,0)
      const diff = Math.floor((dl.getTime() - today.getTime()) / 86400000)
      if (diff < 0) alerts.push({ id: `od-${job.id}`, type: 'overdue', job, label: `OVERDUE BY ${Math.abs(diff)} DAY${Math.abs(diff) !== 1 ? 'S' : ''}` })
      else if (diff === 0) alerts.push({ id: `dt-${job.id}`, type: 'due-today', job, label: 'DUE TODAY' })
      else if (diff <= 3) alerts.push({ id: `ds-${job.id}`, type: 'due-soon', job, label: `DUE IN ${diff} DAY${diff !== 1 ? 'S' : ''}` })
    }

    if (job.status === 'review') {
      alerts.push({ id: `rv-${job.id}`, type: 'review', job, label: 'AWAITING REVIEW' })
    }
  }

  const alertConfig = {
    overdue:   { color: '#ff2d55', icon: '⚠', bg: 'rgba(255,45,85,0.08)',  border: 'rgba(255,45,85,0.3)'  },
    'due-today': { color: '#ff6b35', icon: '⏱', bg: 'rgba(255,107,53,0.08)', border: 'rgba(255,107,53,0.3)' },
    'due-soon':  { color: '#ffd700', icon: '◌', bg: 'rgba(255,215,0,0.06)',  border: 'rgba(255,215,0,0.25)' },
    review:    { color: '#b06bff', icon: '◎', bg: 'rgba(176,107,255,0.08)', border: 'rgba(176,107,255,0.3)' },
  }

  return (
    <AppShell>
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '24px', paddingBottom: '18px', borderBottom: '1px solid rgba(0,170,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#00aaff', letterSpacing: '0.1em', marginBottom: '4px' }}>
              ◎ INBOX
            </div>
            <div style={{ fontSize: '6px', color: '#3a4a6b', letterSpacing: '0.2em' }}>
              ALERTS · REMINDERS · NOTIFICATIONS
            </div>
          </div>
          {alerts.length > 0 && (
            <div style={{ fontSize: '8px', color: '#ff2d55', border: '1px solid rgba(255,45,85,0.4)', padding: '6px 12px', background: 'rgba(255,45,85,0.08)' }}>
              {alerts.length} ALERT{alerts.length !== 1 ? 'S' : ''}
            </div>
          )}
        </div>

        {alerts.length === 0 ? (
          <div style={{
            background: '#0a1022',
            border: '1px solid rgba(0,255,65,0.2)',
            padding: '60px 24px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>✓</div>
            <div style={{ fontSize: '9px', color: '#00ff41', letterSpacing: '0.15em', marginBottom: '8px' }}>
              ALL CLEAR
            </div>
            <div style={{ fontSize: '7px', color: '#3a4a6b' }}>
              No overdue jobs, no pending reviews. Good work!
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alerts.map(alert => {
              const cfg = alertConfig[alert.type]
              const sc = STATUS_COLORS[alert.job.status]
              const tc = colorMap[alert.job.technician] || '#6b7db3'
              const draft = alert.job.current_draft || 1

              return (
                <Link key={alert.id} href={`/jobs/${alert.job.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: cfg.bg,
                    border: `1px solid ${cfg.border}`,
                    padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: '16px',
                  }}>
                    <div style={{ fontSize: '16px', color: cfg.color, flexShrink: 0 }}>{cfg.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '6px', color: cfg.color, border: `1px solid ${cfg.border}`, padding: '2px 6px', letterSpacing: '0.1em' }}>
                          {alert.label}
                        </span>
                        <span className="status-badge" style={{ color: sc.color, borderColor: sc.border, background: sc.bg, fontSize: '6px' }}>
                          {alert.job.status.replace('-', ' ')}
                        </span>
                        <span style={{ fontSize: '6px', color: '#3a4a6b', border: '1px solid rgba(0,170,255,0.15)', padding: '2px 5px' }}>D{draft}</span>
                      </div>
                      <div style={{ fontSize: '9px', color: '#e0e8ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {alert.job.title}
                      </div>
                      <div style={{ fontSize: '6px', color: tc, marginTop: '2px' }}>
                        {alert.job.technician} · {alert.job.client}
                        {alert.job.deadline && ` · deadline ${formatDate(alert.job.deadline)}`}
                      </div>
                    </div>
                    <div style={{ fontSize: '9px', color: '#3a4a6b', flexShrink: 0 }}>→</div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}

function formatDate(str: string) {
  const d = new Date(str)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}
