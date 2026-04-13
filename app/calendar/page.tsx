'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  WORKFLOW_STAGES, techColorMap,
  type Job, type TechnicianRecord,
} from '@/lib/types'

const DAYS   = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTHS = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER']

type CalEvent = {
  job: Job
  type: 'stage' | 'deadline'
  stage?: typeof WORKFLOW_STAGES[number]
  date: string
}

export default function CalendarPage() {
  const [jobs, setJobs]               = useState<Job[]>([])
  const [technicians, setTechnicians] = useState<TechnicianRecord[]>([])
  const [year,  setYear]              = useState(new Date().getFullYear())
  const [month, setMonth]             = useState(new Date().getMonth())
  const [selected, setSelected]       = useState<string | null>(null)
  const [techFilter, setTechFilter]   = useState('')

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('jobs').select('*').neq('status', 'cancelled').neq('status', 'done'),
      supabase.from('technicians').select('*').order('sort_order'),
    ]).then(([{ data: j }, { data: t }]) => {
      if (j) setJobs(j)
      if (t) setTechnicians(t)
    })
  }, [])

  const colorMap = techColorMap(technicians)
  const filtered = techFilter ? jobs.filter(j => j.technician === techFilter) : jobs

  // Build events map: date → CalEvent[]
  const eventsByDate: Record<string, CalEvent[]> = {}
  for (const job of filtered) {
    // Workflow stage dates
    for (const stage of WORKFLOW_STAGES) {
      const val = job[stage.key as keyof Job] as string | null
      if (!val) continue
      const d = val.slice(0, 10)
      const [y, m] = d.split('-').map(Number)
      if (y === year && m === month + 1) {
        if (!eventsByDate[d]) eventsByDate[d] = []
        eventsByDate[d].push({ job, type: 'stage', stage, date: d })
      }
    }
    // Deadline
    if (job.deadline) {
      const d = job.deadline.slice(0, 10)
      const [y, m] = d.split('-').map(Number)
      if (y === year && m === month + 1) {
        if (!eventsByDate[d]) eventsByDate[d] = []
        eventsByDate[d].push({ job, type: 'deadline', date: d })
      }
    }
  }

  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const now         = new Date()
  const todayStr    = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`

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

  const selectedEvents = selected ? (eventsByDate[selected] || []) : []
  // Group selected events by job
  const byJob: Record<string, CalEvent[]> = {}
  for (const ev of selectedEvents) {
    if (!byJob[ev.job.id]) byJob[ev.job.id] = []
    byJob[ev.job.id].push(ev)
  }

  return (
    <AppShell>
      <div style={{ padding: '24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#00aaff', letterSpacing: '0.1em', marginBottom: '4px' }}>◫ CALENDAR</div>
            <div style={{ fontSize: '6px', color: '#3a4a6b', letterSpacing: '0.2em' }}>PRODUCTION SCHEDULE · ALL WORKFLOW STAGES</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <select
              value={techFilter}
              onChange={e => { setTechFilter(e.target.value); setSelected(null) }}
              className="pixel-select"
              style={{ fontSize: '7px', padding: '6px 10px' }}
            >
              <option value="">ALL STAFF</option>
              {technicians.map(t => <option key={t.id} value={t.name}>{t.avatar} {t.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          {/* ── Calendar ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Month nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <button onClick={prevMonth} className="pixel-btn pixel-btn-gray" style={{ fontSize: '9px', padding: '6px 12px' }}>◀</button>
              <div style={{ fontSize: '11px', color: '#e0e8ff', letterSpacing: '0.1em' }}>
                {MONTHS[month]} {year}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); setSelected(null) }}
                  className="pixel-btn pixel-btn-blue"
                  style={{ fontSize: '6px', padding: '6px 10px' }}
                >TODAY</button>
                <button onClick={nextMonth} className="pixel-btn pixel-btn-gray" style={{ fontSize: '9px', padding: '6px 12px' }}>▶</button>
              </div>
            </div>

            {/* Grid */}
            <div style={{ border: '1px solid rgba(0,170,255,0.15)', background: '#0a1022' }}>
              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid rgba(0,170,255,0.15)' }}>
                {DAYS.map(d => (
                  <div key={d} style={{ fontSize: '6px', color: '#3a4a6b', padding: '8px 6px', textAlign: 'center', letterSpacing: '0.1em' }}>{d}</div>
                ))}
              </div>

              {/* Cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`e${i}`} style={{ minHeight: '90px', borderRight: '1px solid rgba(0,170,255,0.06)', borderBottom: '1px solid rgba(0,170,255,0.06)' }} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day     = i + 1
                  const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                  const evs     = eventsByDate[dateStr] || []
                  const isToday    = dateStr === todayStr
                  const isSelected = dateStr === selected
                  const hasPastDeadline = evs.some(e => e.type === 'deadline' && dateStr < todayStr)

                  return (
                    <div
                      key={day}
                      onClick={() => evs.length > 0 && setSelected(isSelected ? null : dateStr)}
                      style={{
                        padding: '5px',
                        minHeight: '90px',
                        borderRight: '1px solid rgba(0,170,255,0.06)',
                        borderBottom: '1px solid rgba(0,170,255,0.06)',
                        cursor: evs.length > 0 ? 'pointer' : 'default',
                        background: isSelected
                          ? 'rgba(0,170,255,0.1)'
                          : isToday
                          ? 'rgba(0,255,65,0.04)'
                          : hasPastDeadline
                          ? 'rgba(255,45,85,0.03)'
                          : 'transparent',
                      }}
                    >
                      {/* Day number */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '4px' }}>
                        <span style={{
                          fontSize: '9px',
                          color: isToday ? '#00ff41' : evs.length > 0 ? '#e0e8ff' : '#3a4a6b',
                          fontWeight: isToday ? 'bold' : 'normal',
                        }}>{day}</span>
                        {isToday && <span style={{ fontSize: '5px', color: '#00ff41', border: '1px solid #00ff4160', padding: '1px 2px' }}>NOW</span>}
                        {evs.length > 0 && (
                          <span style={{ marginLeft: 'auto', fontSize: '5px', color: isSelected ? '#00aaff' : '#3a4a6b' }}>
                            {evs.length}
                          </span>
                        )}
                      </div>

                      {/* Event chips */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {evs.slice(0, 3).map((ev, idx) => {
                          const chipColor = ev.type === 'deadline'
                            ? '#ff6b35'
                            : ev.stage!.party === 'production' ? '#00aaff' : '#ff6b9d'
                          return (
                            <div key={`${ev.job.id}-${idx}`} style={{
                              fontSize: '5px',
                              background: `${chipColor}18`,
                              borderLeft: `2px solid ${chipColor}`,
                              padding: '2px 4px',
                              color: chipColor,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              letterSpacing: '0.02em',
                            }}>
                              {ev.type === 'deadline'
                                ? `⏱ ${ev.job.title}`
                                : `${ev.stage!.label} · ${ev.job.title}`}
                            </div>
                          )
                        })}
                        {evs.length > 3 && (
                          <div style={{ fontSize: '5px', color: '#3a4a6b', paddingLeft: '4px' }}>+{evs.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
              {[
                { color: '#00aaff', label: 'POST PRODUCTION stage' },
                { color: '#ff6b9d', label: 'CLIENT stage' },
                { color: '#ff6b35', label: 'DEADLINE' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', background: l.color, opacity: 0.8 }} />
                  <span style={{ fontSize: '6px', color: '#3a4a6b' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Side Panel ── */}
          <div style={{ width: '260px', flexShrink: 0 }}>

            {/* Selected day panel */}
            <div style={{
              background: '#0a1022',
              border: '1px solid rgba(0,170,255,0.2)',
              marginBottom: '16px',
              minHeight: '200px',
            }}>
              {selected ? (
                <>
                  <div style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid rgba(0,170,255,0.12)',
                    fontSize: '8px', color: '#00aaff', letterSpacing: '0.08em',
                  }}>
                    ◫ {formatDisplayDate(selected, MONTHS)}
                  </div>
                  <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {Object.values(byJob).map(evList => {
                      const job = evList[0].job
                      const tc  = colorMap[job.technician] || '#6b7db3'
                      return (
                        <Link key={job.id} href={`/jobs/${job.id}`} style={{ textDecoration: 'none' }}>
                          <div style={{
                            background: '#07101f',
                            border: '1px solid rgba(0,170,255,0.1)',
                            padding: '9px 11px',
                          }}>
                            <div style={{ fontSize: '8px', color: '#e0e8ff', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {job.title}
                            </div>
                            <div style={{ fontSize: '6px', color: tc, marginBottom: '6px' }}>
                              {job.technician} · {job.client}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              {evList.map((ev, idx) => {
                                const chipColor = ev.type === 'deadline'
                                  ? '#ff6b35'
                                  : ev.stage!.party === 'production' ? '#00aaff' : '#ff6b9d'
                                return (
                                  <div key={idx} style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    fontSize: '6px',
                                    color: chipColor,
                                  }}>
                                    <div style={{ width: '5px', height: '5px', background: chipColor, flexShrink: 0 }} />
                                    <span style={{ letterSpacing: '0.06em' }}>
                                      {ev.type === 'deadline'
                                        ? 'DEADLINE'
                                        : ev.stage!.label}
                                    </span>
                                    {ev.type === 'stage' && (
                                      <span style={{ color: '#3a4a6b', fontSize: '5px' }}>
                                        [{ev.stage!.party === 'production' ? 'POST PRO' : 'CLIENT'}]
                                      </span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '7px', color: '#2a3456' }}>Click a date to see events</div>
                </div>
              )}
            </div>

            {/* Upcoming events (next 7 days) */}
            <div style={{ fontSize: '7px', color: '#3a4a6b', letterSpacing: '0.12em', marginBottom: '10px' }}>
              NEXT 7 DAYS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {(() => {
                const upcoming: CalEvent[] = []
                for (let offset = 0; offset <= 7; offset++) {
                  const d = new Date(now)
                  d.setDate(d.getDate() + offset)
                  const ds = d.toISOString().slice(0, 10)
                  const evs = (eventsByDate[ds] || [])
                  for (const ev of evs) upcoming.push(ev)
                }
                if (upcoming.length === 0) return (
                  <div style={{ fontSize: '6px', color: '#2a3456', textAlign: 'center', padding: '20px 0' }}>
                    — ไม่มีกำหนดการใน 7 วัน —
                  </div>
                )
                return upcoming.slice(0, 10).map((ev, i) => {
                  const chipColor = ev.type === 'deadline'
                    ? '#ff6b35'
                    : ev.stage!.party === 'production' ? '#00aaff' : '#ff6b9d'
                  const tc = colorMap[ev.job.technician] || '#6b7db3'
                  const isToday2 = ev.date === todayStr
                  return (
                    <Link key={i} href={`/jobs/${ev.job.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        background: '#0a1022',
                        borderLeft: `2px solid ${chipColor}`,
                        padding: '6px 10px',
                        display: 'flex', alignItems: 'center', gap: '8px',
                      }}>
                        <div style={{ flexShrink: 0, textAlign: 'center', minWidth: '32px' }}>
                          <div style={{ fontSize: '8px', color: isToday2 ? '#00ff41' : '#e0e8ff' }}>
                            {new Date(ev.date).getDate()}
                          </div>
                          <div style={{ fontSize: '5px', color: '#3a4a6b' }}>
                            {DAYS[new Date(ev.date).getDay()]}
                          </div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '5px', color: chipColor, letterSpacing: '0.06em', marginBottom: '2px' }}>
                            {ev.type === 'deadline' ? '⏱ DEADLINE' : ev.stage!.label}
                          </div>
                          <div style={{ fontSize: '6px', color: '#e0e8ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ev.job.title}
                          </div>
                          <div style={{ fontSize: '5px', color: tc }}>{ev.job.technician}</div>
                        </div>
                      </div>
                    </Link>
                  )
                })
              })()}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function formatDisplayDate(str: string, months: string[]) {
  const [y, m, d] = str.split('-')
  return `${d} ${months[parseInt(m) - 1]} ${y}`
}
