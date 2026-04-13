'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TECHNICIANS, JOB_TYPES, JOB_STATUSES, type Job, type JobStatus, type JobType, type Technician } from '@/lib/types'

interface JobFormProps {
  job?: Job
}

export default function JobForm({ job }: JobFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: job?.title || '',
    type: job?.type || 'Video Edit',
    technician: job?.technician || 'อั้ม',
    deadline: job?.deadline?.slice(0, 10) || '',
    client: job?.client || '',
    status: job?.status || 'pending',
  })

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const payload = {
      title: form.title,
      type: form.type as JobType,
      technician: form.technician as Technician,
      deadline: form.deadline || null,
      client: form.client,
      status: form.status as JobStatus,
      updated_at: new Date().toISOString(),
    }

    if (job) {
      const { error } = await supabase.from('jobs').update(payload).eq('id', job.id)
      if (error) { setError(error.message); setLoading(false); return }
    } else {
      const { error } = await supabase.from('jobs').insert(payload)
      if (error) { setError(error.message); setLoading(false); return }
    }

    router.push('/jobs')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="pixel-border" style={{ background: '#0a1022', padding: '28px' }}>
      <div className="flex flex-col gap-5">
        {/* Title */}
        <div>
          <label style={labelStyle}>JOB NAME *</label>
          <input
            className="pixel-input"
            value={form.title}
            onChange={e => update('title', e.target.value)}
            placeholder="e.g. MV บิลลี่ - สุดท้าย"
            required
          />
        </div>

        {/* Type + Client row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>TYPE *</label>
            <select className="pixel-select" value={form.type} onChange={e => update('type', e.target.value)}>
              {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>CLIENT *</label>
            <input
              className="pixel-input"
              value={form.client}
              onChange={e => update('client', e.target.value)}
              placeholder="Client name"
              required
            />
          </div>
        </div>

        {/* Technician + Status row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>STAFF *</label>
            <select className="pixel-select" value={form.technician} onChange={e => update('technician', e.target.value)}>
              {TECHNICIANS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>STATUS</label>
            <select className="pixel-select" value={form.status} onChange={e => update('status', e.target.value)}>
              {JOB_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* Deadline */}
        <div>
          <label style={labelStyle}>DEADLINE</label>
          <input
            type="date"
            className="pixel-input"
            value={form.deadline}
            onChange={e => update('deadline', e.target.value)}
            style={{ colorScheme: 'dark' }}
          />
        </div>

        {error && (
          <div style={{ fontSize: '7px', color: '#ff2d55', border: '1px solid #ff2d55', padding: '8px 10px', background: 'rgba(255,45,85,0.08)' }}>
            ⚠ {error.toUpperCase()}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="pixel-btn pixel-btn-green flex-1"
            style={{ justifyContent: 'center', padding: '12px' }}
          >
            {loading ? 'SAVING...' : job ? '[ SAVE CHANGES ]' : '[ CREATE JOB ]'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="pixel-btn pixel-btn-gray"
            style={{ padding: '12px 18px' }}
          >
            CANCEL
          </button>
        </div>
      </div>
    </form>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: '7px',
  color: '#6b7db3',
  letterSpacing: '0.1em',
  display: 'block',
  marginBottom: '6px',
}
