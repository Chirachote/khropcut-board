import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/Nav'
import Link from 'next/link'
import { STATUS_COLORS, type Job, type TechnicianRecord } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ data: jobs }, { data: technicians }] = await Promise.all([
    supabase.from('jobs').select('*').neq('status', 'cancelled').order('deadline', { ascending: true }),
    supabase.from('technicians').select('*').order('sort_order'),
  ])

  const techs: TechnicianRecord[] = technicians || []
  const allJobs: Job[] = jobs || []

  const total      = allJobs.length
  const done       = allJobs.filter(j => j.status === 'done').length
  const inProgress = allJobs.filter(j => j.status === 'in-progress').length
  const pending    = allJobs.filter(j => j.status === 'pending').length

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#080e1c' }}>
      <Nav />

      <main className="flex-1 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontSize: '12px', color: '#00ff41', letterSpacing: '0.1em', marginBottom: '4px' }}>
              🗺️ STUDIO MAP
            </h1>
            <div style={{ fontSize: '7px', color: '#6b7db3' }}>REAL-TIME WORKSTATION STATUS</div>
          </div>
          <div className="flex gap-4">
            {[
              { label: 'TOTAL',  value: total,      color: '#e0e8ff' },
              { label: 'ACTIVE', value: inProgress, color: '#00aaff' },
              { label: 'QUEUE',  value: pending,    color: '#ffd700' },
              { label: 'DONE',   value: done,       color: '#00ff41' },
            ].map(s => (
              <div key={s.label} className="pixel-border text-center" style={{ background: '#0d1225', padding: '8px 14px', minWidth: '60px' }}>
                <div style={{ fontSize: '16px', color: s.color, fontWeight: 'bold' }}>{s.value}</div>
                <div style={{ fontSize: '6px', color: '#6b7db3', letterSpacing: '0.1em', marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Studio floor */}
        <div
          className="relative p-6"
          style={{
            border: '2px solid #2d3a6b',
            background: 'linear-gradient(135deg, #080e1c 0%, #0d1530 100%)',
            backgroundImage: 'linear-gradient(rgba(45,58,107,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(45,58,107,0.15) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          <div style={{ fontSize: '7px', color: '#2d3a6b', letterSpacing: '0.15em', marginBottom: '20px' }}>
            📡 FLOOR PLAN — KHROPCUT STUDIO
          </div>

          {techs.length === 0 ? (
            <div style={{ fontSize: '8px', color: '#6b7db3', textAlign: 'center', padding: '40px' }}>
              No staff yet —{' '}
              <Link href="/settings" style={{ color: '#00aaff' }}>add team members in Settings</Link>
            </div>
          ) : (
            <div
              className="grid gap-5"
              style={{ gridTemplateColumns: `repeat(${Math.min(techs.length, 3)}, 1fr)` }}
            >
              {techs.map(tech => {
                const techJobs = allJobs.filter(j => j.technician === tech.name)
                const { color, avatar } = tech
                const activeJob = techJobs.find(j => j.status === 'in-progress')
                const isIdle = techJobs.length === 0 || techJobs.every(j => j.status === 'done')

                return (
                  <div
                    key={tech.id}
                    style={{
                      background: '#0a1022',
                      border: `2px solid ${color}40`,
                      boxShadow: `0 0 12px ${color}15`,
                      padding: '16px',
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: '18px' }}>{avatar}</span>
                        <div>
                          <div style={{ fontSize: '10px', color, letterSpacing: '0.05em' }}>{tech.name}</div>
                          <div style={{ fontSize: '6px', color: '#6b7db3' }}>
                            {techJobs.length} JOB{techJobs.length !== 1 ? 'S' : ''}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        width: '10px', height: '10px', borderRadius: '50%',
                        background: isIdle ? '#6b7db3' : activeJob ? '#00ff41' : '#ffd700',
                        boxShadow: isIdle ? 'none' : `0 0 8px ${activeJob ? '#00ff41' : '#ffd700'}`,
                      }} />
                    </div>

                    {/* Monitor */}
                    <div style={{
                      background: '#050810',
                      border: `1px solid ${color}30`,
                      padding: '8px',
                      minHeight: '80px',
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)',
                        pointerEvents: 'none',
                      }} />
                      {techJobs.length === 0 ? (
                        <div style={{ fontSize: '7px', color: '#2d3a6b', textAlign: 'center', paddingTop: '18px' }}>— IDLE —</div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {techJobs.slice(0, 3).map(job => {
                            const sc = STATUS_COLORS[job.status]
                            return (
                              <Link key={job.id} href={`/jobs/${job.id}`} style={{ textDecoration: 'none' }}>
                                <div style={{ background: sc.bg, border: `1px solid ${sc.border}40`, padding: '5px 7px', cursor: 'pointer' }}>
                                  <div style={{ fontSize: '7px', color: sc.color, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {job.title}
                                  </div>
                                  <div className="flex justify-between">
                                    <span style={{ fontSize: '6px', color: '#6b7db3' }}>{job.client}</span>
                                    {job.deadline && (
                                      <span style={{ fontSize: '6px', color: isOverdue(job.deadline) ? '#ff2d55' : '#6b7db3' }}>
                                        {formatDeadline(job.deadline)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            )
                          })}
                          {techJobs.length > 3 && (
                            <div style={{ fontSize: '6px', color: '#6b7db3', textAlign: 'right' }}>+{techJobs.length - 3} more...</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Keyboard deco */}
                    <div className="flex justify-center mt-2 gap-1">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} style={{ width: '8px', height: '5px', background: '#0d1530', border: `1px solid ${color}20`, borderRadius: '1px' }} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-4 flex-wrap">
          {[
            { label: 'IN PROGRESS', color: '#00ff41' },
            { label: 'PENDING',     color: '#ffd700' },
            { label: 'REVIEW',      color: '#ff6b35' },
            { label: 'IDLE',        color: '#6b7db3' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-2">
              <div style={{ width: '8px', height: '8px', background: l.color, boxShadow: `0 0 4px ${l.color}` }} />
              <span style={{ fontSize: '7px', color: '#6b7db3' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

function isOverdue(deadline: string) { return new Date(deadline) < new Date() }
function formatDeadline(deadline: string) {
  const d = new Date(deadline)
  return `${d.getDate()}/${d.getMonth() + 1}`
}
