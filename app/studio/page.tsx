import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'
import StudioScene from './StudioScene'
import { type TechnicianRecord, type Job } from '@/lib/types'

export default async function StudioPage() {
  const supabase = await createClient()

  const [{ data: techsData }, { data: jobsData }] = await Promise.all([
    supabase.from('technicians').select('*').order('sort_order'),
    supabase.from('jobs').select('*').neq('status', 'cancelled').neq('status', 'done'),
  ])

  const techs: TechnicianRecord[] = techsData || []
  const jobs: Job[] = jobsData || []

  return (
    <AppShell>
      <StudioScene techs={techs} jobs={jobs} />
    </AppShell>
  )
}
