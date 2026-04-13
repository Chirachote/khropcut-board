import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'
import JobForm from '../JobForm'
import { type TechnicianRecord } from '@/lib/types'

export default async function NewJobPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('technicians').select('*').order('sort_order')
  const technicians: TechnicianRecord[] = data || []

  return (
    <AppShell>
      <div className="p-6">
        <div className="max-w-lg mx-auto">
          <div className="mb-6">
            <h1 style={{ fontSize: '12px', color: '#00ff41', letterSpacing: '0.1em', marginBottom: '4px' }}>
              ✚ NEW JOB
            </h1>
            <div style={{ fontSize: '7px', color: '#6b7db3' }}>CREATE A NEW PRODUCTION JOB</div>
          </div>
          <JobForm technicians={technicians} />
        </div>
      </div>
    </AppShell>
  )
}
