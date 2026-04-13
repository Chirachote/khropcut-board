import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/Nav'
import JobForm from '../JobForm'
import DeleteButton from './DeleteButton'
import { STATUS_COLORS, type Job, type TechnicianRecord } from '@/lib/types'
import { notFound } from 'next/navigation'

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: job }, { data: techsData }] = await Promise.all([
    supabase.from('jobs').select('*').eq('id', id).single(),
    supabase.from('technicians').select('*').order('sort_order'),
  ])

  if (!job) notFound()

  const technicians: TechnicianRecord[] = techsData || []
  const sc = STATUS_COLORS[job.status as keyof typeof STATUS_COLORS]
  const tc = technicians.find(t => t.name === job.technician)?.color || '#6b7db3'

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#080e1c' }}>
      <Nav />
      <main className="flex-1 p-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 style={{ fontSize: '11px', color: '#00aaff', letterSpacing: '0.08em', marginBottom: '6px' }}>
                ✎ EDIT JOB
              </h1>
              <div style={{ fontSize: '8px', color: '#e0e8ff', marginBottom: '4px' }}>{job.title}</div>
              <div className="flex items-center gap-3">
                <span className="status-badge" style={{ color: sc.color, borderColor: sc.border, background: sc.bg }}>
                  {(job.status as string).replace('-', ' ')}
                </span>
                <span style={{ fontSize: '8px', color: tc }}>{job.technician}</span>
                <span style={{ fontSize: '7px', color: '#6b7db3' }}>{job.client}</span>
              </div>
            </div>
            <DeleteButton jobId={job.id} jobTitle={job.title} />
          </div>

          <JobForm job={job as Job} technicians={technicians} />
        </div>
      </main>
    </div>
  )
}
