import Nav from '@/components/Nav'
import JobForm from '../JobForm'

export default function NewJobPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#080e1c' }}>
      <Nav />
      <main className="flex-1 p-6">
        <div className="max-w-lg mx-auto">
          <div className="mb-6">
            <h1 style={{ fontSize: '12px', color: '#00ff41', letterSpacing: '0.1em', marginBottom: '4px' }}>
              ✚ NEW JOB
            </h1>
            <div style={{ fontSize: '7px', color: '#6b7db3' }}>CREATE A NEW PRODUCTION JOB</div>
          </div>
          <JobForm />
        </div>
      </main>
    </div>
  )
}
