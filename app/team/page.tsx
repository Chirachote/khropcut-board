import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'
import PixelCharacter from '@/components/PixelCharacter'
import Link from 'next/link'
import { STATUS_COLORS, type Job, type TechnicianRecord } from '@/lib/types'

export default async function TeamPage() {
  const supabase = await createClient()

  const [{ data: jobs }, { data: techsData }] = await Promise.all([
    supabase.from('jobs').select('*').neq('status', 'cancelled').order('created_at', { ascending: false }),
    supabase.from('technicians').select('*').order('sort_order'),
  ])

  const techs: TechnicianRecord[] = techsData || []
  const allJobs: Job[] = jobs || []

  return (
    <AppShell>
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '24px', paddingBottom: '18px', borderBottom: '1px solid rgba(0,170,255,0.15)' }}>
          <div style={{ fontSize: '13px', color: '#00aaff', letterSpacing: '0.1em', marginBottom: '4px' }}>
            ◉ TEAM ROOM
          </div>
          <div style={{ fontSize: '6px', color: '#3a4a6b', letterSpacing: '0.2em' }}>
            EDITOR WORKLOAD · {techs.length} STAFF MEMBERS
          </div>
        </div>

        {techs.length === 0 ? (
          <div style={{ fontSize: '8px', color: '#3a4a6b', textAlign: 'center', padding: '60px' }}>
            No team members yet —{' '}
            <Link href="/settings" style={{ color: '#00aaff' }}>add staff in Settings</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {techs.map((tech, idx) => {
              const techJobs = allJobs.filter(j => j.technician === tech.name)
              const active    = techJobs.filter(j => j.status === 'in-progress')
              const pending   = techJobs.filter(j => j.status === 'pending' || j.status === 'queued')
              const review    = techJobs.filter(j => j.status === 'review')
              const done      = techJobs.filter(j => j.status === 'done')
              const isActive  = active.length > 0

              return (
                <div key={tech.id} style={{
                  background: '#0a1022',
                  border: `1px solid ${tech.color}30`,
                  overflow: 'hidden',
                }}>
                  {/* Header with pixel art character */}
                  <div style={{
                    padding: '16px',
                    borderBottom: `1px solid ${tech.color}20`,
                    background: `${tech.color}08`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        padding: '4px',
                        background: `${tech.color}15`,
                        border: `1px solid ${tech.color}40`,
                        imageRendering: 'pixelated',
                        flexShrink: 0,
                      }}>
                        <PixelCharacter index={idx} color={tech.color} size={4} />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: tech.color, letterSpacing: '0.06em' }}>{tech.name}</div>
                        <div style={{ fontSize: '6px', color: '#3a4a6b', marginTop: '3px' }}>
                          {techJobs.length} TOTAL JOB{techJobs.length !== 1 ? 'S' : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      width: '10px', height: '10px', borderRadius: '50%',
                      background: isActive ? '#00ff41' : pending.length > 0 ? '#ffd700' : '#3a4a6b',
                      boxShadow: isActive ? '0 0 8px #00ff41' : 'none',
                    }} />
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: `1px solid ${tech.color}15` }}>
                    {[
                      { label: 'ACTIVE',  value: active.length,  color: '#00aaff' },
                      { label: 'QUEUE',   value: pending.length, color: '#ffd700' },
                      { label: 'REVIEW',  value: review.length,  color: '#ff6b35' },
                      { label: 'DONE',    value: done.length,    color: '#00ff41' },
                    ].map(s => (
                      <div key={s.label} style={{ padding: '10px 8px', textAlign: 'center', borderRight: `1px solid ${tech.color}10` }}>
                        <div style={{ fontSize: '14px', color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '5px', color: '#3a4a6b', letterSpacing: '0.1em' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Current jobs */}
                  <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '100px' }}>
                    {techJobs.filter(j => j.status !== 'done' && j.status !== 'cancelled').slice(0, 4).length === 0 ? (
                      <div style={{ fontSize: '7px', color: '#3a4a6b', textAlign: 'center', paddingTop: '20px' }}>— AVAILABLE —</div>
                    ) : techJobs
                      .filter(j => j.status !== 'done' && j.status !== 'cancelled')
                      .slice(0, 4)
                      .map(job => {
                        const sc = STATUS_COLORS[job.status]
                        const draft = job.current_draft || 1
                        const draftColors = ['#00aaff', '#b06bff', '#ff6b35']
                        const dc = draftColors[(draft - 1) % 3]
                        return (
                          <Link key={job.id} href={`/jobs/${job.id}`} style={{ textDecoration: 'none' }}>
                            <div style={{
                              background: '#070d1a',
                              border: `1px solid rgba(0,170,255,0.08)`,
                              borderLeft: `2px solid ${dc}`,
                              padding: '7px 10px',
                              display: 'flex', alignItems: 'center', gap: '8px',
                            }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '7px', color: '#e0e8ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {job.title}
                                </div>
                                <div style={{ fontSize: '6px', color: '#6b7db3' }}>{job.client}</div>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 }}>
                                <span style={{ fontSize: '5px', color: dc, border: `1px solid ${dc}40`, padding: '1px 4px' }}>D{draft}</span>
                                <span className="status-badge" style={{ color: sc.color, borderColor: sc.border, background: sc.bg, fontSize: '5px' }}>
                                  {job.status.replace('-', ' ')}
                                </span>
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    {techJobs.filter(j => j.status !== 'done' && j.status !== 'cancelled').length > 4 && (
                      <div style={{ fontSize: '6px', color: '#3a4a6b', textAlign: 'right', padding: '4px 0' }}>
                        +{techJobs.filter(j => j.status !== 'done' && j.status !== 'cancelled').length - 4} more…
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
