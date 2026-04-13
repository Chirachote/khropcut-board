'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { COLOR_PRESETS, type TechnicianRecord } from '@/lib/types'

const AVATAR_PRESETS = ['👩‍💻','👨‍🎬','👩‍🎨','🎧','🎬','🖥️','🎞️','🎤','🎵','✂️','🖱️','💡','🎯','⚡','🔥','💎']

interface Props {
  initialTechnicians: TechnicianRecord[]
}

export default function StaffManager({ initialTechnicians }: Props) {
  const router = useRouter()
  const [techs, setTechs]       = useState<TechnicianRecord[]>(initialTechnicians)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd, setShowAdd]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError]       = useState('')

  // Form state for add/edit
  const [form, setForm] = useState({ name: '', color: COLOR_PRESETS[0], avatar: AVATAR_PRESETS[0] })

  function startEdit(tech: TechnicianRecord) {
    setEditingId(tech.id)
    setForm({ name: tech.name, color: tech.color, avatar: tech.avatar })
    setShowAdd(false)
    setError('')
  }

  function startAdd() {
    setShowAdd(true)
    setEditingId(null)
    setForm({ name: '', color: COLOR_PRESETS[techs.length % COLOR_PRESETS.length], avatar: AVATAR_PRESETS[techs.length % AVATAR_PRESETS.length] })
    setError('')
  }

  function cancelForm() {
    setShowAdd(false)
    setEditingId(null)
    setError('')
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    const supabase = createClient()

    if (editingId) {
      const { error } = await supabase
        .from('technicians')
        .update({ name: form.name.trim(), color: form.color, avatar: form.avatar })
        .eq('id', editingId)

      if (error) { setError(error.message); setSaving(false); return }

      setTechs(ts => ts.map(t => t.id === editingId
        ? { ...t, name: form.name.trim(), color: form.color, avatar: form.avatar }
        : t
      ))
      setEditingId(null)
    } else {
      const maxOrder = techs.reduce((m, t) => Math.max(m, t.sort_order), 0)
      const { data, error } = await supabase
        .from('technicians')
        .insert({ name: form.name.trim(), color: form.color, avatar: form.avatar, sort_order: maxOrder + 1 })
        .select()
        .single()

      if (error) { setError(error.message); setSaving(false); return }
      setTechs(ts => [...ts, data as TechnicianRecord])
      setShowAdd(false)
    }

    setSaving(false)
    router.refresh()
  }

  async function handleDelete(id: string, name: string) {
    setDeleting(id)
    const supabase = createClient()
    await supabase.from('technicians').delete().eq('id', id)
    setTechs(ts => ts.filter(t => t.id !== id))
    setDeleting(null)
    if (editingId === id) setEditingId(null)
    router.refresh()
  }

  async function moveUp(index: number) {
    if (index === 0) return
    const updated = [...techs]
    const a = updated[index - 1], b = updated[index]
    updated[index - 1] = { ...b, sort_order: a.sort_order }
    updated[index]     = { ...a, sort_order: b.sort_order }
    setTechs(updated)
    const supabase = createClient()
    await Promise.all([
      supabase.from('technicians').update({ sort_order: a.sort_order }).eq('id', b.id),
      supabase.from('technicians').update({ sort_order: b.sort_order }).eq('id', a.id),
    ])
    router.refresh()
  }

  async function moveDown(index: number) {
    if (index === techs.length - 1) return
    const updated = [...techs]
    const a = updated[index], b = updated[index + 1]
    updated[index]     = { ...b, sort_order: a.sort_order }
    updated[index + 1] = { ...a, sort_order: b.sort_order }
    setTechs(updated)
    const supabase = createClient()
    await Promise.all([
      supabase.from('technicians').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('technicians').update({ sort_order: a.sort_order }).eq('id', b.id),
    ])
    router.refresh()
  }

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div style={{ fontSize: '9px', color: '#ffd700', letterSpacing: '0.1em' }}>
          👥 TEAM MEMBERS ({techs.length})
        </div>
        <button onClick={startAdd} className="pixel-btn pixel-btn-green" style={{ fontSize: '7px', padding: '7px 14px' }}>
          + ADD MEMBER
        </button>
      </div>

      {/* Staff list */}
      <div className="pixel-border" style={{ background: '#0a1022', marginBottom: '20px' }}>
        {techs.length === 0 ? (
          <div style={{ fontSize: '8px', color: '#6b7db3', textAlign: 'center', padding: '40px' }}>
            No team members yet. Add one above!
          </div>
        ) : (
          techs.map((tech, i) => (
            <div key={tech.id}>
              <div
                className="flex items-center justify-between"
                style={{
                  padding: '12px 16px',
                  borderBottom: i < techs.length - 1 ? '1px solid #1a2040' : 'none',
                  background: editingId === tech.id ? 'rgba(0,170,255,0.06)' : 'transparent',
                }}
              >
                {/* Left: avatar + info */}
                <div className="flex items-center gap-3">
                  {/* Color swatch */}
                  <div style={{
                    width: '8px', height: '36px',
                    background: tech.color,
                    boxShadow: `0 0 6px ${tech.color}60`,
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: '20px' }}>{tech.avatar}</span>
                  <div>
                    <div style={{ fontSize: '9px', color: tech.color, letterSpacing: '0.05em' }}>{tech.name}</div>
                    <div style={{ fontSize: '6px', color: '#2d3a6b', marginTop: '2px', letterSpacing: '0.1em' }}>
                      {tech.color.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2">
                  {/* Reorder */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveUp(i)}
                      disabled={i === 0}
                      style={{
                        fontSize: '8px', background: 'transparent',
                        border: 'none', color: i === 0 ? '#1a2040' : '#6b7db3',
                        cursor: i === 0 ? 'default' : 'pointer', lineHeight: 1,
                        padding: '1px 4px',
                      }}
                    >▲</button>
                    <button
                      onClick={() => moveDown(i)}
                      disabled={i === techs.length - 1}
                      style={{
                        fontSize: '8px', background: 'transparent',
                        border: 'none', color: i === techs.length - 1 ? '#1a2040' : '#6b7db3',
                        cursor: i === techs.length - 1 ? 'default' : 'pointer', lineHeight: 1,
                        padding: '1px 4px',
                      }}
                    >▼</button>
                  </div>

                  <button
                    onClick={() => startEdit(tech)}
                    className="pixel-btn pixel-btn-blue"
                    style={{ fontSize: '6px', padding: '5px 9px' }}
                  >
                    EDIT
                  </button>
                  <button
                    onClick={() => handleDelete(tech.id, tech.name)}
                    disabled={deleting === tech.id}
                    className="pixel-btn pixel-btn-red"
                    style={{ fontSize: '6px', padding: '5px 9px' }}
                  >
                    {deleting === tech.id ? '...' : 'DEL'}
                  </button>
                </div>
              </div>

              {/* Inline edit form */}
              {editingId === tech.id && (
                <InlineForm
                  form={form}
                  setForm={setForm}
                  onSave={handleSave}
                  onCancel={cancelForm}
                  saving={saving}
                  error={error}
                  mode="edit"
                />
              )}
            </div>
          ))
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="pixel-border" style={{ background: '#0a1022', marginBottom: '20px' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a2040', fontSize: '8px', color: '#00ff41' }}>
            ✚ NEW TEAM MEMBER
          </div>
          <InlineForm
            form={form}
            setForm={setForm}
            onSave={handleSave}
            onCancel={cancelForm}
            saving={saving}
            error={error}
            mode="add"
          />
        </div>
      )}

      {/* Info box */}
      <div className="pixel-border" style={{ background: '#080e1c', padding: '14px 16px' }}>
        <div style={{ fontSize: '7px', color: '#6b7db3', lineHeight: 2 }}>
          <div style={{ color: '#ffd700', marginBottom: '6px' }}>ℹ NOTE</div>
          <div>• ลบช่างออกจะไม่ลบงานที่มีอยู่แล้ว งานยังคงชื่อช่างเดิม</div>
          <div>• เปลี่ยนชื่อช่างจะไม่อัปเดตงานเก่าโดยอัตโนมัติ</div>
          <div>• ใช้ลูกศร ▲▼ เรียงลำดับช่างบน Studio Map</div>
        </div>
      </div>
    </div>
  )
}

// ─── Reusable inline form ───────────────────────────────────────────────────
function InlineForm({
  form, setForm, onSave, onCancel, saving, error, mode
}: {
  form: { name: string; color: string; avatar: string }
  setForm: (fn: (f: typeof form) => typeof form) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  error: string
  mode: 'add' | 'edit'
}) {
  return (
    <div style={{ padding: '16px', background: '#07101f' }}>
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Name */}
        <div>
          <label style={labelStyle}>NAME *</label>
          <input
            className="pixel-input"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. นุ่น"
            maxLength={20}
          />
        </div>

        {/* Avatar picker */}
        <div>
          <label style={labelStyle}>AVATAR</label>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '22px' }}>{form.avatar}</span>
            <select
              className="pixel-select flex-1"
              value={form.avatar}
              onChange={e => setForm(f => ({ ...f, avatar: e.target.value }))}
            >
              {AVATAR_PRESETS.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Color picker */}
      <div className="mb-4">
        <label style={labelStyle}>COLOR</label>
        <div className="flex gap-2 flex-wrap">
          {COLOR_PRESETS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setForm(f => ({ ...f, color: c }))}
              style={{
                width: '28px',
                height: '28px',
                background: c,
                border: form.color === c ? `3px solid #fff` : `2px solid ${c}40`,
                cursor: 'pointer',
                boxShadow: form.color === c ? `0 0 8px ${c}` : 'none',
                flexShrink: 0,
              }}
            />
          ))}
          {/* Custom hex input */}
          <div className="flex items-center gap-1" style={{ flex: 1, minWidth: '120px' }}>
            <div style={{ width: '28px', height: '28px', background: form.color, border: '2px solid #2d3a6b', flexShrink: 0 }} />
            <input
              className="pixel-input"
              value={form.color}
              onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
              placeholder="#ff6b9d"
              style={{ fontSize: '8px', padding: '5px 8px' }}
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="flex items-center gap-2 mb-4" style={{ padding: '8px 12px', background: '#0a1022', border: `1px solid ${form.color}40` }}>
        <span style={{ fontSize: '16px' }}>{form.avatar}</span>
        <span style={{ fontSize: '9px', color: form.color }}>{form.name || 'Preview'}</span>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: form.color, boxShadow: `0 0 6px ${form.color}`, marginLeft: 'auto' }} />
      </div>

      {error && (
        <div style={{ fontSize: '7px', color: '#ff2d55', border: '1px solid #ff2d55', padding: '6px 10px', background: 'rgba(255,45,85,0.08)', marginBottom: '10px' }}>
          ⚠ {error.toUpperCase()}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onSave}
          disabled={saving}
          className="pixel-btn pixel-btn-green"
          style={{ fontSize: '7px', padding: '9px 16px' }}
        >
          {saving ? 'SAVING...' : mode === 'add' ? '[ ADD MEMBER ]' : '[ SAVE CHANGES ]'}
        </button>
        <button
          onClick={onCancel}
          className="pixel-btn pixel-btn-gray"
          style={{ fontSize: '7px', padding: '9px 14px' }}
        >
          CANCEL
        </button>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: '7px', color: '#6b7db3',
  letterSpacing: '0.1em', display: 'block', marginBottom: '6px',
}
