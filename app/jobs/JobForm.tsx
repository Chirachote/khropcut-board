'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  JOB_TYPES, JOB_STATUSES, WORKFLOW_STAGES,
  type Job, type JobStatus, type JobType, type TechnicianRecord,
} from '@/lib/types'

interface JobFormProps {
  job?: Job
  technicians: TechnicianRecord[]
}

export default function JobForm({ job, technicians }: JobFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const defaultTech = technicians[0]?.name || ''

  const [form, setForm] = useState({
    title:      job?.title      || '',
    type:       job?.type       || 'Short Clip',
    technician: job?.technician || defaultTech,
    deadline:   job?.deadline?.slice(0, 10)  || '',
    client:     job?.client     || '',
    status:     (job?.status    || 'queued') as JobStatus,
    // workflow dates
    d1_work:   job?.d1_work?.slice(0,10)   || '',
    d1_send:   job?.d1_send?.slice(0,10)   || '',
    d1_review: job?.d1_review?.slice(0,10) || '',
    d2_send:   job?.d2_send?.slice(0,10)   || '',
    d2_review: job?.d2_review?.slice(0,10) || '',
    d3_send:   job?.d3_send?.slice(0,10)   || '',
    d3_review: job?.d3_review?.slice(0,10) || '',
    post_date: job?.post_date?.slice(0,10) || '',
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
      title:      form.title,
      type:       form.type as JobType,
      technician: form.technician,
      deadline:   form.deadline   || null,
      client:     form.client,
      status:     form.status,
      d1_work:    form.d1_work    || null,
      d1_send:    form.d1_send    || null,
      d1_review:  form.d1_review  || null,
      d2_send:    form.d2_send    || null,
      d2_review:  form.d2_review  || null,
      d3_send:    form.d3_send    || null,
      d3_review:  form.d3_review  || null,
      post_date:  form.post_date  || null,
      updated_at: new Date().toISOString(),
    }

    if (job) {
      const { error } = await supabase.from('jobs').update(payload).eq('id', job.id)
      if (error) { setError(error.message); setLoading(false); return }
    } else {
      const { error } = await supabase.from('jobs').insert({ ...payload, current_draft: 1 })
      if (error) { setError(error.message); setLoading(false); return }
    }

    router.push('/jobs')
    router.refresh()
  }

  const selectedTech = technicians.find(t => t.name === form.technician)

  // Count how many workflow dates are filled
  const filledStages = WORKFLOW_STAGES.filter(s => form[s.key as keyof typeof form]).length

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

        {/* Type + Client */}
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
              placeholder="ชื่อลูกค้า"
              required
            />
          </div>
        </div>

        {/* Staff + Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>STAFF *</label>
            <div className="relative">
              <select
                className="pixel-select"
                value={form.technician}
                onChange={e => update('technician', e.target.value)}
                style={{ borderColor: selectedTech ? selectedTech.color + '80' : undefined }}
              >
                {technicians.length === 0 && <option value="">— No staff —</option>}
                {technicians.map(t => <option key={t.id} value={t.name}>{t.avatar} {t.name}</option>)}
              </select>
              {selectedTech && (
                <div style={{ position: 'absolute', left: 0, bottom: '-4px', height: '2px', width: '100%', background: selectedTech.color, opacity: 0.6 }} />
              )}
            </div>
          </div>
          <div>
            <label style={labelStyle}>STATUS</label>
            <select className="pixel-select" value={form.status} onChange={e => update('status', e.target.value as JobStatus)}>
              {JOB_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label} — {s.labelTH}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Final Deadline */}
        <div style={{ maxWidth: '50%', paddingRight: '8px' }}>
          <label style={labelStyle}>FINAL DEADLINE</label>
          <input
            type="date"
            className="pixel-input"
            value={form.deadline}
            onChange={e => update('deadline', e.target.value)}
            style={{ colorScheme: 'dark' }}
          />
        </div>

        {/* ── Workflow Timeline ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>
              WORKFLOW TIMELINE
            </label>
            <span style={{ fontSize: '6px', color: '#3a4a6b' }}>
              {filledStages}/{WORKFLOW_STAGES.length} STAGES SET
            </span>
          </div>

          <div style={{ border: '1px solid rgba(0,170,255,0.15)', background: '#07101f' }}>
            {/* Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 80px 120px',
              padding: '7px 12px',
              borderBottom: '1px solid rgba(0,170,255,0.1)',
              fontSize: '6px', color: '#3a4a6b', letterSpacing: '0.1em',
            }}>
              <span>STAGE</span>
              <span>PARTY</span>
              <span>DATE</span>
            </div>

            {/* Rows */}
            {WORKFLOW_STAGES.map((stage, i) => {
              const val = form[stage.key as keyof typeof form] as string
              const isProduction = stage.party === 'production'
              const isLast = i === WORKFLOW_STAGES.length - 1
              return (
                <div
                  key={stage.key}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 80px 120px',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderBottom: isLast ? 'none' : '1px solid rgba(0,170,255,0.06)',
                    background: val ? `${stage.color}06` : 'transparent',
                    transition: 'background 0.1s',
                  }}
                >
                  {/* Stage name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '6px', height: '6px',
                      background: val ? stage.color : 'transparent',
                      border: `1px solid ${stage.color}60`,
                      flexShrink: 0,
                    }} />
                    <div>
                      <div style={{ fontSize: '7px', color: val ? stage.color : '#6b7db3', letterSpacing: '0.06em' }}>
                        {stage.label}
                      </div>
                      <div style={{ fontSize: '6px', color: '#3a4a6b' }}>{stage.labelTH}</div>
                    </div>
                  </div>

                  {/* Party badge */}
                  <div>
                    <span style={{
                      fontSize: '5px',
                      padding: '2px 5px',
                      color: isProduction ? '#00aaff' : '#ff6b9d',
                      border: `1px solid ${isProduction ? '#00aaff' : '#ff6b9d'}40`,
                      letterSpacing: '0.08em',
                    }}>
                      {isProduction ? 'POST PRO' : 'CLIENT'}
                    </span>
                  </div>

                  {/* Date input */}
                  <input
                    type="date"
                    value={val}
                    onChange={e => update(stage.key, e.target.value)}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${val ? stage.color + '50' : 'rgba(0,170,255,0.15)'}`,
                      color: val ? stage.color : '#6b7db3',
                      fontSize: '7px',
                      padding: '4px 6px',
                      colorScheme: 'dark',
                      width: '100%',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {error && (
          <div style={{ fontSize: '7px', color: '#ff2d55', border: '1px solid #ff2d55', padding: '8px 10px', background: 'rgba(255,45,85,0.08)' }}>
            ⚠ {error.toUpperCase()}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="pixel-btn pixel-btn-green flex-1" style={{ justifyContent: 'center', padding: '12px' }}>
            {loading ? 'SAVING...' : job ? '[ SAVE CHANGES ]' : '[ CREATE JOB ]'}
          </button>
          <button type="button" onClick={() => router.back()} className="pixel-btn pixel-btn-gray" style={{ padding: '12px 18px' }}>
            CANCEL
          </button>
        </div>

      </div>
    </form>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: '7px', color: '#6b7db3',
  letterSpacing: '0.1em', display: 'block', marginBottom: '6px',
}
