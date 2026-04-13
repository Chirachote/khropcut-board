export type JobStatus = 'queued' | 'pending' | 'in-progress' | 'review' | 'done' | 'cancelled'

export type JobType =
  | 'Short Clip'
  | 'Motion Graphic'
  | 'Gen Pic'
  | 'Tutor'
  | 'Clip Pitching'
  | 'Other'

export interface TechnicianRecord {
  id: string
  name: string
  color: string
  avatar: string
  sort_order: number
  created_at: string
}

export interface Job {
  id: string
  title: string
  type: JobType
  technician: string
  deadline: string | null
  client: string
  status: JobStatus
  current_draft: number
  // Workflow: 8 stages
  d1_work:   string | null   // INT DRAFT 1       (Post Production)
  d1_send:   string | null   // SEND DRAFT 1      (Post Production)
  d1_review: string | null   // CLIENT FB D1      (Client)
  d2_send:   string | null   // SEND DRAFT 2      (Post Production)
  d2_review: string | null   // CLIENT FB D2      (Client)
  d3_send:   string | null   // SEND FINAL DRAFT  (Post Production)
  d3_review: string | null   // CLIENT APPROVE    (Client)
  post_date: string | null   // POST              (Client)
  // kept in DB for compatibility, not shown in UI
  d2_work:   string | null
  d3_work:   string | null
  created_at: string
  updated_at: string
}

export const JOB_TYPES: JobType[] = [
  'Short Clip', 'Motion Graphic', 'Gen Pic', 'Tutor', 'Clip Pitching', 'Other'
]

// Workflow stage definitions (matches the timeline spreadsheet)
export const WORKFLOW_STAGES = [
  { key: 'd1_work',   label: 'INT DRAFT 1',    labelTH: 'ตัด Draft 1',      party: 'production' as const, color: '#00aaff' },
  { key: 'd1_send',   label: 'SEND DRAFT 1',   labelTH: 'ส่ง Draft 1',      party: 'production' as const, color: '#00aaff' },
  { key: 'd1_review', label: 'CLIENT FB D1',   labelTH: 'FB ลูกค้า D1',     party: 'client'     as const, color: '#ff6b9d' },
  { key: 'd2_send',   label: 'SEND DRAFT 2',   labelTH: 'ส่ง Draft 2',      party: 'production' as const, color: '#b06bff' },
  { key: 'd2_review', label: 'CLIENT FB D2',   labelTH: 'FB ลูกค้า D2',     party: 'client'     as const, color: '#ff6b9d' },
  { key: 'd3_send',   label: 'SEND FINAL',     labelTH: 'ส่ง Final Draft',   party: 'production' as const, color: '#00ff41' },
  { key: 'd3_review', label: 'CLIENT APPROVE', labelTH: 'ลูกค้า Approve',   party: 'client'     as const, color: '#00ff41' },
  { key: 'post_date', label: 'POST',           labelTH: 'วันโพสต์',          party: 'client'     as const, color: '#ffd700' },
] as const

export type WorkflowKey = typeof WORKFLOW_STAGES[number]['key']

// Legacy (used in dashboard/inbox for draft badge)
export const DRAFT_LABELS = [
  { key: 'd1', label: 'DRAFT 1', color: '#00aaff' },
  { key: 'd2', label: 'DRAFT 2', color: '#b06bff' },
  { key: 'd3', label: 'FINAL',   color: '#00ff41' },
] as const

export const JOB_STATUSES: { value: JobStatus; label: string; labelTH: string }[] = [
  { value: 'queued',      label: 'RESERVED',    labelTH: 'จองคิว'    },
  { value: 'pending',     label: 'SCHEDULED',   labelTH: 'ลงคิวแล้ว' },
  { value: 'in-progress', label: 'IN PROGRESS', labelTH: 'กำลังทำ'   },
  { value: 'review',      label: 'REVIEW',      labelTH: 'รอลูกค้า'  },
  { value: 'done',        label: 'DONE',        labelTH: 'เสร็จแล้ว' },
  { value: 'cancelled',   label: 'CANCELLED',   labelTH: 'ยกเลิก'    },
]

export const STATUS_COLORS: Record<JobStatus, { color: string; bg: string; border: string }> = {
  queued:        { color: '#6b7db3', bg: 'rgba(107,125,179,0.08)', border: '#6b7db3' },
  pending:       { color: '#ffd700', bg: 'rgba(255,215,0,0.08)',   border: '#ffd700' },
  'in-progress': { color: '#00aaff', bg: 'rgba(0,170,255,0.08)',   border: '#00aaff' },
  review:        { color: '#ff6b35', bg: 'rgba(255,107,53,0.08)',  border: '#ff6b35' },
  done:          { color: '#00ff41', bg: 'rgba(0,255,65,0.08)',    border: '#00ff41' },
  cancelled:     { color: '#3a4050', bg: 'rgba(58,64,80,0.08)',    border: '#3a4050' },
}

// Preset palette for technician colors
export const COLOR_PRESETS = [
  '#ff6b9d', '#00aaff', '#00ff41', '#ffd700',
  '#ff6b35', '#b06bff', '#ff2d55', '#00ffd4',
]

// Helper: build a name→color lookup from TechnicianRecord[]
export function techColorMap(techs: TechnicianRecord[]): Record<string, string> {
  return Object.fromEntries(techs.map(t => [t.name, t.color]))
}

// Helper: get the earliest upcoming workflow date for a job
export function nextWorkflowDate(job: Job): { date: string; stage: typeof WORKFLOW_STAGES[number] } | null {
  const today = new Date().toISOString().slice(0, 10)
  for (const stage of WORKFLOW_STAGES) {
    const val = job[stage.key as keyof Job] as string | null
    if (val && val >= today) return { date: val, stage }
  }
  return null
}
