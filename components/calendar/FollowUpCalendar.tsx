'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  addMonths,
  endOfMonth,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  addDays,
  eachDayOfInterval,
} from 'date-fns'
import { ChevronLeft, ChevronRight, CalendarDays, Plus, ArrowUpRight } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import type { CalendarEvent } from '@/app/(dashboard)/dashboard/susulan/page'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function buildMonthDays(month: Date) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end })
}

function endOfWeek(date: Date, options: { weekStartsOn: number }) {
  const day = date.getDay()
  const diff = options.weekStartsOn + (day - options.weekStartsOn + 7) % 7
  return addDays(date, 6 - diff)
}

export function FollowUpCalendar({
  events,
  canAdd,
}: {
  events: CalendarEvent[]
  canAdd: boolean
}) {
  const [cursor, setCursor] = useState(() => new Date())

  const days = useMemo(() => buildMonthDays(cursor), [cursor])
  const monthLabel = format(cursor, 'MMMM yyyy')

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const ev of events) {
      const key = format(parseISO(ev.tarikh), 'yyyy-MM-dd')
      const list = map.get(key) ?? []
      list.push(ev)
      map.set(key, list)
    }
    return map
  }, [events])

  const dayEvents = (d: Date) => eventsByDay.get(format(d, 'yyyy-MM-dd')) ?? []
  const totalInMonth = useMemo(
    () =>
      events.filter((ev) => {
        const t = parseISO(ev.tarikh)
        return isSameMonth(t, cursor)
      }).length,
    [events, cursor]
  )

  const jumpToToday = () => setCursor(new Date())
  const shift = (n: number) => setCursor((c) => addMonths(c, n))

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => shift(-1)}
            className="p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => shift(1)}
            className="p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={jumpToToday}
            className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            Today
          </button>
          <div className="flex items-center gap-2 ml-2">
            <CalendarDays size={18} className="text-[var(--color-brand)]" />
            <span className="text-base font-bold tracking-tight text-[var(--color-text-primary)]">
              {monthLabel}
            </span>
            <span className="text-xs text-[var(--color-text-tertiary)]">{totalInMonth} events</span>
          </div>
        </div>

        {canAdd && (
          <Link
            href="/dashboard/fasiliti"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--color-brand)] text-white text-xs font-semibold hover:bg-[var(--color-brand-hover)] transition-colors shadow-xs"
          >
            <Plus size={14} /> Add Follow-Up
          </Link>
        )}
      </div>

      {/* Grid */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-xs overflow-hidden">
        <div className="grid grid-cols-7 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((d) => {
            const evs = dayEvents(d)
            const inMonth = isSameMonth(d, cursor)
            const today = isToday(d)
            const weekend = d.getDay() === 0 || d.getDay() === 6
            return (
              <div
                key={d.toISOString()}
                className={cn(
                  'min-h-[96px] p-1.5 border-b border-r border-[var(--color-border)] last:border-r-0',
                  !inMonth && 'bg-[var(--color-surface-raised)]/40 opacity-50',
                  weekend && 'bg-[var(--color-surface-raised)]/30'
                )}
              >
                <div className="flex items-center justify-between px-1 mb-1">
                  <span
                    className={cn(
                      'text-[11px] font-semibold w-6 h-6 flex items-center justify-center rounded-full',
                      today
                        ? 'bg-[var(--color-brand)] text-white'
                        : inMonth
                        ? 'text-[var(--color-text-secondary)]'
                        : 'text-[var(--color-text-tertiary)]'
                    )}
                  >
                    {format(d, 'd')}
                  </span>
                  {evs.length > 0 && (
                    <span className="text-[10px] font-bold text-[var(--color-brand)]">
                      {evs.length}
                    </span>
                  )}
                </div>
                <div className="space-y-1 overflow-hidden">
                  {evs.slice(0, 2).map((ev) => (
                    <Link
                      key={ev.id}
                      href={
                        ev.entiti === 'fasiliti'
                          ? `/dashboard/fasiliti/${ev.entiti_id}`
                          : `/dashboard/tanah-jv/${ev.entiti_id}`
                      }
                      className={cn(
                        'block px-1.5 py-0.5 rounded-md text-[10px] font-medium truncate border transition-colors',
                        ev.entiti === 'tanah'
                          ? 'bg-[var(--color-brand)]/10 text-[var(--color-brand)] border-[var(--color-brand)]/20'
                          : 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-brand)]/30'
                      )}
                      title={`${ev.kod_rujukan} — ${ev.nama_peminjam}${ev.catatan ? `\n${ev.catatan}` : ''}`}
                    >
                      {ev.kod_rujukan}
                    </Link>
                  ))}
                  {evs.length > 2 && (
                    <p className="px-1.5 text-[10px] font-semibold text-[var(--color-text-tertiary)]">
                      +{evs.length - 2} more
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming list */}
      {totalInMonth > 0 && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Upcoming follow-ups this month
            </span>
          </div>
          <ul className="divide-y divide-[var(--color-border)]">
            {events
              .filter((ev) => isSameMonth(parseISO(ev.tarikh), cursor))
              .sort((a, b) => a.tarikh.localeCompare(b.tarikh))
              .map((ev) => (
                <li key={ev.id}>
                  <Link
                    href={
                      ev.entiti === 'fasiliti'
                        ? `/dashboard/fasiliti/${ev.entiti_id}`
                        : `/dashboard/tanah-jv/${ev.entiti_id}`
                    }
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--color-surface-raised)]/50 transition-colors group"
                  >
                    <span
                      className={cn(
                        'inline-flex px-2 py-1 rounded-lg text-[11px] font-mono font-semibold border min-w-[86px] justify-center',
                        isToday(parseISO(ev.tarikh))
                          ? 'bg-[var(--color-brand)] text-white border-transparent'
                          : 'bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border-[var(--color-border)]'
                      )}
                    >
                      {formatDate(ev.tarikh, 'dd/MM/yyyy')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                        {ev.kod_rujukan} — {ev.nama_peminjam}
                      </p>
                      {ev.catatan && (
                        <p className="text-[11px] text-[var(--color-text-tertiary)] truncate">
                          {ev.catatan}
                        </p>
                      )}
                    </div>
                    <ArrowUpRight
                      size={14}
                      className="text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  )
}