import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/Nav'
import StaffManager from './StaffManager'
import { type TechnicianRecord } from '@/lib/types'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('technicians').select('*').order('sort_order')
  const technicians: TechnicianRecord[] = data || []

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#080e1c' }}>
      <Nav />
      <main className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 style={{ fontSize: '12px', color: '#ffd700', letterSpacing: '0.1em', marginBottom: '4px' }}>
              ⚙ SETTINGS
            </h1>
            <div style={{ fontSize: '7px', color: '#6b7db3' }}>MANAGE STUDIO TEAM</div>
          </div>
          <StaffManager initialTechnicians={technicians} />
        </div>
      </main>
    </div>
  )
}
