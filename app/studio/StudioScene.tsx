'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type TechnicianRecord, type Job } from '@/lib/types'

// ── Isometric grid constants ────────────────────────────────────────────────
const TW = 72
const TH = 36
const OX = 360
const OY = 120

function isoX(c: number, r: number) {
  return OX + (c - r) * (TW / 2)
}
function isoY(c: number, r: number) {
  return OY + (c + r) * (TH / 2)
}
function iso(c: number, r: number, h: number = 0) {
  return { x: isoX(c, r), y: isoY(c, r) - h }
}
function pts(points: { x: number; y: number }[]) {
  return points.map(p => `${p.x},${p.y}`).join(' ')
}

// ── Workstation definitions ──────────────────────────────────────────────────
const WORKSTATIONS = [
  { id: 7, label: 'CEO',  c: 3.2, r: 0.2, w: 1.6, d: 0.8, h: 44, isCeo: true  },
  { id: 1, label: 'WS 1', c: 0.2, r: 1.0, w: 1.6, d: 0.8, h: 30 },
  { id: 2, label: 'WS 2', c: 0.2, r: 2.6, w: 1.6, d: 0.8, h: 30 },
  { id: 3, label: 'WS 3', c: 2.8, r: 1.6, w: 1.6, d: 0.8, h: 30 },
  { id: 4, label: 'WS 4', c: 2.8, r: 3.2, w: 1.6, d: 0.8, h: 30 },
  { id: 5, label: 'WS 5', c: 5.4, r: 1.0, w: 1.6, d: 0.8, h: 30 },
  { id: 6, label: 'WS 6', c: 5.4, r: 2.6, w: 1.6, d: 0.8, h: 30 },
] as const

// ── Character component (inline SVG) ─────────────────────────────────────────
function Character({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx={0} cy={4} rx={7} ry={3} fill="rgba(0,0,0,0.25)" />
      <rect x={-3} y={2} width={2} height={7} fill="#1a2040" />
      <rect x={1} y={2} width={2} height={7} fill="#1a2040" />
      <rect x={-5} y={-10} width={10} height={13} fill={color} rx={1} />
      <circle cx={0} cy={-16} r={6} fill="#f5c88a" />
      <rect x={-6} y={-22} width={12} height={7} fill="#5a3010" rx={2} />
      <rect x={-2} y={-18} width={2} height={2} fill="#222" />
      <rect x={1} y={-18} width={2} height={2} fill="#222" />
    </g>
  )
}

// ── Isometric box faces ───────────────────────────────────────────────────────
function topPts(c: number, r: number, w: number, d: number, h: number) {
  return [iso(c, r, h), iso(c + w, r, h), iso(c + w, r + d, h), iso(c, r + d, h)]
}
function rightPts(c: number, r: number, w: number, d: number, h: number) {
  return [iso(c + w, r, h), iso(c + w, r + d, h), iso(c + w, r + d, 0), iso(c + w, r, 0)]
}
function frontPts(c: number, r: number, w: number, d: number, h: number) {
  return [iso(c, r + d, h), iso(c + w, r + d, h), iso(c + w, r + d, 0), iso(c, r + d, 0)]
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  techs: TechnicianRecord[]
  jobs: Job[]
}

export default function StudioScene({ techs, jobs }: Props) {
  const supabase = createClient()

  // assignments: wsId -> techName | null
  const [assignments, setAssignments] = useState<Record<number, string | null>>(() => {
    const init: Record<number, string | null> = {}
    for (const ws of WORKSTATIONS) init[ws.id] = null
    for (const tech of techs) {
      if (tech.workstation != null) {
        init[tech.workstation] = tech.name
      }
    }
    return init
  })

  const [activeWs, setActiveWs] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  // Re-init when techs change
  useEffect(() => {
    const init: Record<number, string | null> = {}
    for (const ws of WORKSTATIONS) init[ws.id] = null
    for (const tech of techs) {
      if (tech.workstation != null) init[tech.workstation] = tech.name
    }
    setAssignments(init)
  }, [techs])

  // Helpers
  const assignedNames = new Set(Object.values(assignments).filter(Boolean) as string[])
  const unassignedTechs = techs.filter(t => !assignedNames.has(t.name))

  const techByName = Object.fromEntries(techs.map(t => [t.name, t]))

  function getActiveJobForTech(techName: string): Job | null {
    return jobs.find(j => j.technician === techName && j.status === 'in-progress') ?? null
  }

  async function assign(wsId: number, techName: string | null) {
    setSaving(true)
    // Unassign previous occupant of this WS
    const prev = assignments[wsId]
    if (prev) {
      await supabase.from('technicians').update({ workstation: null }).eq('name', prev)
    }
    // Unassign this tech from any previous WS
    if (techName) {
      await supabase.from('technicians').update({ workstation: wsId }).eq('name', techName)
    }
    setAssignments(a => ({ ...a, [wsId]: techName }))
    setSaving(false)
  }

  async function unassign(wsId: number) {
    const prev = assignments[wsId]
    if (!prev) return
    setSaving(true)
    await supabase.from('technicians').update({ workstation: null }).eq('name', prev)
    setAssignments(a => ({ ...a, [wsId]: null }))
    setSaving(false)
  }

  // Quick assign a tech to the next free WS
  async function quickAssign(techName: string) {
    const freeWs = WORKSTATIONS.find(ws => !assignments[ws.id])
    if (!freeWs) return
    await assign(freeWs.id, techName)
  }

  // ── Floor tiles ─────────────────────────────────────────────────────────────
  const floorTiles: React.ReactElement[] = []
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 8; c++) {
      const tl = iso(c, r)
      const tr = iso(c + 1, r)
      const br = iso(c + 1, r + 1)
      const bl = iso(c, r + 1)
      const fill = (c + r) % 2 === 0 ? '#1c1408' : '#181204'
      floorTiles.push(
        <polygon
          key={`floor-${c}-${r}`}
          points={pts([tl, tr, br, bl])}
          fill={fill}
          stroke="#120e04"
          strokeWidth={0.5}
        />
      )
    }
  }

  // ── Back wall (row=0 edge) ────────────────────────────────────────────────
  const wallH = 110
  const backWallPolys: React.ReactElement[] = []
  for (let c = 0; c < 8; c++) {
    const bl = iso(c, 0)
    const br = iso(c + 1, 0)
    const tr = { x: br.x, y: br.y - wallH }
    const tl = { x: bl.x, y: bl.y - wallH }
    backWallPolys.push(
      <polygon key={`bw-${c}`} points={pts([tl, tr, br, bl])} fill="#0d1225" stroke="#0a0e1f" strokeWidth={0.5} />
    )
  }

  // ── Left wall (col=0 edge) ────────────────────────────────────────────────
  const leftWallPolys: React.ReactElement[] = []
  for (let r = 0; r < 5; r++) {
    const tl = iso(0, r)
    const bl = iso(0, r + 1)
    const br = { x: bl.x, y: bl.y - wallH }
    const tr = { x: tl.x, y: tl.y - wallH }
    leftWallPolys.push(
      <polygon key={`lw-${r}`} points={pts([tr, tl, bl, br])} fill="#0a0e1a" stroke="#080c14" strokeWidth={0.5} />
    )
  }

  // ── Desk rendering ────────────────────────────────────────────────────────
  function renderDesk(ws: typeof WORKSTATIONS[number]) {
    const { c, r, w, d, h, isCeo } = ws as { c: number; r: number; w: number; d: number; h: number; isCeo?: boolean }
    const topColor   = isCeo ? '#1a3050' : '#1a2535'
    const rightColor = isCeo ? '#0d1e35' : '#0e1825'
    const frontColor = isCeo ? '#0f2240' : '#111e2e'

    const occupant = assignments[ws.id]
    const occupantTech = occupant ? techByName[occupant] : null
    const isActive = !!occupant
    const isSelected = activeWs === ws.id
    const activeJob = occupant ? getActiveJobForTech(occupant) : null
    const glowColor = occupantTech?.color ?? '#00aaff'

    // Glow ring on floor
    const floorCenter = iso(c + w / 2, r + d / 2)

    // Monitor on top of desk
    const mw = w * 0.35
    const md = d * 0.3
    const mc = c + w / 2 - mw / 2
    const mr = r + d * 0.15
    const mh = h + 16
    const screenColor = activeJob ? '#001a30' : '#000e1a'

    const labelPt = iso(c + w / 2, r + d / 2, h + 10)

    return (
      <g key={`ws-${ws.id}`} style={{ cursor: 'pointer' }} onClick={() => setActiveWs(ws.id === activeWs ? null : ws.id)}>
        {/* Glow ring */}
        {isActive && (
          <ellipse
            cx={floorCenter.x}
            cy={floorCenter.y}
            rx={w * 30}
            ry={d * 18}
            fill={glowColor}
            opacity={0.06}
          />
        )}

        {/* Desk top */}
        <polygon
          points={pts(topPts(c, r, w, d, h))}
          fill={topColor}
          stroke={isSelected ? glowColor : isActive ? glowColor : '#1a2535'}
          strokeWidth={isSelected ? 2 : isActive ? 1.5 : 0.5}
          opacity={isSelected ? 1 : 0.9}
        />
        {/* Desk right face */}
        <polygon points={pts(rightPts(c, r, w, d, h))} fill={rightColor} stroke="#0a1020" strokeWidth={0.5} />
        {/* Desk front face */}
        <polygon points={pts(frontPts(c, r, w, d, h))} fill={frontColor} stroke="#0a1020" strokeWidth={0.5} />

        {/* Monitor back */}
        <polygon points={pts(topPts(mc, mr, mw, md, mh))} fill="#0a0f1a" stroke="#1a2535" strokeWidth={0.5} />
        {/* Monitor screen face (front) */}
        <polygon
          points={pts(frontPts(mc, mr, mw, md, mh))}
          fill={screenColor}
          stroke="#00aaff"
          strokeWidth={0.3}
          opacity={0.9}
        />
        {/* Monitor screen text */}
        {activeJob && (
          <text
            x={iso(mc + mw / 2, mr + md, mh - 4).x}
            y={iso(mc + mw / 2, mr + md, mh - 4).y}
            fill={glowColor}
            fontSize={3}
            textAnchor="middle"
            opacity={0.85}
          >
            ■■■■
          </text>
        )}

        {/* Label when unoccupied */}
        {!isActive && (
          <text x={labelPt.x} y={labelPt.y - 6} fill="#2a3a5a" fontSize={5} textAnchor="middle" letterSpacing={1}>
            {ws.label}
          </text>
        )}
      </g>
    )
  }

  // ── Character rendering ──────────────────────────────────────────────────
  function renderCharacter(ws: typeof WORKSTATIONS[number]) {
    const occupant = assignments[ws.id]
    if (!occupant) return null
    const tech = techByName[occupant]
    if (!tech) return null
    const { c, r, w, d, h } = ws as { c: number; r: number; w: number; d: number; h: number }
    const pos = iso(c + w / 2, r + d / 2, h)
    return (
      <Character key={`char-${ws.id}`} x={pos.x} y={pos.y - 35} color={tech.color} />
    )
  }

  // ── Plants ────────────────────────────────────────────────────────────────
  function renderPlant(c: number, r: number) {
    const base = iso(c, r)
    return (
      <g key={`plant-${c}-${r}`}>
        {/* Pot */}
        <rect x={base.x - 4} y={base.y - 8} width={8} height={8} fill="#3a1a0a" rx={1} />
        {/* Stem */}
        <rect x={base.x - 1} y={base.y - 18} width={2} height={12} fill="#2a4a1a" />
        {/* Leaves */}
        <ellipse cx={base.x} cy={base.y - 22} rx={8} ry={6} fill="#1a4a10" opacity={0.9} />
        <ellipse cx={base.x - 5} cy={base.y - 18} rx={5} ry={4} fill="#1e5514" opacity={0.8} />
        <ellipse cx={base.x + 5} cy={base.y - 18} rx={5} ry={4} fill="#1e5514" opacity={0.8} />
      </g>
    )
  }

  // ── Bookshelf ────────────────────────────────────────────────────────────
  function renderBookshelf() {
    const c = 7.1, r = 0.5
    const bw = 0.8, bd = 0.4, bh = 50
    const shelfTop = topPts(c, r, bw, bd, bh)
    const shelfRight = rightPts(c, r, bw, bd, bh)
    const shelfFront = frontPts(c, r, bw, bd, bh)
    const bookColors = ['#ff2d55', '#00aaff', '#ffd700', '#00ff41', '#b06bff', '#ff6b35']
    const bookCount = 6
    const books: React.ReactElement[] = []
    for (let i = 0; i < bookCount; i++) {
      const bc = c + (i / bookCount) * bw
      const bspine = topPts(bc, r, bw / bookCount, bd, bh)
      books.push(
        <polygon
          key={`book-${i}`}
          points={pts(bspine)}
          fill={bookColors[i % bookColors.length]}
          opacity={0.7}
          stroke="#0a0e1a"
          strokeWidth={0.3}
        />
      )
    }
    return (
      <g key="bookshelf">
        <polygon points={pts(shelfTop)} fill="#1a1205" stroke="#2a1e0a" strokeWidth={0.5} />
        <polygon points={pts(shelfRight)} fill="#100d04" stroke="#0a0e1a" strokeWidth={0.5} />
        <polygon points={pts(shelfFront)} fill="#150f05" stroke="#0a0e1a" strokeWidth={0.5} />
        {books}
      </g>
    )
  }

  // ── Wall decorations ─────────────────────────────────────────────────────
  function renderWallDecorations() {
    // Production Board (left side, c≈1)
    const boardBase = iso(1.2, 0, wallH - 10)
    const boardW = 70, boardH = 55
    // Calendar (right side, c≈6)
    const calBase = iso(5.8, 0, wallH - 10)
    const calW = 50, calH = 45
    // Logo center
    const logoBase = iso(3.8, 0, wallH + 4)

    return (
      <g>
        {/* KhropCut Logo */}
        <text x={logoBase.x} y={logoBase.y} fill="#00aaff" fontSize={8} textAnchor="middle" letterSpacing={3} opacity={0.8}>
          KHROPCUT
        </text>
        <text x={logoBase.x} y={logoBase.y + 8} fill="#3a4a6b" fontSize={4} textAnchor="middle" letterSpacing={2}>
          STUDIO
        </text>

        {/* Production Board */}
        <rect x={boardBase.x - boardW / 2} y={boardBase.y - boardH} width={boardW} height={boardH} fill="#0a1530" stroke="#00aaff" strokeWidth={0.8} opacity={0.9} />
        <text x={boardBase.x} y={boardBase.y - boardH + 7} fill="#00aaff" fontSize={4} textAnchor="middle" letterSpacing={1}>PRODUCTION BOARD</text>
        <line x1={boardBase.x - boardW / 2 + 4} y1={boardBase.y - boardH + 10} x2={boardBase.x + boardW / 2 - 4} y2={boardBase.y - boardH + 10} stroke="#00aaff" strokeWidth={0.4} opacity={0.3} />
        {/* Job card rows */}
        {[
          { y: 0, color: '#00aaff', label: 'IN PROGRESS' },
          { y: 12, color: '#ffd700', label: 'SCHEDULED' },
          { y: 24, color: '#00ff41', label: 'DONE' },
        ].map(row => (
          <g key={row.label}>
            <rect
              x={boardBase.x - boardW / 2 + 4}
              y={boardBase.y - boardH + 14 + row.y}
              width={boardW - 8}
              height={9}
              fill={row.color}
              opacity={0.08}
              stroke={row.color}
              strokeWidth={0.4}
              strokeOpacity={0.3}
            />
            <text
              x={boardBase.x - boardW / 2 + 8}
              y={boardBase.y - boardH + 20 + row.y}
              fill={row.color}
              fontSize={3.5}
              opacity={0.7}
            >
              {row.label}
            </text>
          </g>
        ))}

        {/* Calendar panel */}
        <rect x={calBase.x - calW / 2} y={calBase.y - calH} width={calW} height={calH} fill="#0a1225" stroke="#3a4a6b" strokeWidth={0.8} opacity={0.9} />
        <text x={calBase.x} y={calBase.y - calH + 7} fill="#3a5a7b" fontSize={4} textAnchor="middle" letterSpacing={1}>CALENDAR</text>
        <line x1={calBase.x - calW / 2 + 3} y1={calBase.y - calH + 10} x2={calBase.x + calW / 2 - 3} y2={calBase.y - calH + 10} stroke="#3a4a6b" strokeWidth={0.3} opacity={0.5} />
        {/* Calendar grid dots */}
        {Array.from({ length: 5 }).map((_, row) =>
          Array.from({ length: 7 }).map((_, col) => (
            <circle
              key={`caldot-${row}-${col}`}
              cx={calBase.x - calW / 2 + 6 + col * 6}
              cy={calBase.y - calH + 14 + row * 6}
              r={1.2}
              fill="#2a3a5a"
              opacity={Math.random() > 0.7 ? 0.9 : 0.3}
            />
          ))
        )}
      </g>
    )
  }

  // ── Sort desks by painter's algorithm (c + r ascending) ──────────────────
  const sortedDesks = [...WORKSTATIONS].sort((a, b) => (a.c + a.r) - (b.c + b.r))

  // ── Active WS info ────────────────────────────────────────────────────────
  const activeWsObj = activeWs !== null ? WORKSTATIONS.find(w => w.id === activeWs) ?? null : null
  const activeOccupant = activeWs !== null ? assignments[activeWs] ?? null : null
  const activeOccupantTech = activeOccupant ? techByName[activeOccupant] ?? null : null

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0a0e1a', overflow: 'hidden' }}>

      {/* ── Left Roster Panel ─────────────────────────────────────────────── */}
      <div style={{
        width: '200px',
        minWidth: '200px',
        background: '#080c17',
        borderRight: '1px solid rgba(0,170,255,0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 14px 10px',
          borderBottom: '1px solid rgba(0,170,255,0.12)',
          fontSize: '7px',
          color: '#00aaff',
          letterSpacing: '0.15em',
        }}>
          ◉ ROSTER
        </div>

        {/* Tech list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {techs.length === 0 && (
            <div style={{ fontSize: '6px', color: '#3a4a6b', textAlign: 'center', padding: '16px' }}>
              — NO TECHNICIANS —
            </div>
          )}
          {techs.map(tech => {
            const isAssigned = assignedNames.has(tech.name)
            const wsNum = isAssigned
              ? Object.entries(assignments).find(([, n]) => n === tech.name)?.[0]
              : null
            const wsLabel = wsNum ? WORKSTATIONS.find(w => w.id === Number(wsNum))?.label : null

            return (
              <div
                key={tech.id}
                onClick={() => !isAssigned && quickAssign(tech.name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  cursor: isAssigned ? 'default' : 'pointer',
                  opacity: isAssigned ? 0.45 : 1,
                  borderBottom: '1px solid rgba(0,170,255,0.05)',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!isAssigned) (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,170,255,0.05)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
              >
                {/* Color dot */}
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: tech.color,
                  flexShrink: 0,
                  boxShadow: !isAssigned ? `0 0 5px ${tech.color}60` : 'none',
                }} />

                {/* Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '7px', color: isAssigned ? '#3a4a6b' : '#e0e8ff', letterSpacing: '0.05em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tech.name}
                  </div>
                </div>

                {/* WS badge or unassigned hint */}
                {isAssigned ? (
                  <div style={{
                    fontSize: '5px',
                    background: 'rgba(58,64,80,0.4)',
                    color: '#4a5a7b',
                    padding: '1px 4px',
                    letterSpacing: '0.05em',
                    flexShrink: 0,
                  }}>
                    {wsLabel}
                  </div>
                ) : (
                  <div style={{ fontSize: '5px', color: '#2a3a5a', flexShrink: 0 }}>+ ASSIGN</div>
                )}
              </div>
            )
          })}
        </div>

        {/* Saving indicator */}
        {saving && (
          <div style={{ padding: '8px 12px', fontSize: '6px', color: '#ffd700', borderTop: '1px solid rgba(0,170,255,0.08)' }}>
            SAVING...
          </div>
        )}
      </div>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Title bar */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid rgba(0,170,255,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#00aaff', letterSpacing: '0.1em' }}>⊞ STUDIO MAP</div>
            <div style={{ fontSize: '6px', color: '#3a4a6b', letterSpacing: '0.2em', marginTop: '3px' }}>KHROPCUT · WORKSTATION LAYOUT</div>
          </div>
          <div style={{ fontSize: '6px', color: '#3a4a6b' }}>
            {Object.values(assignments).filter(Boolean).length} / {WORKSTATIONS.length} OCCUPIED
          </div>
        </div>

        {/* SVG Scene */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '0 20px' }}>
          <svg
            viewBox="0 0 800 520"
            width="100%"
            style={{ maxWidth: '860px', maxHeight: '100%' }}
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background */}
            <rect width={800} height={520} fill="#060a14" />

            {/* 1. Back wall */}
            {backWallPolys}

            {/* 2. Left wall */}
            {leftWallPolys}

            {/* 3. Wall decorations */}
            {renderWallDecorations()}

            {/* 4. Floor tiles (back to front: r=0 first) */}
            {floorTiles}

            {/* 5-7. Desks sorted by painter's algorithm */}
            {sortedDesks.map(ws => renderDesk(ws))}

            {/* Bookshelf */}
            {renderBookshelf()}

            {/* Plants */}
            {renderPlant(7.6, 0.1)}
            {renderPlant(0.1, 4.6)}

            {/* 8. Characters */}
            {sortedDesks.map(ws => renderCharacter(ws))}

            {/* 9. Selection highlight ring */}
            {activeWs !== null && (() => {
              const ws = WORKSTATIONS.find(w => w.id === activeWs)
              if (!ws) return null
              const { c, r, w: dw, d, h } = ws as { c: number; r: number; w: number; d: number; h: number }
              const center = iso(c + dw / 2, r + d / 2, h + 2)
              const occupant = assignments[ws.id]
              const tech = occupant ? techByName[occupant] : null
              const ringColor = tech?.color ?? '#00aaff'
              return (
                <ellipse
                  cx={center.x}
                  cy={center.y}
                  rx={dw * 32}
                  ry={dw * 18}
                  fill="none"
                  stroke={ringColor}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  opacity={0.7}
                />
              )
            })()}

            {/* WS labels for occupied desks */}
            {sortedDesks.map(ws => {
              const occupant = assignments[ws.id]
              if (!occupant) return null
              const tech = techByName[occupant]
              if (!tech) return null
              const { c, r, w: dw, d, h } = ws as { c: number; r: number; w: number; d: number; h: number }
              const labelPt = iso(c + dw / 2, r + d / 2, h + 28)
              return (
                <g key={`label-${ws.id}`} style={{ pointerEvents: 'none' }}>
                  <rect
                    x={labelPt.x - 22}
                    y={labelPt.y - 8}
                    width={44}
                    height={10}
                    fill="rgba(8,12,23,0.8)"
                    stroke={tech.color}
                    strokeWidth={0.5}
                    strokeOpacity={0.5}
                  />
                  <text
                    x={labelPt.x}
                    y={labelPt.y - 0.5}
                    fill={tech.color}
                    fontSize={4.5}
                    textAnchor="middle"
                    letterSpacing={0.5}
                    opacity={0.9}
                  >
                    {tech.name.length > 10 ? tech.name.slice(0, 10) + '…' : tech.name}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* Assignment Card (below SVG) */}
        {activeWsObj && (
          <div style={{
            flexShrink: 0,
            borderTop: '1px solid rgba(0,170,255,0.12)',
            padding: '14px 20px',
            background: '#080c17',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}>
            {/* WS info */}
            <div>
              <div style={{ fontSize: '8px', color: '#00aaff', letterSpacing: '0.1em' }}>
                {activeWsObj.label}
              </div>
              <div style={{ fontSize: '6px', color: '#3a4a6b', marginTop: '2px' }}>
                {activeOccupant ? `OCCUPIED · ${activeOccupant}` : 'VACANT'}
              </div>
            </div>

            {/* Separator */}
            <div style={{ width: '1px', height: '32px', background: 'rgba(0,170,255,0.15)' }} />

            {/* Assign dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '6px', color: '#3a4a6b', letterSpacing: '0.1em' }}>ASSIGN:</span>
              <select
                value={activeOccupant ?? ''}
                onChange={e => {
                  const val = e.target.value
                  if (val === '') {
                    unassign(activeWs!)
                  } else {
                    assign(activeWs!, val)
                  }
                }}
                style={{
                  background: '#0a1022',
                  color: '#e0e8ff',
                  border: '1px solid rgba(0,170,255,0.3)',
                  padding: '4px 8px',
                  fontSize: '7px',
                  letterSpacing: '0.05em',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">— UNASSIGNED —</option>
                {activeOccupantTech && (
                  <option value={activeOccupantTech.name}>{activeOccupantTech.name} (current)</option>
                )}
                {unassignedTechs.map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Remove button */}
            {activeOccupant && (
              <button
                onClick={() => unassign(activeWs!)}
                style={{
                  background: 'rgba(255,45,85,0.1)',
                  color: '#ff2d55',
                  border: '1px solid rgba(255,45,85,0.3)',
                  padding: '5px 12px',
                  fontSize: '6px',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                }}
              >
                REMOVE
              </button>
            )}

            {/* Active job info */}
            {activeOccupant && (() => {
              const job = getActiveJobForTech(activeOccupant)
              if (!job) return null
              return (
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontSize: '6px', color: '#00aaff', letterSpacing: '0.05em' }}>ACTIVE JOB</div>
                  <div style={{ fontSize: '7px', color: '#e0e8ff', marginTop: '2px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</div>
                  <div style={{ fontSize: '5px', color: '#3a4a6b' }}>{job.client} · {job.status}</div>
                </div>
              )
            })()}

            {/* Close button */}
            <button
              onClick={() => setActiveWs(null)}
              style={{
                marginLeft: activeOccupant ? '0' : 'auto',
                background: 'transparent',
                color: '#3a4a6b',
                border: 'none',
                padding: '5px 8px',
                fontSize: '10px',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
