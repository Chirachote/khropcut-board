'use client'

import { useEffect, useState } from 'react'

export default function LiveClock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const pad = (n: number) => String(n).padStart(2, '0')
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  const days = ['SUN','MON','TUE','WED','THU','FRI','SAT']
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
  const dateStr = `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`

  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: '14px', color: '#00aaff', letterSpacing: '0.08em', fontVariantNumeric: 'tabular-nums' }}>
        {timeStr}
      </div>
      <div style={{ fontSize: '6px', color: '#3a4a6b', letterSpacing: '0.12em', marginTop: '2px' }}>
        {dateStr}
      </div>
    </div>
  )
}
