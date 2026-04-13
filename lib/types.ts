export type JobStatus = 'pending' | 'in-progress' | 'review' | 'done' | 'cancelled'

export type JobType =
  | 'Video Edit'
  | 'Motion Graphics'
  | 'Color Grade'
  | 'Sound Mix'
  | 'Thumbnail'
  | 'Short Form'
  | 'Live Stream'
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
  created_at: string
  updated_at: string
}

export const JOB_TYPES: JobType[] = [
  'Video Edit', 'Motion Graphics', 'Color Grade',
  'Sound Mix', 'Thumbnail', 'Short Form', 'Live Stream', 'Other'
]

export const JOB_STATUSES: { value: JobStatus; label: string }[] = [
  { value: 'pending', label: 'PENDING' },
  { value: 'in-progress', label: 'IN PROGRESS' },
  { value: 'review', label: 'REVIEW' },
  { value: 'done', label: 'DONE' },
  { value: 'cancelled', label: 'CANCELLED' },
]

export const STATUS_COLORS: Record<JobStatus, { color: string; bg: string; border: string }> = {
  pending:       { color: '#ffd700', bg: 'rgba(255,215,0,0.08)',    border: '#ffd700' },
  'in-progress': { color: '#00aaff', bg: 'rgba(0,170,255,0.08)',   border: '#00aaff' },
  review:        { color: '#ff6b35', bg: 'rgba(255,107,53,0.08)',  border: '#ff6b35' },
  done:          { color: '#00ff41', bg: 'rgba(0,255,65,0.08)',    border: '#00ff41' },
  cancelled:     { color: '#6b7db3', bg: 'rgba(107,125,179,0.08)', border: '#6b7db3' },
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
