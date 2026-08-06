'use client'

import Link from 'next/link'
import { useEffect, useState, ViewTransition } from 'react'
import { LogoBrand } from '@/components/ui/logo-brand'

/* ─────────────────────────────────────────────────────────────────────────────
   useScrollReveal — Vita Travel pattern
   Adds .in-view to [data-animate] elements as they enter the viewport.
   Combined with the CSS in globals.css for a fade+translateY reveal.
───────────────────────────────────────────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const t = setTimeout(() => {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('in-view')
              io.unobserve(e.target)
            }
          })
        },
        { threshold: 0.07, rootMargin: '0px 0px -40px 0px' }
      )
      document.querySelectorAll('[data-animate]').forEach((el) => io.observe(el))
      return () => io.disconnect()
    }, 80)
    return () => clearTimeout(t)
  }, [])
}

/* Helper: creates the CSS custom property for stagger delays */
type AnimStyle = React.CSSProperties & { '--stagger'?: string }
const stagger = (ms: number): AnimStyle => ({ '--stagger': `${ms}ms` } as AnimStyle)

/* ─────────────────────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────────────────────── */

/** ✳ Label — the signature Vita Travel section eyebrow */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase"
      style={{ color: 'rgba(255,255,255,0.38)' }}>
      <span style={{ color: '#0d9488', fontSize: 13 }}>✳</span>
      {children}
    </div>
  )
}

/** Pill CTA button matching Vita Travel's "Explore Retreats" style */
function PillBtn({
  href,
  children,
  transitionTypes: tt,
  id,
  variant = 'white',
}: {
  href: string
  children: React.ReactNode
  transitionTypes?: string[]
  id?: string
  variant?: 'white' | 'outline'
}) {
  const base = 'vita-btn inline-flex items-center gap-2.5 h-11 px-6 rounded-full text-[13.5px] font-semibold transition-all duration-200'
  const styles =
    variant === 'white'
      ? { background: '#fff', color: '#0c1928' }
      : { border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.72)' }
  return (
    <Link
      href={href}
      id={id}
      transitionTypes={tt}
      className={base}
      style={styles}
    >
      {children}
      <span className="vita-arrow">
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M2.5 7H11.5M8.5 4L11.5 7L8.5 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  )
}

/** Vita Travel–style category card (bordered, label top + image bottom) */
function CategoryCard({
  label,
  count,
  delay = 0,
}: {
  label: string
  count: string
  delay?: number
}) {
  return (
    <div
      data-animate
      style={{ ...stagger(delay), borderRight: '1px solid rgba(255,255,255,0.08)' }}
      className="flex flex-col p-6 group last:border-r-0"
    >
      <div className="flex items-center justify-between mb-5">
        <span className="text-[13px] font-semibold text-white/80">{label}</span>
        <span className="text-[11px] font-mono text-white/35">{count}</span>
      </div>
      {/* Minimal visual block — abstract dark rect with teal accent */}
      <div
        className="vita-img-zoom rounded-xl overflow-hidden flex-1 min-h-[140px] relative"
        style={{ background: 'rgba(13,148,136,0.08)' }}
      >
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(13,148,136,0.12) 0%, rgba(15,118,110,0.04) 100%)',
          transition: 'transform 0.65s cubic-bezier(0.16,1,0.3,1)',
        }} />
        <div className="absolute bottom-4 left-4">
          <div style={{ width: 28, height: 3, background: '#0d9488', borderRadius: 2, marginBottom: 6 }} />
          <div style={{ width: 48, height: 3, background: 'rgba(255,255,255,0.18)', borderRadius: 2 }} />
        </div>
      </div>
    </div>
  )
}

/** Feature card — dark bordered, matching Vita Travel's clean grid style */
function FeatureCard({
  icon,
  title,
  desc,
  delay = 0,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  delay?: number
}) {
  return (
    <div
      data-animate
      style={stagger(delay)}
      className="p-7 border-r border-b last:border-r-0 group transition-colors duration-300 hover:bg-white/[0.025]"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
        style={{ background: 'rgba(13,148,136,0.15)', color: '#0d9488' }}
      >
        {icon}
      </div>
      <h3 className="text-[17px] font-bold text-white mb-3 leading-snug">{title}</h3>
      <p className="text-[13.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{desc}</p>
    </div>
  )
}

/** Contact strip — matching Vita's horizontal strip cards */
function ContactStrip({
  icon,
  title,
  badge,
  desc,
  href,
  btnLabel,
  delay = 0,
}: {
  icon: React.ReactNode
  title: string
  badge: string
  desc: string
  href: string
  btnLabel: string
  delay?: number
}) {
  return (
    <div
      data-animate
      style={stagger(delay)}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-6 border-b group transition-colors duration-300 hover:bg-white/[0.03]"
    >
      <div className="flex items-start sm:items-center gap-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
          style={{ background: 'rgba(13,148,136,0.15)', color: '#0d9488' }}
        >
          {icon}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[15px] font-bold text-white">{title}</span>
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
              style={{ background: 'rgba(13,148,136,0.15)', color: '#0d9488', border: '1px solid rgba(13,148,136,0.3)' }}
            >
              {badge}
            </span>
          </div>
          <p className="text-[13px] leading-relaxed max-w-xl" style={{ color: 'rgba(255,255,255,0.48)' }}>{desc}</p>
        </div>
      </div>
      <a
        href={href}
        className="vita-btn flex-shrink-0 inline-flex items-center gap-2 h-10 px-5 rounded-full text-[12.5px] font-semibold transition-all duration-200 text-white border"
        style={{ borderColor: 'rgba(255,255,255,0.15)' }}
      >
        {btnLabel}
        <span className="vita-arrow">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2.5 7H11.5M8.5 4L11.5 7L8.5 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
      </a>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

export default function HeroSection() {
  const [scrolled, setScrolled] = useState(false)
  useScrollReveal()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const darkBg = '#0c1928'
  const darkAlt = '#0f2035'
  const border = 'rgba(255,255,255,0.08)'

  return (
    <div id="top" className="relative flex flex-col font-sans" style={{ background: darkBg, color: '#fff' }}>

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 lg:px-16 h-[64px] transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(12,25,40,0.96)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: `1px solid ${scrolled ? 'rgba(255,255,255,0.07)' : 'transparent'}`,
          viewTransitionName: 'traceo-hero-nav',
        }}
      >
        {/* Wordmark */}
        <a href="#top" className="flex items-center gap-2 cursor-pointer select-none" style={{ textDecoration: 'none' }}>
          <span style={{ color: '#0d9488', fontSize: 16 }}>✳</span>
          <span className="text-white font-bold text-[15px] tracking-tight">Traceo</span>
        </a>

        {/* Center links */}
        <div className="hidden md:flex items-center gap-8 text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
          <a href="#facilities" className="hover:text-white transition-colors duration-200">Facilities</a>
          <a href="#about" className="hover:text-white transition-colors duration-200">About System</a>
          <a href="#contact" className="hover:text-white transition-colors duration-200">Contact</a>
        </div>

        {/* CTA */}
        <PillBtn href="/login" id="nav-login-cta" transitionTypes={['nav-forward']}>
          Explore System
        </PillBtn>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <ViewTransition enter="hero-enter" default="none">
        <section
          className="relative flex flex-col items-center justify-center text-center px-6 py-28 md:py-36 overflow-hidden"
          style={{ minHeight: 'calc(100vh - 64px)', background: darkBg }}
        >
          {/* Ambient glow */}
          <div className="pointer-events-none absolute inset-0">
            <div style={{
              position: 'absolute', top: '-8%', left: '50%', transform: 'translateX(-50%)',
              width: 760, height: 480,
              background: 'radial-gradient(ellipse, rgba(13,148,136,0.14) 0%, transparent 68%)',
              filter: 'blur(48px)',
            }} />
            <div style={{
              position: 'absolute', bottom: '10%', right: '10%',
              width: 320, height: 320,
              background: 'radial-gradient(ellipse, rgba(13,148,136,0.07) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }} />
            {/* Subtle dot grid */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }} />
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-[820px]">
            {/* Eyebrow label */}
            <div
              data-animate
              style={stagger(0)}
              className="flex items-center justify-center gap-2 mb-7 text-[11px] font-semibold tracking-[0.2em] uppercase"
            >
              <span style={{ color: '#0d9488' }}>✳</span>
              <span style={{ color: 'rgba(255,255,255,0.38)' }}>Facility Management &amp; JV Portfolio System</span>
            </div>

            {/* Giant headline — Vita Travel "Travel" scale */}
            <h1
              data-animate
              style={{ ...stagger(80), lineHeight: '0.94', letterSpacing: '-0.03em' }}
              className="text-[clamp(3.4rem,8.5vw,7.5rem)] font-black text-white mb-7"
            >
              Manage.{' '}
              <br />
              <span style={{ color: 'rgba(255,255,255,0.38)' }}>Track.</span>
              <br />
              Report.
            </h1>

            {/* Subtitle */}
            <p
              data-animate
              style={{ ...stagger(160), color: 'rgba(255,255,255,0.52)' }}
              className="text-[16px] leading-relaxed max-w-[500px] mx-auto mb-10"
            >
              Monitor facility statuses, systematically track arrears, and generate official chronological reports in Word &amp; PDF — all in one centralized platform.
            </p>

            {/* CTA row */}
            <div data-animate style={stagger(240)} className="flex items-center justify-center gap-3 flex-wrap">
              <PillBtn href="/login" id="hero-primary-cta" transitionTypes={['nav-forward']}>
                Get Started
              </PillBtn>
              <a
                href="#about"
                id="hero-secondary-cta"
                className="inline-flex items-center h-11 px-6 rounded-full text-[13.5px] font-medium transition-colors duration-200"
                style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.32)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Mock UI Preview — dark version */}
          <div
            data-animate
            style={{ ...stagger(360), borderColor: border }}
            className="relative z-10 w-full max-w-[900px] mt-20 rounded-2xl border overflow-hidden shadow-2xl shadow-black/40"
          >
            {/* Window header */}
            <div
              className="flex items-center justify-between px-5 py-3.5 border-b"
              style={{ background: 'rgba(255,255,255,0.04)', borderColor: border }}
            >
              <div className="flex items-center gap-1.5">
                <div style={{ width: 11, height: 11, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ width: 11, height: 11, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ width: 11, height: 11, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              </div>
              <span className="text-[10px] font-mono tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Traceo Platform · Preview
              </span>
              <div style={{ width: 60 }} />
            </div>
            {/* Toolbar */}
            <div
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: border }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="h-8 px-3 rounded-lg border flex items-center gap-2 text-[12px]"
                  style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)' }}
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10zm5-1l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  Search records…
                </div>
                <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
                <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Status: All</span>
              </div>
              <button
                className="h-8 px-3.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5"
                style={{ background: '#0d9488', color: '#fff' }}
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 2v7.5M3.5 6.5L7 10l3.5-3.5M2.5 12h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Generate Chronology (.docx / .pdf)
              </button>
            </div>
            {/* Table */}
            <div style={{ background: '#0f2035' }}>
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="border-b text-[10.5px] font-semibold" style={{ borderColor: border, color: 'rgba(255,255,255,0.28)' }}>
                    <th className="py-2.5 px-4">Record Code</th>
                    <th className="py-2.5 px-4">Account / Entity Name</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Arrears</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { code: 'REC-001', name: 'Sample Entity A Ltd', status: 'Active', statusColor: '#0d9488', arrears: 'RM 0.00' },
                    { code: 'REC-002', name: 'Facility Account B', status: 'Under Review', statusColor: '#f59e0b', arrears: 'RM 12,500.00' },
                    { code: 'REC-003', name: 'JV Enterprise C', status: 'Active', statusColor: '#0d9488', arrears: 'RM 0.00' },
                  ].map((row) => (
                    <tr key={row.code} className="border-b transition-colors duration-150 hover:bg-white/[0.025]" style={{ borderColor: border, color: 'rgba(255,255,255,0.7)' }}>
                      <td className="py-2.5 px-4 font-mono" style={{ color: 'rgba(255,255,255,0.38)' }}>{row.code}</td>
                      <td className="py-2.5 px-4 font-semibold text-white">{row.name}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ background: `${row.statusColor}20`, color: row.statusColor, border: `1px solid ${row.statusColor}40` }}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono">{row.arrears}</td>
                      <td className="py-2.5 px-4 text-right">
                        <span className="text-[11.5px] font-semibold cursor-pointer" style={{ color: '#0d9488' }}>View Chronology →</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between text-[10px] px-4 py-3" style={{ color: 'rgba(255,255,255,0.22)' }}>
                <span>Traceo Interface Preview</span>
                <span className="font-mono uppercase tracking-wider">Internal System Mockup</span>
              </div>
            </div>
          </div>
        </section>
      </ViewTransition>

      {/* ── FACILITIES / CATEGORIES ──────────────────────────────────────── */}
      <section
        id="facilities"
        className="w-full scroll-mt-16"
        style={{ background: darkAlt, borderTop: `1px solid ${border}` }}
      >
        <div className="max-w-[1360px] mx-auto">
          {/* Header row */}
          <div className="grid lg:grid-cols-[200px_1fr] gap-6 px-6 md:px-10 lg:px-16 py-14 border-b" style={{ borderColor: border }}>
            <div data-animate style={stagger(0)}>
              <SectionLabel>Facilities</SectionLabel>
            </div>
            <div>
              <h2
                data-animate
                style={{ ...stagger(80), lineHeight: '1.1', letterSpacing: '-0.025em' }}
                className="text-[clamp(1.9rem,4vw,3rem)] font-black text-white"
              >
                Tracking facilities<br />
                across all JV categories.<br />
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>See for yourself.</span>
              </h2>
            </div>
          </div>

          {/* 3-column category grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 border-b" style={{ borderColor: border }}>
            {[
              { label: 'JV Syarikat (JV 1)', count: '/ Company JV Facilities' },
              { label: 'JV Tanah (JV 2)', count: '/ Land JV Facilities' },
              { label: 'Pinjaman Individu (JV 3)', count: '/ Personal Loan Facilities' },
            ].map((cat, i) => (
              <div
                key={cat.label}
                data-animate
                style={{ ...stagger(i * 100), borderRight: i < 2 ? `1px solid ${border}` : 'none' }}
                className="flex flex-col p-7 group transition-colors duration-300 hover:bg-white/[0.02]"
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[13.5px] font-semibold text-white/80">{cat.label}</span>
                  <span className="text-[10px] font-mono text-white/28">{cat.count}</span>
                </div>
                {/* Visual accent block */}
                <div
                  className="vita-img-zoom rounded-xl overflow-hidden min-h-[160px] relative"
                  style={{ background: 'rgba(13,148,136,0.06)' }}
                >
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(135deg, rgba(13,148,136,0.1) 0%, rgba(15,32,53,0.3) 100%)',
                    transition: 'transform 0.65s cubic-bezier(0.16,1,0.3,1)',
                  }} />
                  {/* Abstract data viz bars */}
                  <div className="absolute bottom-5 left-5 flex items-end gap-1.5">
                    {[40, 65, 45, 80, 55, 70, 60].map((h, idx) => (
                      <div key={idx} style={{ width: 8, height: h * 0.8, background: idx === 3 ? '#0d9488' : 'rgba(255,255,255,0.12)', borderRadius: 4 }} />
                    ))}
                  </div>
                  <div className="absolute top-4 right-4 text-[10px] font-mono" style={{ color: '#0d9488' }}>
                    <span>↑ Active</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT SYSTEM ─────────────────────────────────────────────────── */}
      <section
        id="about"
        className="w-full scroll-mt-16"
        style={{ background: darkBg, borderTop: `1px solid ${border}` }}
      >
        <div className="max-w-[1360px] mx-auto px-6 md:px-10 lg:px-16 py-16 md:py-24">
          {/* Section label */}
          <div data-animate style={stagger(0)} className="mb-10">
            <SectionLabel>About System</SectionLabel>
          </div>

          {/* Two-column: headline + copy/stats */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            <div>
              <h2
                data-animate
                style={{ ...stagger(80), lineHeight: '1.08', letterSpacing: '-0.025em' }}
                className="text-[clamp(1.9rem,3.8vw,3rem)] font-black text-white"
              >
                Not just records —<br />
                complete facility oversight<br />
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>for your JV portfolio.</span>
              </h2>
            </div>

            <div className="flex flex-col justify-center">
              <p
                data-animate
                style={{ ...stagger(80), color: 'rgba(255,255,255,0.55)' }}
                className="text-[15px] leading-relaxed mb-8 max-w-[480px]"
              >
                Traceo is engineered as a facility management engine that centralizes all facility data in a single system — from account status to detailed follow-up histories. Active monitoring ensures every facility remains under oversight and no case is overlooked.
              </p>

              {/* Stats — Vita Travel "100+" pattern */}
              <div data-animate style={stagger(160)} className="grid grid-cols-2 gap-8 mb-8">
                {[
                  { value: '100+', label: 'Total facilities\ntracked' },
                  { value: '3', label: 'JV categories\nmanaged' },
                  { value: '24 hr', label: 'Report generation\nturnaround' },
                  { value: 'RBAC', label: 'Role-based access\ncontrol' },
                ].map((stat) => (
                  <div key={stat.value}>
                    <div className="text-[2rem] font-black text-white leading-none mb-1">{stat.value}</div>
                    <div className="text-[12px] leading-snug" style={{ color: 'rgba(255,255,255,0.42)' }}>
                      {stat.label.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Trusted-by strip */}
              <div data-animate style={{ ...stagger(240), borderTop: `1px solid ${border}` }} className="flex items-center gap-3 pt-6">
                <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.32)' }}>Built for internal management use.</span>
                <div style={{ width: 36, height: 1, background: 'rgba(255,255,255,0.14)' }} />
                <span className="text-[11px] font-mono tracking-wider uppercase" style={{ color: '#0d9488' }}>Traceo · 2026</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section
        id="features"
        className="w-full scroll-mt-16"
        style={{ background: darkAlt, borderTop: `1px solid ${border}` }}
      >
        <div className="max-w-[1360px] mx-auto">
          {/* Header */}
          <div className="grid lg:grid-cols-2 gap-6 px-6 md:px-10 lg:px-16 py-14 border-b" style={{ borderColor: border }}>
            <div>
              <div data-animate style={stagger(0)} className="mb-5">
                <SectionLabel>Platform Capabilities</SectionLabel>
              </div>
              <h2
                data-animate
                style={{ ...stagger(80), lineHeight: '1.1', letterSpacing: '-0.025em' }}
                className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-black text-white"
              >
                Core Platform Features
              </h2>
            </div>
            <div className="flex items-end">
              <p data-animate style={{ ...stagger(120), color: 'rgba(255,255,255,0.48)' }} className="text-[14.5px] leading-relaxed max-w-[400px]">
                Purpose-built to streamline record management and report generation without manual overhead.
              </p>
            </div>
          </div>

          {/* 3-column feature grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 border-b" style={{ borderColor: border }}>
            <FeatureCard
              delay={0}
              title="Centralized Database"
              desc="Manage facility financing records and associated account data centrally with role-based access control."
              icon={<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 3C5.58 3 2 4.34 2 6s3.58 3 8 3 8-1.34 8-3-3.58-3-8-3z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M2 6v4c0 1.66 3.58 3 8 3s8-1.34 8-3V6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M2 10v4c0 1.66 3.58 3 8 3s8-1.34 8-3v-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>}
            />
            <FeatureCard
              delay={80}
              title="Chronology Tracking"
              desc="Log every monitoring activity with concise notes, photo evidence, and automated timestamping."
              icon={<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.7"/><path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>}
            />
            <FeatureCard
              delay={160}
              title="Official Report Generation"
              desc="Export complete chronological reports to Word (.docx) and PDF formats, ready for board meetings."
              icon={<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M6 2h8l4 4v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M14 2v4h4M8 12h4M8 15h2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>}
            />
          </div>
        </div>
      </section>

      {/* ── SECURITY / PRIVACY ───────────────────────────────────────────── */}
      <section
        id="privacy"
        className="w-full scroll-mt-16"
        style={{ background: darkBg, borderTop: `1px solid ${border}` }}
      >
        <div className="max-w-[1360px] mx-auto px-6 md:px-10 lg:px-16 py-16 md:py-20">
          <div data-animate style={stagger(0)} className="mb-8">
            <SectionLabel>Data Security &amp; Confidentiality</SectionLabel>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            <div>
              <h2
                data-animate
                style={{ ...stagger(80), lineHeight: '1.1', letterSpacing: '-0.025em' }}
                className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-black text-white mb-5"
              >
                Privacy Policy
              </h2>
              <p
                data-animate
                style={{ ...stagger(160), color: 'rgba(255,255,255,0.5)' }}
                className="text-[14.5px] leading-relaxed"
              >
                We are committed to protecting the confidentiality of facility data and financial information managed within this system. Data is exclusively used for internal monitoring and report generation. We do not share, sell, or disclose this data to third parties. All internal activities are logged for auditing and security compliance.
              </p>
            </div>

            {/* 4-pill grid */}
            <div className="grid grid-cols-2 gap-3" data-animate style={stagger(120)}>
              {[
                { icon: '🔒', label: 'Financial Data Confidentiality' },
                { icon: '🛡️', label: 'Zero Third-Party Sharing' },
                { icon: '👤', label: 'Authorized Personnel Access' },
                { icon: '📋', label: 'Full Audit & Security Logs' },
              ].map((p) => (
                <div
                  key={p.label}
                  className="flex items-center gap-3 px-4 py-4 rounded-xl text-[13px] font-semibold text-white/80 transition-colors duration-200 hover:text-white hover:bg-white/[0.04]"
                  style={{ border: `1px solid ${border}` }}
                >
                  <span style={{ fontSize: 18 }}>{p.icon}</span>
                  {p.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TERMS ────────────────────────────────────────────────────────── */}
      <section
        id="terms"
        className="w-full scroll-mt-16"
        style={{ background: darkAlt, borderTop: `1px solid ${border}` }}
      >
        <div className="max-w-[1360px] mx-auto px-6 md:px-10 lg:px-16 py-16 md:py-20">
          <div data-animate style={stagger(0)} className="mb-8">
            <SectionLabel>Governance &amp; Terms of Use</SectionLabel>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            <div>
              <h2
                data-animate
                style={{ ...stagger(80), lineHeight: '1.1', letterSpacing: '-0.025em' }}
                className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-black text-white mb-5"
              >
                Terms of Service
              </h2>
              <p data-animate style={{ ...stagger(160), color: 'rgba(255,255,255,0.5)' }} className="text-[14.5px] leading-relaxed">
                Usage of this system is subject to professional ethics and corporate governance policies. Users are fully responsible for the accuracy of entered data and follow-up records. All information generated is for internal management use only and shall not be distributed externally without written authorization.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3" data-animate style={stagger(120)}>
              {[
                { icon: '🏢', label: 'Corporate Policy & Ethics' },
                { icon: '✅', label: 'Data Accuracy Responsibility' },
                { icon: '🏦', label: 'Internal Management Use Only' },
                { icon: '👁️', label: 'Monitoring & Access Controls' },
              ].map((p) => (
                <div
                  key={p.label}
                  className="flex items-center gap-3 px-4 py-4 rounded-xl text-[13px] font-semibold text-white/80 transition-colors duration-200 hover:text-white hover:bg-white/[0.04]"
                  style={{ border: `1px solid ${border}` }}
                >
                  <span style={{ fontSize: 18 }}>{p.icon}</span>
                  {p.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ──────────────────────────────────────────────────────── */}
      <section
        id="contact"
        className="w-full scroll-mt-16"
        style={{ background: darkBg, borderTop: `1px solid ${border}` }}
      >
        <div className="max-w-[1360px] mx-auto">
          {/* Header */}
          <div className="px-6 md:px-10 lg:px-16 py-14 border-b" style={{ borderColor: border }}>
            <div data-animate style={stagger(0)} className="mb-6">
              <SectionLabel>Support &amp; Technical Assistance</SectionLabel>
            </div>
            <div className="grid lg:grid-cols-2 gap-8">
              <h2
                data-animate
                style={{ ...stagger(80), lineHeight: '1.1', letterSpacing: '-0.025em' }}
                className="text-[clamp(1.9rem,4vw,3rem)] font-black text-white"
              >
                Contact Us
              </h2>
              <p data-animate style={{ ...stagger(120), color: 'rgba(255,255,255,0.48)' }} className="text-[15px] leading-relaxed flex items-end">
                The Traceo team is ready to assist with technical queries, account approvals, or system operation support. Reach out through our official channels.
              </p>
            </div>
          </div>

          {/* Contact strips */}
          <div>
            <ContactStrip
              delay={0}
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              title="System Administrator"
              badge="admin@traceo.my"
              desc="For new account approvals, role-based access control (RBAC) setup, and data security support."
              href="mailto:admin@traceo.my"
              btnLabel="Email Admin"
            />
            <ContactStrip
              delay={80}
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              title="Operations Officer"
              badge="support@traceo.my"
              desc="For user technical assistance, system operation guidance, or general account inquiries."
              href="mailto:support@traceo.my"
              btnLabel="Contact Operations"
            />
            <ContactStrip
              delay={160}
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              title="Telegram Helpdesk"
              badge="@TraceoSupport"
              desc="Traceo official instant messaging channel for direct responses from on-duty technical personnel."
              href="https://t.me/TraceoSupport"
              btnLabel="Open Telegram"
            />
          </div>

          {/* Corporate metadata */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-0 border-t"
            style={{ borderColor: border }}
          >
            {[
              { label: 'Admin Email', value: 'admin@traceo.my', href: 'mailto:admin@traceo.my' },
              { label: 'Support Email', value: 'support@traceo.my', href: 'mailto:support@traceo.my' },
              { label: 'Operating Hours', value: 'Mon – Fri (9am – 5pm)', href: undefined },
              { label: 'Response SLA', value: '24-Hour Guarantee', href: undefined },
            ].map((item, i) => (
              <div
                key={item.label}
                data-animate
                style={{ ...stagger(i * 60), borderRight: i < 3 ? `1px solid ${border}` : 'none' }}
                className="px-6 py-6"
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.label}</div>
                {item.href ? (
                  <a href={item.href} className="text-[13px] font-bold text-white hover:text-teal-400 transition-colors">{item.value}</a>
                ) : (
                  <span className="text-[13px] font-bold text-white">{item.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer
        className="w-full border-t"
        style={{ background: darkAlt, borderColor: border }}
      >
        {/* Top footer row — Vita Travel "+Links" style */}
        <div className="max-w-[1360px] mx-auto grid grid-cols-1 md:grid-cols-3 border-b" style={{ borderColor: border }}>
          {/* Logo block */}
          <div className="flex items-center gap-2 px-6 md:px-10 lg:px-16 py-10 border-b md:border-b-0 md:border-r" style={{ borderColor: border }}>
            <span style={{ color: '#0d9488', fontSize: 16 }}>✳</span>
            <span className="text-white font-bold text-[15px] tracking-tight">Traceo</span>
          </div>
          {/* Links — large Vita Travel footer nav style */}
          <div className="px-10 py-10 border-b md:border-b-0 md:border-r" style={{ borderColor: border }}>
            {['Facilities', 'About System', 'Privacy Policy', 'Terms of Service', 'Contact Us'].map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(' ', '-').replace(/\s+/g, '-')}`}
                className="flex items-center gap-1 text-[17px] font-semibold text-white/60 hover:text-white transition-colors duration-200 leading-relaxed"
              >
                <span style={{ color: '#0d9488', fontSize: 12, marginRight: 4 }}>+</span>
                {link}
              </a>
            ))}
          </div>
          {/* Contact info */}
          <div className="px-10 py-10 flex flex-col justify-center gap-3">
            <a href="mailto:admin@traceo.my" className="text-[15px] font-semibold text-white/70 hover:text-white transition-colors duration-200">
              admin@traceo.my
            </a>
            <a href="mailto:support@traceo.my" className="text-[15px] font-semibold text-white/70 hover:text-white transition-colors duration-200">
              support@traceo.my
            </a>
            <a href="https://t.me/TraceoSupport" className="text-[15px] font-semibold text-white/70 hover:text-white transition-colors duration-200">
              @TraceoSupport
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="max-w-[1360px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 px-6 md:px-10 lg:px-16 py-5 text-[12px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
          <span>© 2026 Traceo. All Rights Reserved.</span>
          <div className="flex items-center gap-5">
            <a href="#privacy" className="hover:text-white/60 transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-white/60 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
