'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { JOB_TYPES, JOB_STATUSES, DRAFT_LABELS, type Job, type JobStatus, type JobType, type TechnicianRecord } from '@/lib/types'

interface JobFormProps {
  job?: Job
  technicians: TechnicianRecord[]
}

const DRAFT_COLORS = { d1: '#00aaff', d2: '#b06bff', d3: '#ff6b35' }

export default function JobForm({ job, technicians }: JobFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeDraft, setActiveDraft] = useState<'d1' | 'd2' | 'd3'>('d1')
  const defaultTech = technicians[0]?.name || ''

  const [form, setForm] = useState({
    title:        job?.title || '',
    type:         job?.type || 'Short Clip',
    technician:   job?.technician || defaultTech,
    deadline:     job?.deadline?.slice(0, 10) || '',
    client:       job?.client || '',
    status:       job?.status || 'pending',
    current_draft: String(job?.current_draft ?? 1),
    // Draft 1
    d1_work:   job?.d1_work?.slice(0, 10)   || '',
    d1_send:   job?.d1_send?.slice(0, 10)   || '',
    d1_review: job?.d1_review?.slice(0, 10) || '',
    // Draft 2
    d2_work:   job?.d2_work?.slice(0, 10)   || '',
    d2_send:   job?.d2_send?.slice(0, 10)   || '',
    d2_review: job?.d2_review?.slice(0, 10) || '',
    // Draft 3
    d3_work:   job?.d3_work?.slice(0, 10)   || '',
    d3_send:   job?.d3_send?.slice(0, 10)   || '',
    d3_review: job?.d3_review?.slice(0, 10) || '',
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
      title:         form.title,
      type:          form.type as JobType,
      technician:    form.technician,
      deadline:      form.deadline || null,
      client:        form.client,
      status:        form.status as JobStatus,
      current_draft: parseInt(form.current_draft),
      d1_work:       form.d1_work   || null,
      d1_send:       form.d1_send   || null,
      d1_review:     form.d1_review || null,
      d2_work:       form.d2_work   || null,
      d2_send:       form.d2_send   || null,
      d2_review:     form.d2_review || null,
      d3_work:       form.d3_work   || null,
      d3_send:       form.d3_send   || null,
      d3_review:     form.d3_review || null,
      updated_at:    new Date().toISOString(),
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

  const selectedTech = technicians.find(t => t.name === form.technician)
  const draftColor = DRAFT_COLORS[activeDraft]

  return (
    <form onSubmit={handleSubmit} className="pixel-border" style={{ background: '#0a1022', padding: '28px' }}>
      <div className="flex flex-col gap-5">

        {/* Title */}
        <div>
          <label style={labelStyle}>JOB NAME *</label>
          <input className="pixel-input" value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g. MV บิลลี่ - สุดท้าย" required />
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
            <input className="pixel-input" value={form.client} onChange={e => update('client', e.target.value)} placeholder="Client name" required />
          </div>
        </div>

        {/* Technician + Status */}
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
              {selectedTech && <div style={{ position: 'absolute', left: 0, bottom: '-4px', height: '2px', width: '100%', background: selectedTech.color, opacity: 0.6 }} />}
            </div>
          </div>
          <div>
            <label style={labelStyle}>STATUS</label>
            <select className="pixel-select" value={form.status} onChange={e => update('status', e.target.value)}>
              {JOB_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* Final Deadline + Current Draft */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>FINAL DEADLINE</label>
            <input type="date" className="pixel-input" value={form.deadline} onChange={e => update('deadline', e.target.value)} style={{ colorScheme: 'dark' }} />
          </div>
          <div>
            <label style={labelStyle}>CURRENT DRAFT</label>
            <select className="pixel-select" value={form.current_draft} onChange={e => update('current_draft', e.target.value)}>
              <option value="1">Draft 1</option>
              <option value="2">Draft 2</option>
              <option value="3">Draft 3</option>
            </select>
          </div>
        </div>

        {/* ── Draft Timeline ─────────────────────────── */}
        <div style={{ border: `2px solid ${draftColor}30`, background: '#07101f' }}>
          {/* Draft tabs */}
          <div className="flex" style={{ borderBottom: `2px solid ${draftColor}30` }}>
            {DRAFT_LABELS.map(d => {
              const isActive = activeDraft === d.key
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setActiveDraft(d.key as 'd1' | 'd2' | 'd3')}
                  style={{
                    flex: 1,
                    fontSize: '7px',
                    padding: '8px',
                    background: isActive ? `${d.color}15` : 'transparent',
                    color: isActive ? d.color : '#6b7db3',
                    border: 'none',
                    borderBottom: isActive ? `2px solid ${d.color}` : '2px solid transparent',
                    cursor: 'pointer',
                    letterSpacing: '0.1em',
                    marginBottom: '-2px',
                  }}
                >
                  {d.label}
                  {/* dot if has data */}
                  {(form[`${d.key}_work` as keyof typeof form] || form[`${d.key}_send` as keyof typeof form]) && (
                    <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: d.color, marginLeft: '5px', verticalAlign: 'middle' }} />
                  )}
                </button>
              )
            })}
          </div>

          {/* Draft fields */}
          <div style={{ padding: '14px 16px' }}>
            {/* Note for D2/D3 */}
            {activeDraft !== 'd1' && (
              <div style={{ fontSize: '6px', color: '#6b7db3', marginBottom: '10px', lineHeight: 1.8 }}>
                ⚡ การปรับแก้ — สามารถทำงานคู่ขนานได้
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              {[
                { field: `${activeDraft}_work`   as keyof typeof form, label: 'กำหนดทำ' },
                { field: `${activeDraft}_send`   as keyof typeof form, label: 'กำหนดส่ง' },
                { field: `${activeDraft}_review` as keyof typeof form, label: 'ลูกค้าตรวจ' },
              ].map(({ field, label }) => (
                <div key={field}>
                  <label style={{ ...labelStyle, color: draftColor }}>{label}</label>
                  <input
                    type="date"
                    className="pixel-input"
                    value={form[field] as string}
                    onChange={e => update(field, e.target.value)}
                    style={{ colorScheme: 'dark', fontSize: '8px', borderColor: `${draftColor}40` }}
                  />
                </div>
              ))}
            </div>
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
