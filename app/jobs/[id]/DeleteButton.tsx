'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeleteButton({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('jobs').delete().eq('id', jobId)
    router.push('/jobs')
    router.refresh()
  }

  if (confirm) {
    return (
      <div className="pixel-border" style={{ background: '#200008', padding: '12px', maxWidth: '200px' }}>
        <div style={{ fontSize: '7px', color: '#ff2d55', marginBottom: '8px' }}>
          DELETE: {jobTitle.slice(0, 20)}?
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="pixel-btn pixel-btn-red"
            style={{ fontSize: '6px', padding: '6px 10px' }}
          >
            {loading ? '...' : 'CONFIRM'}
          </button>
          <button
            onClick={() => setConfirm(false)}
            className="pixel-btn pixel-btn-gray"
            style={{ fontSize: '6px', padding: '6px 10px' }}
          >
            CANCEL
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="pixel-btn pixel-btn-red"
      style={{ fontSize: '7px', padding: '8px 14px' }}
    >
      🗑 DELETE
    </button>
  )
}
