import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'
import LiveClock from '@/components/LiveClock'
import PixelCharacter from '@/components/PixelCharacter'
import Link from 'next/link'
import { STATUS_COLORS, WORKFLOW_STAGES, techColorMap, type Job, type TechnicianRecord } from '@/lib/types'

const DAYS_SHORT = ['SUN','MON','TUE','WED','THU','FRI','SAT']
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ data: jobs }, { data: techsData }] = await Promise.all([
    supabase.from('jobs').select('*').neq('status', 'cancelled').order('deadline', { ascending: true, nullsFirst: false }),
    supabase.from('technicians').select('*').order('sort_order'),
  ])

  const techs: TechnicianRecord[] = techsData || []
  const allJobs: Job[] = jobs || []
  const colorMap = techColorMap(techs)

  const now = new Date()
  now.setHours(0,0,0,0)
  const year     = now.getFullYear()
  const month    = now.getMonth()
  const todayStr = now.toISOString().slice(0, 10)
  const weekEnd  = new Date(now); weekEnd.setDate(now.getDate() + 7)

  const inProgress   = allJobs.filter(j => j.status === 'in-progress').length
  const pendingCount = allJobs.filter(j => j.status === 'pending' || j.status === 'queued').length
  const dueThisWeek  = allJobs.filter(j => j.deadline && new Date(j.deadline) >= now && new Date(j.deadline) <= weekEnd && j.status !== 'done').length
  const teamActive   = techs.filter(t => allJobs.some(j => j.technician === t.name && j.status === 'in-progress')).length

  // ── Build calendar event map for current month ──
  type CalEvent = { job: Job; color: string; label: string }
  const eventsByDate: Record<string, CalEvent[]> = {}

  function addEvent(dateStr: string, job: Job, color: string, label: string) {
    const [y, m] = dateStr.split('-').map(Number)
    if (y !== year || m !== month + 1) return
    if (!eventsByDate[dateStr]) eventsByDate[dateStr] = []
    eventsByDate[dateStr].push({ job, color, label })
  }

  for (const job of allJobs.filter(j => j.status !== 'done')) {
    for (const stage of WORKFLOW_STAGES) {
      const val = job[stage.key as keyof Job] as string | null
      if (val) addEvent(val, job, stage.party === 'production' ? '#00aaff' : '#ff6b9d', stage.label)
    }
    if (job.deadline) addEvent(job.deadline, job, '#ff6b35', 'DEADLINE')
  }

  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // ── Upcoming: next 6 jobs by deadline ──
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
          marginBottom: '28px', paddingBottom: '18px',
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
            { label: 'IN PROGRESS',   value: inProgress,   color: '#00aaff', icon: '▶' },
            { label: 'QUEUE',         value: pendingCount, color: '#ffd700', icon: '◌' },
            { label: 'DUE THIS WEEK', value: dueThisWeek,  color: '#ff6b35', icon: '⏱' },
            { label: 'TEAM ACTIVE',   value: teamActive,   color: '#00ff41', icon: '◉' },
          ].map(m => (
            <div key={m.label} style={{
              background: '#0a1022',
              border: `1px solid ${m.color}30`,
              padding: '16px 18px',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: m.color, opacity: 0.5 }} />
              <div style={{ fontSize: '28px', color: m.color, lineHeight: 1.2 }}>{m.value}</div>
              <div style={{ fontSize: '6px', color: '#3a4a6b', letterSpacing: '0.15em', marginTop: '6px' }}>
                {m.icon} {m.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Calendar + Upcoming ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

          {/* Mini Calendar */}
          <div style={{ background: '#0a1022', border: '1px solid rgba(0,170,255,0.2)' }}>
            <div style={{
              padding: '12px 16px', borderBottom: '1px solid rgba(0,170,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontSize: '7px', color: '#00aaff', letterSpacing: '0.15em',
            }}>
              <span>◫ {MONTHS[month]} {year}</span>
              <Link href="/calendar" style={{ fontSize: '6px', color: '#3a4a6b', textDecoration: 'none' }}>
                FULL CALENDAR →
              </Link>
            </div>
            <div style={{ padding: '10px 12px' }}>
              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: '4px' }}>
                {DAYS_SHORT.map(d => (
                  <div key={d} style={{ fontSize: '5px', color: '#3a4a6b', textAlign: 'center', padding: '2px 0', letterSpacing: '0.05em' }}>{d}</div>
                ))}
              </div>
              {/* Date grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px' }}>
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const ds  = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                  const evs = eventsByDate[ds] || []
                  const isToday = ds === todayStr
                  const isPast  = ds < todayStr

                  return (
                    <Link key={day} href={`/calendar`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        padding: '3px 2px', textAlign: 'center',
                        background: isToday ? 'rgba(0,255,65,0.12)' : evs.length > 0 ? 'rgba(0,170,255,0.05)' : 'transparent',
                        border: isToday ? '1px solid rgba(0,255,65,0.4)' : '1px solid transparent',
                        cursor: evs.length > 0 ? 'pointer' : 'default',
                      }}>
                        <div style={{
                          fontSize: '7px',
                          color: isToday ? '#00ff41' : isPast ? '#2a3456' : evs.length > 0 ? '#e0e8ff' : '#4a5a7b',
                          fontWeight: isToday ? 'bold' : 'normal',
                          marginBottom: '2px',
                        }}>{day}</div>
                        {/* Event dots */}
                        {evs.length > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '1px', flexWrap: 'wrap' }}>
                            {evs.slice(0,3).map((ev, idx) => (
                              <div key={idx} style={{ width: '3px', height: '3px', background: ev.color, borderRadius: '50%' }} />
                            ))}
                            {evs.length > 3 && <div style={{ width: '3px', height: '3px', background: '#3a4a6b', borderRadius: '50%' }} />}
                          </div>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(0,170,255,0.08)' }}>
                {[
                  { color: '#00aaff', label: 'POST PRO' },
                  { color: '#ff6b9d', label: 'CLIENT' },
                  { color: '#ff6b35', label: 'DEADLINE' },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '5px', height: '5px', background: l.color, borderRadius: '50%' }} />
                    <span style={{ fontSize: '5px', color: '#3a4a6b' }}>{l.label}</span>
                  </div>
                ))}
              </div>
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
                <div style={{ fontSize: '7px', color: '#3a4a6b', textAlign: 'center', paddingTop: '32px' }}>— NO UPCOMING DEADLINES —</div>
              ) : upcoming.map(job => {
                const sc = STATUS_COLORS[job.status]
                const tc = colorMap[job.technician] || '#6b7db3'
                const isOverdue = new Date(job.deadline!) < now
                return (
                  <Link key={job.id} href={`/jobs/${job.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: '#070d1a', border: `1px solid rgba(0,170,255,0.08)`,
                      padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
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

        {/* ── Team Status (with pixel art characters) ── */}
        <div style={{ background: '#0a1022', border: '1px solid rgba(0,170,255,0.2)' }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid rgba(0,170,255,0.12)',
            fontSize: '7px', color: '#00aaff', letterSpacing: '0.15em',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span>◉ TEAM STATUS</span>
            <Link href="/team" style={{ fontSize: '6px', color: '#3a4a6b', textDecoration: 'none' }}>TEAM ROOM →</Link>
          </div>

          <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
            {techs.length === 0 ? (
              <div style={{ fontSize: '7px', color: '#3a4a6b', gridColumn: '1/-1', textAlign: 'center', padding: '24px' }}>
                No team members yet — <Link href="/settings" style={{ color: '#00aaff' }}>add in Settings</Link>
              </div>
            ) : techs.map((tech, idx) => {
              const techJobs  = allJobs.filter(j => j.technician === tech.name && j.status !== 'done')
              const activeJob = techJobs.find(j => j.status === 'in-progress')
              const isActive  = !!activeJob
              const draft     = activeJob?.current_draft || 1
              const draftColors = ['#00aaff', '#b06bff', '#ff6b35']
              const dc        = draftColors[(draft - 1) % 3]

              return (
                <div key={tech.id} style={{
                  background: '#070d1a',
                  border: `1px solid ${tech.color}30`,
                  padding: '14px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: '8px',
                  position: 'relative',
                }}>
                  {/* Status dot */}
                  <div style={{
                    position: 'absolute', top: '10px', right: '10px',
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: isActive ? '#00ff41' : techJobs.length > 0 ? '#ffd700' : '#3a4a6b',
                    boxShadow: isActive ? '0 0 6px #00ff41' : 'none',
                  }} />

                  {/* Pixel art character */}
                  <div style={{
                    padding: '4px',
                    background: `${tech.color}15`,
                    border: `1px solid ${tech.color}30`,
                    imageRendering: 'pixelated',
                  }}>
                    <PixelCharacter index={idx} color={tech.color} size={3} />
                  </div>

                  {/* Name */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '8px', color: tech.color, letterSpacing: '0.08em' }}>{tech.name}</div>
                    <div style={{ fontSize: '5px', color: '#3a4a6b', marginTop: '2px' }}>
                      {techJobs.length} JOB{techJobs.length !== 1 ? 'S' : ''}
                    </div>
                  </div>

                  {/* Current job */}
                  {activeJob ? (
                    <Link href={`/jobs/${activeJob.id}`} style={{ textDecoration: 'none', width: '100%' }}>
                      <div style={{
                        background: '#0a1022', padding: '6px 8px',
                        borderLeft: `2px solid ${dc}`, width: '100%',
                      }}>
                        <div style={{ fontSize: '6px', color: '#e0e8ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {activeJob.title}
                        </div>
                        <div style={{ fontSize: '5px', color: dc, marginTop: '2px' }}>D{draft} · IN PROGRESS</div>
                      </div>
                    </Link>
                  ) : techJobs.length > 0 ? (
                    <div style={{ background: '#0a1022', padding: '6px 8px', borderLeft: '2px solid #ffd700', width: '100%' }}>
                      <div style={{ fontSize: '5px', color: '#ffd700' }}>{techJobs.length} IN QUEUE</div>
                    </div>
                  ) : (
                    <div style={{ background: '#0a1022', padding: '6px 8px', width: '100%' }}>
                      <div style={{ fontSize: '5px', color: '#3a4a6b', textAlign: 'center' }}>— AVAILABLE —</div>
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
