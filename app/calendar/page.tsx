'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { STATUS_COLORS, techColorMap, type Job, type TechnicianRecord } from '@/lib/types'

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTHS = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER']

export default function CalendarPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [technicians, setTechnicians] = useState<TechnicianRecord[]>([])
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('jobs').select('*').neq('status', 'cancelled'),
      supabase.from('technicians').select('*').order('sort_order'),
    ]).then(([{ data: jobsData }, { data: techsData }]) => {
      if (jobsData) setJobs(jobsData)
      if (techsData) setTechnicians(techsData)
    })
  }, [])

  const colorMap = techColorMap(technicians)

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  // Group jobs by deadline date
  const jobsByDate: Record<string, Job[]> = {}
  for (const job of jobs) {
    if (!job.deadline) continue
    const d = job.deadline.slice(0, 10)
    const [y, m] = d.split('-').map(Number)
    if (y === year && m === month + 1) {
      if (!jobsByDate[d]) jobsByDate[d] = []
      jobsByDate[d].push(job)
    }
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
    setSelected(null)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
    setSelected(null)
  }

  const selectedJobs = selected ? (jobsByDate[selected] || []) : []

  return (
    <AppShell>
      <div className="p-6">
        <div className="flex gap-6">
          {/* Calendar */}
          <div className="flex-1">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-5">
              <h1 style={{ fontSize: '12px', color: '#00ff41', letterSpacing: '0.1em' }}>
                📅 CALENDAR
              </h1>
              <div className="flex items-center gap-3">
                <button onClick={prevMonth} className="pixel-btn pixel-btn-gray" style={{ fontSize: '10px', padding: '6px 12px' }}>◀</button>
                <div style={{ fontSize: '10px', color: '#e0e8ff', minWidth: '200px', textAlign: 'center', letterSpacing: '0.08em' }}>
                  {MONTHS[month]} {year}
                </div>
                <button onClick={nextMonth} className="pixel-btn pixel-btn-gray" style={{ fontSize: '10px', padding: '6px 12px' }}>▶</button>
              </div>
              <button
                onClick={() => { setYear(new Date().getFullYear()); setMonth(new Date().getMonth()) }}
                className="pixel-btn pixel-btn-blue"
                style={{ fontSize: '7px', padding: '7px 12px' }}
              >
                TODAY
              </button>
            </div>

            {/* Calendar grid */}
            <div className="pixel-border" style={{ background: '#0a1022' }}>
              {/* Day headers */}
              <div className="grid grid-cols-7" style={{ borderBottom: '2px solid #2d3a6b' }}>
                {DAYS.map(d => (
                  <div key={d} style={{ fontSize: '7px', color: '#6b7db3', padding: '8px', textAlign: 'center', letterSpacing: '0.1em' }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Cells */}
              <div className="grid grid-cols-7">
                {/* Empty cells */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`e${i}`} style={{ padding: '8px', minHeight: '80px', borderRight: '1px solid #1a2040', borderBottom: '1px solid #1a2040' }} />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                  const dayJobs = jobsByDate[dateStr] || []
                  const isToday = dateStr === todayStr
                  const isSelected = dateStr === selected

                  return (
                    <div
                      key={day}
                      onClick={() => setSelected(isSelected ? null : dateStr)}
                      style={{
                        padding: '6px',
                        minHeight: '80px',
                        borderRight: '1px solid #1a2040',
                        borderBottom: '1px solid #1a2040',
                        cursor: dayJobs.length > 0 ? 'pointer' : 'default',
                        background: isSelected ? 'rgba(0,170,255,0.08)' : isToday ? 'rgba(0,255,65,0.04)' : 'transparent',
                        transition: 'background 0.1s',
                      }}
                    >
                      {/* Day number */}
                      <div style={{
                        fontSize: '9px',
                        color: isToday ? '#00ff41' : '#e0e8ff',
                        marginBottom: '4px',
                        fontWeight: isToday ? 'bold' : 'normal',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        {day}
                        {isToday && <span style={{ fontSize: '6px', color: '#00ff41', border: '1px solid #00ff41', padding: '1px 3px' }}>NOW</span>}
                      </div>

                      {/* Job dots */}
                      <div className="flex flex-col gap-1">
                        {dayJobs.slice(0, 3).map(job => {
                          const sc = STATUS_COLORS[job.status]
                          return (
                            <div
                              key={job.id}
                              style={{
                                fontSize: '6px',
                                background: sc.bg,
                                borderLeft: `2px solid ${sc.border}`,
                                padding: '2px 4px',
                                color: sc.color,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {job.title}
                            </div>
                          )
                        })}
                        {dayJobs.length > 3 && (
                          <div style={{ fontSize: '5px', color: '#6b7db3' }}>+{dayJobs.length - 3}</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Side panel — selected day */}
          <div style={{ width: '260px' }}>
            <div style={{ fontSize: '8px', color: '#6b7db3', letterSpacing: '0.1em', marginBottom: '12px' }}>
              DEADLINE DETAILS
            </div>

            {selected ? (
              <div className="pixel-border" style={{ background: '#0a1022', padding: '16px' }}>
                <div style={{ fontSize: '9px', color: '#00aaff', marginBottom: '12px', letterSpacing: '0.08em' }}>
                  📅 {formatDisplayDate(selected)}
                </div>
                {selectedJobs.length === 0 ? (
                  <div style={{ fontSize: '7px', color: '#6b7db3' }}>No deadlines</div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {selectedJobs.map(job => {
                      const sc = STATUS_COLORS[job.status]
                      const tc = colorMap[job.technician] || '#6b7db3'
                      return (
                        <Link key={job.id} href={`/jobs/${job.id}`} style={{ textDecoration: 'none' }}>
                          <div
                            className="pixel-border"
                            style={{ background: sc.bg, padding: '10px', cursor: 'pointer' }}
                          >
                            <div style={{ fontSize: '8px', color: '#e0e8ff', marginBottom: '4px' }}>{job.title}</div>
                            <div style={{ fontSize: '7px', color: '#6b7db3', marginBottom: '6px' }}>{job.client}</div>
                            <div className="flex items-center justify-between">
                              <span className="status-badge" style={{ color: sc.color, borderColor: sc.border, fontSize: '6px' }}>
                                {job.status.toUpperCase()}
                              </span>
                              <span style={{ fontSize: '7px', color: tc }}>{job.technician}</span>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="pixel-border" style={{ background: '#0a1022', padding: '16px' }}>
                <div style={{ fontSize: '7px', color: '#2d3a6b', textAlign: 'center', paddingTop: '20px' }}>
                  Click a date to see deadlines
                </div>
              </div>
            )}

            {/* Upcoming deadlines */}
            <div style={{ fontSize: '8px', color: '#6b7db3', letterSpacing: '0.1em', marginTop: '20px', marginBottom: '10px' }}>
              UPCOMING
            </div>
            <div className="flex flex-col gap-2">
              {jobs
                .filter(j => j.deadline && new Date(j.deadline) >= new Date() && j.status !== 'done')
                .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
                .slice(0, 6)
                .map(job => {
                  const sc = STATUS_COLORS[job.status]
                  const tc = colorMap[job.technician] || '#6b7db3'
                  return (
                    <Link key={job.id} href={`/jobs/${job.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ background: '#0a1022', border: `1px solid #1a2040`, padding: '8px 10px', cursor: 'pointer' }}>
                        <div className="flex justify-between items-start">
                          <div style={{ fontSize: '7px', color: '#e0e8ff', flex: 1, marginRight: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {job.title}
                          </div>
                          <div style={{ fontSize: '7px', color: sc.color, whiteSpace: 'nowrap' }}>
                            {formatShort(job.deadline!)}
                          </div>
                        </div>
                        <div style={{ fontSize: '6px', color: tc, marginTop: '2px' }}>{job.technician}</div>
                      </div>
                    </Link>
                  )
                })}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function formatDisplayDate(str: string) {
  const [y, m, d] = str.split('-')
  return `${d} ${MONTHS[parseInt(m) - 1]} ${y}`
}

function formatShort(str: string) {
  const d = new Date(str)
  return `${d.getDate()}/${d.getMonth() + 1}`
}
