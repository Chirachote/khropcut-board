import AppShell from '@/components/AppShell'
import Link from 'next/link'

export default function DealsPage() {
  return (
    <AppShell>
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '24px', paddingBottom: '18px', borderBottom: '1px solid rgba(0,170,255,0.15)' }}>
          <div style={{ fontSize: '13px', color: '#00aaff', letterSpacing: '0.1em', marginBottom: '4px' }}>
            ◇ DEAL ROOM
          </div>
          <div style={{ fontSize: '6px', color: '#3a4a6b', letterSpacing: '0.2em' }}>
            CLIENT DEALS · PROPOSALS · CONTRACTS
          </div>
        </div>

        <div style={{
          background: '#0a1022',
          border: '1px solid rgba(0,170,255,0.15)',
          padding: '60px 24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '16px', opacity: 0.3 }}>◇</div>
          <div style={{ fontSize: '10px', color: '#3a4a6b', letterSpacing: '0.15em', marginBottom: '8px' }}>
            DEAL ROOM — COMING SOON
          </div>
          <div style={{ fontSize: '7px', color: '#2a3456', marginBottom: '24px' }}>
            Client proposals, pricing, and contracts will appear here.
          </div>
          <Link href="/jobs/new" className="pixel-btn pixel-btn-blue" style={{ fontSize: '7px' }}>
            + NEW JOB IN THE MEANTIME
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
