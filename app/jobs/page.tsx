import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/Nav'
import Link from 'next/link'
import { STATUS_COLORS, JOB_STATUSES, techColorMap, type Job, type TechnicianRecord } from '@/lib/types'

interface SearchParams { status?: string; tech?: string; q?: string }

export default async function JobsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase.from('jobs').select('*').order('created_at', { ascending: false })
  if (params.status) query = query.eq('status', params.status)
  if (params.tech)   query = query.eq('technician', params.tech)

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

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#080e1c' }}>
      <Nav />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontSize: '12px', color: '#00ff41', letterSpacing: '0.1em', marginBottom: '4px' }}>📋 ALL JOBS</h1>
            <div style={{ fontSize: '7px', color: '#6b7db3' }}>{filtered.length} JOB{filtered.length !== 1 ? 'S' : ''} FOUND</div>
          </div>
          <Link href="/jobs/new" className="pixel-btn pixel-btn-green">+ ADD JOB</Link>
        </div>

        {/* Filters */}
        <form method="GET" className="flex gap-3 mb-5 flex-wrap items-center">
          <input name="q" defaultValue={params.q || ''} className="pixel-input" placeholder="Search jobs..." style={{ maxWidth: '200px' }} />
          <select name="status" defaultValue={params.status || ''} className="pixel-select" style={{ maxWidth: '160px' }}>
            <option value="">ALL STATUS</option>
            {JOB_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select name="tech" defaultValue={params.tech || ''} className="pixel-select" style={{ maxWidth: '160px' }}>
            <option value="">ALL STAFF</option>
            {technicians.map(t => <option key={t.id} value={t.name}>{t.avatar} {t.name}</option>)}
          </select>
          <button type="submit" className="pixel-btn pixel-btn-blue">FILTER</button>
          {(params.status || params.tech || params.q) && (
            <Link href="/jobs" className="pixel-btn pixel-btn-gray">CLEAR</Link>
          )}
        </form>

        {/* Table */}
        <div className="pixel-border" style={{ background: '#0a1022', overflowX: 'auto' }}>
          <table className="pixel-table">
            <thead>
              <tr>
                <th>JOB NAME</th><th>TYPE</th><th>CLIENT</th>
                <th>STAFF</th><th>DEADLINE</th><th>STATUS</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#6b7db3', padding: '40px', fontSize: '8px' }}>
                    — NO JOBS FOUND —
                  </td>
                </tr>
              ) : filtered.map((job: Job) => {
                const sc = STATUS_COLORS[job.status]
                const tc = colorMap[job.technician] || '#6b7db3'
                const overdue = job.deadline && new Date(job.deadline) < new Date() && job.status !== 'done'
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
                      {job.deadline ? (
                        <span style={{ fontSize: '7px', color: overdue ? '#ff2d55' : '#e0e8ff' }}>
                          {overdue && '⚠ '}{formatDate(job.deadline)}
                        </span>
                      ) : <span style={{ fontSize: '7px', color: '#2d3a6b' }}>—</span>}
                    </td>
                    <td>
                      <span className="status-badge" style={{ color: sc.color, borderColor: sc.border, background: sc.bg }}>
                        {job.status.replace('-', ' ')}
                      </span>
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
      </main>
    </div>
  )
}

function formatDate(str: string) {
  const d = new Date(str)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}
