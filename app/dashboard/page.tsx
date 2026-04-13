import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'
import LiveClock from '@/components/LiveClock'
import Link from 'next/link'
import { STATUS_COLORS, techColorMap, type Job, type TechnicianRecord } from '@/lib/types'

export default async function DashboardPage() {
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
  const todayStr = today.toISOString().slice(0, 10)
  const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7)

  const inProgress  = allJobs.filter(j => j.status === 'in-progress').length
  const pendingCount = allJobs.filter(j => j.status === 'pending').length
  const dueThisWeek = allJobs.filter(j => j.deadline && new Date(j.deadline) >= today && new Date(j.deadline) <= weekEnd && j.status !== 'done').length
  const teamActive  = techs.filter(t => allJobs.some(j => j.technician === t.name && j.status === 'in-progress')).length

  // Today's jobs: jobs where any draft date == today
  const todaysJobs = allJobs.filter(j => {
    const d = j.current_draft || 1
    const prefix = `d${d}`
    return (
      j[`${prefix}_work` as keyof Job] === todayStr ||
      j[`${prefix}_send` as keyof Job] === todayStr ||
      j[`${prefix}_review` as keyof Job] === todayStr ||
      j.deadline === todayStr
    )
  })

  // Upcoming: next 6 jobs by deadline
  const upcoming = allJobs
    .filter(j => j.deadline && j.status !== 'done')
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 6)

  return (
    <AppShell>
      <div style={{ padding: '24px', maxWidth: '1200px' }}>

        {/* ── Top bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '28px',
          paddingBottom: '18px',
          borderBottom: '1px solid rgba(0,170,255,0.15)',
        }}>
          <div>
            <div style={{ fontSize: '13px', color: '#00aaff', letterSpacing: '0.1em', marginBottom: '4px' }}>
              ⬡ COMMAND CENTER
            </div>
            <div style={{ fontSize: '6px', color: '#3a4a6b', letterSpacing: '0.2em' }}>
              KHROPCUT STUDIO · REAL-TIME OVERVIEW
            </div>
          </div>
          <LiveClock />
        </div>

        {/* ── Metric cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' }}>
          {[
            { label: 'IN PROGRESS',  value: inProgress,   color: '#00aaff', icon: '▶' },
            { label: 'QUEUE',        value: pendingCount,  color: '#ffd700', icon: '◌' },
            { label: 'DUE THIS WEEK',value: dueThisWeek,  color: '#ff6b35', icon: '⏱' },
            { label: 'TEAM ACTIVE',  value: teamActive,   color: '#00ff41', icon: '◉' },
          ].map(m => (
            <div key={m.label} style={{
              background: '#0a1022',
              border: `1px solid ${m.color}30`,
              padding: '16px 18px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                background: m.color, opacity: 0.5,
              }} />
              <div style={{ fontSize: '28px', color: m.color, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {m.value}
              </div>
              <div style={{ fontSize: '6px', color: '#3a4a6b', letterSpacing: '0.15em', marginTop: '6px' }}>
                {m.icon} {m.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Main content ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

          {/* Today's Jobs */}
          <div style={{ background: '#0a1022', border: '1px solid rgba(0,170,255,0.2)' }}>
            <div style={{
              padding: '12px 16px', borderBottom: '1px solid rgba(0,170,255,0.12)',
              fontSize: '7px', color: '#00aaff', letterSpacing: '0.15em',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>◈ TODAY&apos;S SCHEDULE</span>
              <span style={{ color: '#3a4a6b', fontSize: '6px' }}>{todaysJobs.length} ITEMS</span>
            </div>
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '160px' }}>
              {todaysJobs.length === 0 ? (
                <div style={{ fontSize: '7px', color: '#3a4a6b', textAlign: 'center', paddingTop: '32px' }}>
                  — NO SCHEDULED ITEMS TODAY —
                </div>
              ) : todaysJobs.map(job => {
                const sc = STATUS_COLORS[job.status]
                const tc = colorMap[job.technician] || '#6b7db3'
                const draft = job.current_draft || 1
                const draftColors = ['#00aaff', '#b06bff', '#ff6b35']
                const dc = draftColors[(draft - 1) % 3]
                return (
                  <Link key={job.id} href={`/jobs/${job.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: '#070d1a', border: `1px solid rgba(0,170,255,0.1)`,
                      borderLeft: `3px solid ${dc}`,
                      padding: '9px 12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: '8px',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '8px', color: '#e0e8ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {job.title}
                        </div>
                        <div style={{ fontSize: '6px', color: tc, marginTop: '2px' }}>{job.technician}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <span style={{ fontSize: '6px', color: dc, border: `1px solid ${dc}40`, padding: '2px 5px' }}>D{draft}</span>
                        <span className="status-badge" style={{ color: sc.color, borderColor: sc.border, background: sc.bg, fontSize: '6px' }}>
                          {job.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div style={{ background: '#0a1022', border: '1px solid rgba(0,170,255,0.2)' }}>
            <div style={{
              padding: '12px 16px', borderBottom: '1px solid rgba(0,170,255,0.12)',
              fontSize: '7px', color: '#00aaff', letterSpacing: '0.15em',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>⏱ UPCOMING DEADLINES</span>
              <Link href="/calendar" style={{ fontSize: '6px', color: '#3a4a6b', textDecoration: 'none' }}>VIEW CALENDAR →</Link>
            </div>
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '160px' }}>
              {upcoming.length === 0 ? (
                <div style={{ fontSize: '7px', color: '#3a4a6b', textAlign: 'center', paddingTop: '32px' }}>
                  — NO UPCOMING DEADLINES —
                </div>
              ) : upcoming.map(job => {
                const sc = STATUS_COLORS[job.status]
                const tc = colorMap[job.technician] || '#6b7db3'
                const isOverdue = new Date(job.deadline!) < today
                return (
                  <Link key={job.id} href={`/jobs/${job.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: '#070d1a',
                      border: `1px solid rgba(0,170,255,0.08)`,
                      padding: '8px 12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '7px', color: '#e0e8ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {job.title}
                        </div>
                        <div style={{ fontSize: '6px', color: tc }}>{job.technician} · {job.client}</div>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
                        <div style={{ fontSize: '8px', color: isOverdue ? '#ff2d55' : '#ffd700' }}>
                          {isOverdue && '⚠ '}{formatDate(job.deadline!)}
                        </div>
                        <div style={{ fontSize: '6px', color: sc.color }}>{job.status.replace('-',' ')}</div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Team Status ── */}
        <div style={{ background: '#0a1022', border: '1px solid rgba(0,170,255,0.2)' }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid rgba(0,170,255,0.12)',
            fontSize: '7px', color: '#00aaff', letterSpacing: '0.15em',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span>◉ TEAM STATUS</span>
            <Link href="/team" style={{ fontSize: '6px', color: '#3a4a6b', textDecoration: 'none' }}>TEAM ROOM →</Link>
          </div>
          <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {techs.length === 0 ? (
              <div style={{ fontSize: '7px', color: '#3a4a6b', gridColumn: '1/-1', textAlign: 'center', padding: '24px' }}>
                No team members yet —{' '}
                <Link href="/settings" style={{ color: '#00aaff' }}>add in Settings</Link>
              </div>
            ) : techs.map(tech => {
              const techJobs = allJobs.filter(j => j.technician === tech.name && j.status !== 'done')
              const activeJob = techJobs.find(j => j.status === 'in-progress')
              const isActive = !!activeJob
              const draft = activeJob?.current_draft || 1
              const draftColors = ['#00aaff', '#b06bff', '#ff6b35']
              const dc = draftColors[(draft - 1) % 3]

              return (
                <div key={tech.id} style={{
                  background: '#070d1a',
                  border: `1px solid ${tech.color}30`,
                  padding: '12px 14px',
                  position: 'relative',
                }}>
                  {/* status dot */}
                  <div style={{
                    position: 'absolute', top: '12px', right: '12px',
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: isActive ? '#00ff41' : techJobs.length > 0 ? '#ffd700' : '#3a4a6b',
                    boxShadow: isActive ? '0 0 6px #00ff41' : 'none',
                  }} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{tech.avatar}</span>
                    <div>
                      <div style={{ fontSize: '8px', color: tech.color }}>{tech.name}</div>
                      <div style={{ fontSize: '6px', color: '#3a4a6b' }}>
                        {techJobs.length} ACTIVE JOB{techJobs.length !== 1 ? 'S' : ''}
                      </div>
                    </div>
                  </div>

                  {activeJob ? (
                    <div style={{ background: '#0a1022', padding: '7px 9px', borderLeft: `2px solid ${dc}` }}>
                      <div style={{ fontSize: '7px', color: '#e0e8ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {activeJob.title}
                      </div>
                      <div style={{ fontSize: '6px', color: dc, marginTop: '2px' }}>D{draft} · {activeJob.status.replace('-',' ')}</div>
                    </div>
                  ) : techJobs.length > 0 ? (
                    <div style={{ background: '#0a1022', padding: '7px 9px', borderLeft: '2px solid #ffd700' }}>
                      <div style={{ fontSize: '7px', color: '#ffd700' }}>{techJobs.length} IN QUEUE</div>
                    </div>
                  ) : (
                    <div style={{ background: '#0a1022', padding: '7px 9px' }}>
                      <div style={{ fontSize: '7px', color: '#3a4a6b' }}>— AVAILABLE —</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </AppShell>
  )
}

function formatDate(str: string) {
  const d = new Date(str)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}
