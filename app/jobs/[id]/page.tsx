import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/Nav'
import JobForm from '../JobForm'
import DeleteButton from './DeleteButton'
import { STATUS_COLORS, TECH_COLORS, type Job } from '@/lib/types'
import { notFound } from 'next/navigation'

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: job } = await supabase.from('jobs').select('*').eq('id', id).single()

  if (!job) notFound()

  const sc = STATUS_COLORS[job.status as keyof typeof STATUS_COLORS]
  const tc = TECH_COLORS[job.technician as keyof typeof TECH_COLORS]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#080e1c' }}>
      <Nav />
      <main className="flex-1 p-6">
        <div className="max-w-lg mx-auto">
          {/* Header */}
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

          <JobForm job={job as Job} />
        </div>
      </main>
    </div>
  )
}
