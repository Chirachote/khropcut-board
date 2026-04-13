import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'
import Link from 'next/link'
import {
  STATUS_COLORS, JOB_STATUSES, WORKFLOW_STAGES, techColorMap,
  type Job, type TechnicianRecord,
} from '@/lib/types'

interface SearchParams { tab?: string; tech?: string; q?: string }

const TABS = [
  { key: 'active',    label: 'กำลังทำ',   labelEN: 'ACTIVE',     icon: '▶', statuses: ['in-progress', 'review'] },
  { key: 'scheduled', label: 'ลงคิวแล้ว', labelEN: 'SCHEDULED',  icon: '◌', statuses: ['pending'] },
  { key: 'reserved',  label: 'จองคิว',    labelEN: 'RESERVED',   icon: '⬡', statuses: ['queued'] },
  { key: 'done',      label: 'เสร็จแล้ว', labelEN: 'DONE',       icon: '✓', statuses: ['done'] },
]

export default async function JobsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const supabase = await createClient()
  const activeTab = params.tab || 'active'
  const tab = TABS.find(t => t.key === activeTab) || TABS[0]

  let query = supabase.from('jobs').select('*')
    .in('status', tab.statuses)
    .order('created_at', { ascending: false })

  if (params.tech) query = query.eq('technician', params.tech)

  const [{ data: jobs }, { data: techsData }] = await Promise.all([
    query,
    supabase.from('technicians').select('*').order('sort_order'),
  ])

  const technicians: TechnicianRecord[] = techsData || []
  const colorMap = techColorMap(technicians)

  const filtered = (jobs || []).filter((j: Job) =>
    params.q
      ? j.title.toLowerCase().includes(params.q.toLowerCase()) ||
        j.client.toLowerCase().includes(params.q.toLowerCase())
      : true
  )

  // Count per tab (for badges)
  const { data: allJobs } = await supabase.from('jobs').select('status').neq('status', 'cancelled')
  const counts: Record<string, number> = {}
  for (const tab of TABS) {
    counts[tab.key] = (allJobs || []).filter(j => tab.statuses.includes(j.status)).length
  }

  return (
    <AppShell>
      <div style={{ padding: '24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#00aaff', letterSpacing: '0.1em', marginBottom: '4px' }}>
              ▦ PRODUCTION BOARD
            </div>
            <div style={{ fontSize: '6px', color: '#3a4a6b', letterSpacing: '0.2em' }}>
              MANAGE ALL JOBS
            </div>
          </div>
          <Link href="/jobs/new" className="pixel-btn pixel-btn-green" style={{ fontSize: '7px' }}>
            + NEW JOB
          </Link>
        </div>

        {/* ── Tab bar ── */}
        <div style={{
          display: 'flex', gap: '2px',
          borderBottom: '2px solid rgba(0,170,255,0.15)',
          marginBottom: '20px',
        }}>
          {TABS.map(t => {
            const isActive = t.key === activeTab
            const tabColors: Record<string, string> = {
              active: '#00aaff', scheduled: '#ffd700', reserved: '#6b7db3', done: '#00ff41',
            }
            const c = tabColors[t.key]
            return (
              <Link
                key={t.key}
                href={`/jobs?tab=${t.key}${params.tech ? `&tech=${params.tech}` : ''}${params.q ? `&q=${params.q}` : ''}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '10px 16px',
                  fontSize: '7px',
                  color: isActive ? c : '#3a4a6b',
                  textDecoration: 'none',
                  background: isActive ? `${c}10` : 'transparent',
                  borderBottom: isActive ? `2px solid ${c}` : '2px solid transparent',
                  letterSpacing: '0.1em',
                  marginBottom: '-2px',
                  transition: 'all 0.1s',
                }}
              >
                <span>{t.icon}</span>
                <span>{t.labelEN}</span>
                <span style={{
                  fontSize: '6px', padding: '1px 5px',
                  background: isActive ? `${c}20` : 'rgba(0,0,0,0.3)',
                  color: isActive ? c : '#3a4a6b',
                  border: `1px solid ${isActive ? c + '40' : 'transparent'}`,
                }}>
                  {counts[t.key] || 0}
                </span>
                <span style={{ fontSize: '6px', color: isActive ? c + 'aa' : '#2a3456' }}>
                  {t.label}
                </span>
              </Link>
            )
          })}
        </div>

        {/* ── Filters ── */}
        <form method="GET" className="flex gap-3 mb-5 flex-wrap items-center">
          <input type="hidden" name="tab" value={activeTab} />
          <input name="q" defaultValue={params.q || ''} className="pixel-input" placeholder="ค้นหา job..." style={{ maxWidth: '200px' }} />
          <select name="tech" defaultValue={params.tech || ''} className="pixel-select" style={{ maxWidth: '160px' }}>
            <option value="">ALL STAFF</option>
            {technicians.map(t => <option key={t.id} value={t.name}>{t.avatar} {t.name}</option>)}
          </select>
          <button type="submit" className="pixel-btn pixel-btn-blue" style={{ fontSize: '7px' }}>FILTER</button>
          {(params.tech || params.q) && (
            <Link href={`/jobs?tab=${activeTab}`} className="pixel-btn pixel-btn-gray" style={{ fontSize: '7px' }}>CLEAR</Link>
          )}
          <span style={{ fontSize: '6px', color: '#3a4a6b', marginLeft: '4px' }}>
            {filtered.length} JOB{filtered.length !== 1 ? 'S' : ''}
          </span>
        </form>

        {/* ── Job cards (active/scheduled) or table (done/reserved) ── */}
        {filtered.length === 0 ? (
          <div style={{
            background: '#0a1022', border: '1px solid rgba(0,170,255,0.1)',
            padding: '60px', textAlign: 'center',
            fontSize: '8px', color: '#3a4a6b',
          }}>
            {activeTab === 'active'    && '— ไม่มีงานที่กำลังทำอยู่ —'}
            {activeTab === 'scheduled' && '— ไม่มีงานที่ลงคิวไว้ —'}
            {activeTab === 'reserved'  && '— ไม่มีงานที่จองคิวไว้ —'}
            {activeTab === 'done'      && '— ยังไม่มีงานที่เสร็จ —'}
          </div>
        ) : activeTab === 'active' ? (
          /* Active: large cards with workflow progress */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map((job: Job) => <ActiveJobCard key={job.id} job={job} colorMap={colorMap} />)}
          </div>
        ) : activeTab === 'done' ? (
          /* Done: compact list */
          <div style={{ background: '#0a1022', border: '1px solid rgba(0,170,255,0.1)' }}>
            {filtered.map((job: Job, i: number) => (
              <DoneJobRow key={job.id} job={job} colorMap={colorMap} isLast={i === filtered.length - 1} />
            ))}
          </div>
        ) : (
          /* Scheduled / Reserved: table */
          <div className="pixel-border" style={{ background: '#0a1022', overflowX: 'auto' }}>
            <table className="pixel-table">
              <thead>
                <tr>
                  <th>JOB NAME</th><th>TYPE</th><th>CLIENT</th>
                  <th>STAFF</th>
                  {activeTab === 'scheduled' ? <th>NEXT STAGE</th> : <th>STATUS</th>}
                  <th>DEADLINE</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((job: Job) => {
                  const sc = STATUS_COLORS[job.status]
                  const tc = colorMap[job.technician] || '#6b7db3'
                  const today = new Date().toISOString().slice(0, 10)
                  // find next unfilled or soonest stage
                  const nextStage = WORKFLOW_STAGES.find(s => {
                    const v = job[s.key as keyof Job] as string | null
                    return v && v >= today
                  })
                  return (
                    <tr key={job.id}>
                      <td>
                        <div style={{ fontSize: '8px', color: '#e0e8ff', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {job.title}
                        </div>
                      </td>
                      <td><span style={{ fontSize: '7px', color: '#6b7db3' }}>{job.type}</span></td>
                      <td><span style={{ fontSize: '7px', color: '#e0e8ff' }}>{job.client}</span></td>
                      <td><span style={{ fontSize: '8px', color: tc }}>{job.technician}</span></td>
                      <td>
                        {activeTab === 'scheduled' && nextStage ? (
                          <div>
                            <div style={{ fontSize: '6px', color: nextStage.color }}>{nextStage.label}</div>
                            <div style={{ fontSize: '6px', color: '#6b7db3' }}>
                              {formatDate(job[nextStage.key as keyof Job] as string)}
                            </div>
                          </div>
                        ) : (
                          <span className="status-badge" style={{ color: sc.color, borderColor: sc.border, background: sc.bg }}>
                            {job.status.replace('-', ' ')}
                          </span>
                        )}
                      </td>
                      <td>
                        {job.deadline ? (
                          <span style={{ fontSize: '7px', color: job.deadline < today ? '#ff2d55' : '#e0e8ff' }}>
                            {formatDate(job.deadline)}
                          </span>
                        ) : <span style={{ fontSize: '7px', color: '#2d3a6b' }}>—</span>}
                      </td>
                      <td>
                        <Link href={`/jobs/${job.id}`} className="pixel-btn pixel-btn-blue" style={{ fontSize: '6px', padding: '5px 9px' }}>
                          EDIT
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  )
}

/* ── Active Job Card: shows workflow progress ── */
function ActiveJobCard({ job, colorMap }: { job: Job; colorMap: Record<string, string> }) {
  const sc = STATUS_COLORS[job.status]
  const tc = colorMap[job.technician] || '#6b7db3'
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div style={{
      background: '#0a1022',
      border: `1px solid rgba(0,170,255,0.15)`,
      borderLeft: `3px solid ${sc.color}`,
    }}>
      {/* Job header */}
      <div style={{
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0,170,255,0.08)',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link href={`/jobs/${job.id}`} style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: '9px', color: '#e0e8ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>
              {job.title}
            </div>
          </Link>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '6px', color: tc }}>{job.technician}</span>
            <span style={{ fontSize: '6px', color: '#3a4a6b' }}>{job.client}</span>
            <span style={{ fontSize: '6px', color: '#3a4a6b' }}>{job.type}</span>
            {job.deadline && (
              <span style={{ fontSize: '6px', color: job.deadline < today ? '#ff2d55' : '#6b7db3' }}>
                deadline {formatDate(job.deadline)}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span className="status-badge" style={{ color: sc.color, borderColor: sc.border, background: sc.bg }}>
            {job.status.replace('-', ' ')}
          </span>
          <Link href={`/jobs/${job.id}`} className="pixel-btn pixel-btn-blue" style={{ fontSize: '6px', padding: '5px 9px' }}>
            EDIT
          </Link>
        </div>
      </div>

      {/* Workflow timeline */}
      <div style={{ padding: '10px 16px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '0', minWidth: 'max-content' }}>
          {WORKFLOW_STAGES.map((stage, i) => {
            const val = job[stage.key as keyof Job] as string | null
            const isFilled = !!val
            const isToday = val === today
            const isPast  = val && val < today
            const isFuture = val && val > today
            const isNext = !isFilled && WORKFLOW_STAGES.slice(0, i).every(s => !!(job[s.key as keyof Job]))

            let dotColor = '#2a3456'
            if (isPast)    dotColor = stage.color
            if (isToday)   dotColor = stage.color
            if (isFuture)  dotColor = stage.color + '80'
            if (!isFilled && isNext) dotColor = '#3a4a6b'

            return (
              <div key={stage.key} style={{ display: 'flex', alignItems: 'center' }}>
                {/* Stage block */}
                <div style={{
                  padding: '6px 10px',
                  background: isToday ? `${stage.color}15` : isPast ? `${stage.color}08` : 'transparent',
                  border: `1px solid ${isFilled ? stage.color + '40' : 'rgba(0,170,255,0.08)'}`,
                  minWidth: '90px',
                  textAlign: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '3px' }}>
                    <div style={{
                      width: '5px', height: '5px',
                      background: dotColor,
                      boxShadow: (isToday || isPast) ? `0 0 4px ${stage.color}` : 'none',
                    }} />
                    <span style={{ fontSize: '5px', color: isFilled ? stage.color : '#3a4a6b', letterSpacing: '0.06em' }}>
                      {stage.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '7px', color: isFilled ? (isPast ? '#6b7db3' : stage.color) : '#2a3456' }}>
                    {isFilled ? formatDate(val!) : '—'}
                  </div>
                  {isToday && (
                    <div style={{ fontSize: '5px', color: stage.color, marginTop: '2px' }}>TODAY</div>
                  )}
                </div>
                {/* Connector */}
                {i < WORKFLOW_STAGES.length - 1 && (
                  <div style={{
                    width: '12px', height: '1px',
                    background: isFilled ? stage.color + '40' : 'rgba(0,170,255,0.08)',
                    flexShrink: 0,
                  }} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── Done Job Row ── */
function DoneJobRow({ job, colorMap, isLast }: { job: Job; colorMap: Record<string, string>; isLast: boolean }) {
  const tc = colorMap[job.technician] || '#6b7db3'
  const today = new Date().toISOString().slice(0, 10)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '10px 16px',
      borderBottom: isLast ? 'none' : '1px solid rgba(0,170,255,0.06)',
    }}>
      <span style={{ fontSize: '8px', color: '#00ff41', flexShrink: 0 }}>✓</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '8px', color: '#6b7db3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {job.title}
        </div>
        <div style={{ fontSize: '6px', color: '#3a4a6b', marginTop: '2px' }}>
          {job.client} · <span style={{ color: tc }}>{job.technician}</span>
        </div>
      </div>
      {job.deadline && (
        <span style={{ fontSize: '7px', color: '#3a4a6b', flexShrink: 0 }}>
          {formatDate(job.deadline)}
        </span>
      )}
      <Link href={`/jobs/${job.id}`} className="pixel-btn pixel-btn-gray" style={{ fontSize: '6px', padding: '4px 8px', flexShrink: 0 }}>
        VIEW
      </Link>
    </div>
  )
}

function formatDate(str: string) {
  const d = new Date(str)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}
