'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState, ViewTransition } from 'react'
import { motion } from 'motion/react'
import { ArrowUpRight, ArrowRight, ChevronRight, Check } from 'lucide-react'

/* ─────────────────────────────────────────────────────────────────────────────
   Design Tokens
───────────────────────────────────────────────────────────────────────────── */
const C = {
  bg: '#FFFFFF',
  bgAlt: '#F4F6FF',
  bgAlt2: '#F8F9FF',
  text: '#0D0E14',
  textSub: '#6B7287',
  textMuted: '#9CA3AF',
  brand: '#0066FF',
  brandHover: '#0048CC',
  brandSubtle: '#EBF2FF',
  border: 'rgba(0,0,0,0.07)',
  borderMid: 'rgba(0,0,0,0.12)',
  dark: '#060618',
  darkAlt: '#0A0A22',
}

// Module-level font strings (shared by all sub-components)
const FU = "'Fustat', system-ui, sans-serif"
const DM = "'DM Sans', system-ui, sans-serif"

/* ─────────────────────────────────────────────────────────────────────────────
   Scroll Reveal
───────────────────────────────────────────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const t = setTimeout(() => {
      const io = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('in-view')
              io.unobserve(e.target)
            }
          }),
        { threshold: 0.07, rootMargin: '0px 0px -40px 0px' }
      )
      document.querySelectorAll('[data-animate]').forEach((el) => io.observe(el))
      return () => io.disconnect()
    }, 100)
    return () => clearTimeout(t)
  }, [])
}

type AS = React.CSSProperties & { '--stagger'?: string }
const s = (ms: number): AS => ({ '--stagger': `${ms}ms` }) as AS

/* ─────────────────────────────────────────────────────────────────────────────
   Inline hover helper (pure CSS hover without state)
───────────────────────────────────────────────────────────────────────────── */
const hover = {
  navLink: (e: React.MouseEvent<HTMLAnchorElement>, on: boolean) => {
    e.currentTarget.style.color = on ? C.text : C.textSub
    e.currentTarget.style.background = on ? 'rgba(0,0,0,0.04)' : 'transparent'
  },
  cta: (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, on: boolean) => {
    e.currentTarget.style.transform = on ? 'translateY(-1px) scale(1.01)' : 'none'
    e.currentTarget.style.boxShadow = on
      ? 'inset 0px 4px 4px 0px rgba(255,255,255,0.28), 0 12px 40px rgba(0,102,255,0.45)'
      : 'inset 0px 4px 4px 0px rgba(255,255,255,0.22), 0 6px 24px rgba(0,102,255,0.3)'
  },
  ghost: (e: React.MouseEvent<HTMLAnchorElement>, on: boolean) => {
    e.currentTarget.style.color = on ? C.text : C.textSub
    e.currentTarget.style.borderColor = on ? C.borderMid : C.border
  },
}

/* ─────────────────────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────────────────────── */

function FeatureRow({
  num,
  title,
  desc,
  delay = 0,
}: {
  num: string
  title: string
  desc: string
  delay?: number
}) {
  return (
    <div
      data-animate
      style={s(delay)}
      className="group flex gap-8 py-8 border-b cursor-default"
      onMouseEnter={(e) => {
        e.currentTarget.style.background = C.bgAlt2
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <span
        style={{
          fontFamily: "'DM Sans', system-ui",
          fontSize: 12,
          fontWeight: 600,
          color: C.brand,
          letterSpacing: '0.06em',
          minWidth: 32,
          paddingTop: 4,
        }}
      >
        {num}
      </span>
      <div>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: C.text,
            marginBottom: 6,
            letterSpacing: '-0.02em',
            fontFamily: "'Fustat', system-ui",
          }}
        >
          {title}
        </h3>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: C.textSub, maxWidth: 520 }}>{desc}</p>
      </div>
      <div className="ml-auto flex items-start pt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <ArrowRight size={16} color={C.brand} />
      </div>
    </div>
  )
}

function ContactRow({
  icon,
  title,
  value,
  href,
}: {
  icon: React.ReactNode
  title: string
  value: string
  href: string
}) {
  return (
    <a
      href={href}
      className="group flex items-center gap-4 py-5 border-b transition-colors duration-200"
      style={{ textDecoration: 'none', color: C.text }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = C.brand
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = C.text
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: C.bgAlt,
          border: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: C.textSub,
          flexShrink: 0,
          transition: 'background 0.2s, color 0.2s',
        }}
        className="group-hover:bg-blue-50 group-hover:!text-blue-500"
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: C.textMuted,
            marginBottom: 2,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{value}</div>
      </div>
      <ArrowUpRight
        size={16}
        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: C.brand }}
      />
    </a>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────────────────────── */
export default function HeroSection() {
  const [loaded, setLoaded] = useState(false)
  useScrollReveal()
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 60)
    return () => clearTimeout(t)
  }, [])

  return (
    <div id="top" style={{ background: C.bg, color: C.text, fontFamily: DM }}>
      {/* ═══════════════════════════════════════════════════════════════
          LIQUID GLASS FLOATING NAV
      ═══════════════════════════════════════════════════════════════ */}
      <div
        className="sticky top-0 z-50 flex justify-center w-full pointer-events-none px-4"
        style={{ paddingTop: 20 }}
      >
        <nav
          className="pointer-events-auto flex items-center gap-0.5"
          style={{
            padding: '5px 6px 5px 14px',
            borderRadius: 16,
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(50px) saturate(200%)',
            WebkitBackdropFilter: 'blur(50px) saturate(200%)',
            border: '1px solid rgba(0,0,0,0.09)',
            boxShadow: 'inset 0px 4px 4px 0px rgba(255,255,255,0.5), 0 2px 24px rgba(0,0,0,0.08)',
          }}
        >
          {/* Logo */}
          <a
            href="#top"
            className="flex items-center gap-2 mr-2 select-none"
            style={{ textDecoration: 'none' }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: C.brand,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L1.5 4.5v5L7 13l5.5-3.5v-5L7 1z" fill="rgba(255,255,255,0.9)" />
                <path
                  d="M7 4.5v5M4.5 6L7 7.5 9.5 6"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: C.text,
                letterSpacing: '-0.02em',
                fontFamily: FU,
              }}
            >
              Traceo
            </span>
          </a>

          {/* Links */}
          <div className="hidden md:flex items-center">
            {[
              { label: 'Features', href: '#features' },
              { label: 'About', href: '#about' },
              { label: 'Platform', href: '#facilities' },
              { label: 'Contact', href: '#contact' },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                style={{
                  display: 'block',
                  padding: '5px 11px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 500,
                  color: C.textSub,
                  textDecoration: 'none',
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={(e) => hover.navLink(e, true)}
                onMouseLeave={(e) => hover.navLink(e, false)}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <Link
            href="/login"
            id="nav-get-started"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 34,
              padding: '0 14px',
              marginLeft: 4,
              borderRadius: 12,
              background: C.brand,
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow:
                'inset 0px 2px 3px 0px rgba(255,255,255,0.22), 0 2px 8px rgba(0,102,255,0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            Get Started
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 5,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronRight size={11} />
            </div>
          </Link>
        </nav>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          HERO — Split Screen: White Left / Dark Right
      ═══════════════════════════════════════════════════════════════ */}
      <ViewTransition enter="hero-enter" default="none">
        <section className="relative" style={{ marginTop: -60, minHeight: '100dvh' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2" style={{ minHeight: '100dvh' }}>
            {/* ── LEFT PANEL: White content ── */}
            <div
              className="relative flex flex-col justify-center"
              style={{
                background: C.bg,
                paddingTop: 'clamp(100px, 18vh, 160px)',
                paddingBottom: 80,
                paddingLeft: 'clamp(24px, 6vw, 80px)',
                paddingRight: 'clamp(24px, 4vw, 60px)',
                zIndex: 2,
              }}
            >
              {/* Background glow — top left blue */}
              <div
                className="pointer-events-none absolute"
                aria-hidden
                style={{
                  top: 0,
                  left: 0,
                  width: 520,
                  height: 480,
                  background:
                    'radial-gradient(ellipse at 20% 20%, rgba(0,102,255,0.10) 0%, rgba(96,177,255,0.06) 40%, transparent 70%)',
                  filter: 'blur(48px)',
                }}
              />
              <div
                className="pointer-events-none absolute"
                aria-hidden
                style={{
                  bottom: '10%',
                  right: '-10%',
                  width: 360,
                  height: 320,
                  background: 'radial-gradient(ellipse, rgba(0,102,255,0.06) 0%, transparent 65%)',
                  filter: 'blur(40px)',
                }}
              />

              {/* Headline */}
              <h1
                style={{
                  fontFamily: FU,
                  fontSize: 'clamp(2.8rem, 5.8vw, 5rem)',
                  fontWeight: 900,
                  lineHeight: 1.02,
                  letterSpacing: '-0.035em',
                  color: C.text,
                  marginBottom: 20,
                  opacity: loaded ? 1 : 0,
                  transform: loaded ? 'none' : 'translateY(24px)',
                  transition:
                    'opacity 0.7s 0.15s ease, transform 0.7s 0.15s cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                Log the visit.
                <br />
                <span style={{ color: C.brand }}>Track the account.</span>{' '}
                <span style={{ color: 'rgba(13,14,20,0.28)' }}>Export the report.</span>
              </h1>

              {/* Subtitle — max 20 words */}
              <p
                style={{
                  fontSize: 17,
                  lineHeight: 1.65,
                  color: C.textSub,
                  maxWidth: 440,
                  marginBottom: 36,
                  opacity: loaded ? 1 : 0,
                  transform: loaded ? 'none' : 'translateY(18px)',
                  transition:
                    'opacity 0.7s 0.26s ease, transform 0.7s 0.26s cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                Log monitoring visits, check arrear status, and export Word reports for all three JV
                categories.
              </p>

              {/* CTA row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                  opacity: loaded ? 1 : 0,
                  transform: loaded ? 'none' : 'translateY(14px)',
                  transition:
                    'opacity 0.7s 0.38s ease, transform 0.7s 0.38s cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                <Link
                  href="/login"
                  id="hero-get-started"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    height: 52,
                    padding: '0 24px',
                    borderRadius: 16,
                    background: C.brand,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow:
                      'inset 0px 4px 4px 0px rgba(255,255,255,0.22), 0 6px 24px rgba(0,102,255,0.3)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    fontFamily: FU,
                  }}
                  onMouseEnter={(e) => hover.cta(e, true)}
                  onMouseLeave={(e) => hover.cta(e, false)}
                >
                  Get Started
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ArrowRight size={14} />
                  </div>
                </Link>

                <a
                  href="#about"
                  id="hero-see-how"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    height: 52,
                    padding: '0 20px',
                    borderRadius: 16,
                    background: 'transparent',
                    border: `1.5px solid ${C.border}`,
                    color: C.textSub,
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'border-color 0.2s, color 0.2s',
                  }}
                  onMouseEnter={(e) => hover.ghost(e, true)}
                  onMouseLeave={(e) => hover.ghost(e, false)}
                >
                  What it does
                  <ArrowRight size={14} />
                </a>
              </div>

              {/* Trust micro-strip — below CTAs */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  marginTop: 28,
                  opacity: loaded ? 1 : 0,
                  transition: 'opacity 0.7s 0.55s ease',
                }}
              >
                {['Role-based access', 'Word & PDF export', 'JV1 · JV2 · JV3'].map((item) => (
                  <div
                    key={item}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 11,
                      fontWeight: 600,
                      color: C.textMuted,
                    }}
                  >
                    <Check size={12} color={C.brand} strokeWidth={2.5} />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT PANEL: Transparent — orb floats on white via invert+multiply ── */}
            <div
              className="relative hidden lg:flex items-center justify-center overflow-hidden"
              style={{ background: 'transparent', minHeight: '100dvh' }}
            >
              {/* Soft blue/violet glow behind the orb */}
              <div className="pointer-events-none absolute inset-0" aria-hidden>
                <div
                  style={{
                    position: 'absolute',
                    top: '10%',
                    left: '5%',
                    width: 500,
                    height: 500,
                    background:
                      'radial-gradient(ellipse, rgba(0,102,255,0.09) 0%, rgba(96,140,255,0.04) 40%, transparent 70%)',
                    filter: 'blur(64px)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '15%',
                    right: '0%',
                    width: 350,
                    height: 320,
                    background:
                      'radial-gradient(ellipse, rgba(100,60,255,0.07) 0%, transparent 65%)',
                    filter: 'blur(52px)',
                  }}
                />
              </div>

              {/* Orb video
                  Technique: invert(1) flips black→white, then mix-blend-mode:multiply
                  makes that white invisible on the page background.
                  hue-rotate(150deg) converts the inverted purple back to electric blue. */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    width: '85%',
                    height: '85%',
                    objectFit: 'contain',
                    mixBlendMode: 'multiply',
                    filter: 'invert(1) hue-rotate(150deg) saturate(200%) brightness(1.15)',
                    transform: 'scale(0.85)',
                    pointerEvents: 'none',
                  }}
                >
                  <source
                    src="https://future.co/images/homepage/glassy-orb/orb-purple.webm"
                    type="video/webm"
                  />
                </video>
              </div>
            </div>
          </div>

          {/* Subtle vertical divider — desktop */}
          <div
            className="hidden lg:block absolute top-0 bottom-0"
            style={{
              left: '50%',
              width: 1,
              background: `linear-gradient(180deg, transparent 0%, ${C.border} 30%, ${C.border} 70%, transparent 100%)`,
              zIndex: 3,
            }}
          />
        </section>
      </ViewTransition>

      {/* ═══════════════════════════════════════════════════════════════
          LOGO STRIP — "Powered by" tech stack
      ═══════════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: C.bg,
          borderTop: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-6">
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: C.textMuted,
              flexShrink: 0,
            }}
          >
            Powered by
          </span>
          <div className="flex flex-wrap items-center gap-8">
            {[
              { name: 'Supabase', slug: 'supabase' },
              { name: 'Next.js', slug: 'nextdotjs' },
              { name: 'AWS', slug: 'aws', isSvg: true },
              { name: 'Cloudinary', slug: 'cloudinary' },
              { name: 'Google', slug: 'google' },
            ].map((logo) => (
              <div
                key={logo.slug}
                className="flex items-center gap-2 opacity-40 hover:opacity-70 transition-opacity duration-200"
              >
                {logo.isSvg ? (
                  <svg width="22" height="15" viewBox="0 0 304 182" fill="none">
                    <path
                      fill={C.text}
                      d="M86.4,66.4c0,3.7,0.4,6.7,1.1,8.9c0.8,2.2,1.8,4.6,3.2,7.2c0.5,0.8,0.7,1.6,0.7,2.3c0,1-0.6,2-1.9,3l-6.3,4.2c-0.9,0.6-1.8,0.9-2.6,0.9c-1,0-2-0.5-3-1.4C76.2,90,75,88.4,74,86.8c-1-1.7-2-3.6-3.1-5.9c-7.8,9.2-17.6,13.8-29.4,13.8c-8.4,0-15.1-2.4-20-7.2c-4.9-4.8-7.4-11.2-7.4-19.2c0-8.5,3-15.4,9.1-20.6c6.1-5.2,14.2-7.8,24.5-7.8c3.4,0,6.9,0.3,10.6,0.8c3.7,0.5,7.5,1.3,11.5,2.2v-7.3c0-7.6-1.6-12.9-4.7-16c-3.2-3.1-8.6-4.6-16.3-4.6c-3.5,0-7.1,0.4-10.8,1.3c-3.7,0.9-7.3,2-10.8,3.4c-1.6,0.7-2.8,1.1-3.5,1.3c-0.7,0.2-1.2,0.3-1.6,0.3c-1.4,0-2.1-1-2.1-3.1v-4.9c0-1.6,0.2-2.8,0.7-3.5c0.5-0.7,1.4-1.4,2.8-2.1c3.5-1.8,7.7-3.3,12.6-4.5c4.9-1.3,10.1-1.9,15.6-1.9c11.9,0,20.6,2.7,26.2,8.1c5.5,5.4,8.3,13.6,8.3,24.6V66.4z M45.8,81.6c3.3,0,6.7-0.6,10.3-1.8c3.6-1.2,6.8-3.4,9.5-6.4c1.6-1.9,2.8-4,3.4-6.4c0.6-2.4,1-5.3,1-8.7v-4.2c-2.9-0.7-6-1.3-9.2-1.7c-3.2-0.4-6.3-0.6-9.4-0.6c-6.7,0-11.6,1.3-14.9,4c-3.3,2.7-4.9,6.5-4.9,11.5c0,4.7,1.2,8.2,3.7,10.6C37.7,80.4,41.2,81.6,45.8,81.6z M126.1,92.4c-1.8,0-3-0.3-3.8-1c-0.8-0.6-1.5-2-2.1-3.9L96.7,10.2c-0.6-2-0.9-3.3-0.9-4c0-1.6,0.8-2.5,2.4-2.5h9.8c1.9,0,3.2,0.3,3.9,1c0.8,0.6,1.4,2,2,3.9l16.8,66.2l15.6-66.2c0.5-2,1.1-3.3,1.9-3.9c0.8-0.6,2.2-1,4-1h8c1.9,0,3.2,0.3,4,1c0.8,0.6,1.5,2,1.9,3.9l15.8,67l17.3-67c0.6-2,1.3-3.3,2-3.9c0.8-0.6,2.1-1,3.9-1h9.3c1.6,0,2.5,0.8,2.5,2.5c0,0.5-0.1,1-0.2,1.6c-0.1,0.6-0.3,1.4-0.7,2.5l-24.1,77.3c-0.6,2-1.3,3.3-2.1,3.9c-0.8,0.6-2.1,1-3.8,1h-8.6c-1.9,0-3.2-0.3-4-1c-0.8-0.7-1.5-2-1.9-4L156,23l-15.4,64.4c-0.5,2-1.1,3.3-1.9,4c-0.8,0.7-2.2,1-4,1H126.1z M254.6,95.1c-5.2,0-10.4-0.6-15.4-1.8c-5-1.2-8.9-2.5-11.5-4c-1.6-0.9-2.7-1.9-3.1-2.8c-0.4-0.9-0.6-1.9-0.6-2.8v-5.1c0-2.1,0.8-3.1,2.3-3.1c0.6,0,1.2,0.1,1.8,0.3c0.6,0.2,1.5,0.6,2.5,1c3.4,1.5,7.1,2.7,11,3.5c4,0.8,7.9,1.2,11.9,1.2c6.3,0,11.2-1.1,14.6-3.3c3.4-2.2,5.2-5.4,5.2-9.5c0-2.8-0.9-5.1-2.7-7c-1.8-1.9-5.2-3.6-10.1-5.2L246,52c-7.3-2.3-12.7-5.7-16-10.2c-3.3-4.4-5-9.3-5-14.5c0-4.2,0.9-7.9,2.7-11.1c1.8-3.2,4.2-6,7.2-8.2c3-2.3,6.4-4,10.4-5.2c4-1.2,8.2-1.7,12.6-1.7c2.2,0,4.5,0.1,6.7,0.4c2.3,0.3,4.4,0.7,6.5,1.1c2,0.5,3.9,1,5.7,1.6c1.8,0.6,3.2,1.2,4.2,1.8c1.4,0.8,2.4,1.6,3,2.5c0.6,0.8,0.9,1.9,0.9,3.3v4.7c0,2.1-0.8,3.2-2.3,3.2c-0.8,0-2.1-0.4-3.8-1.2c-5.7-2.6-12.1-3.9-19.2-3.9c-5.7,0-10.2,0.9-13.3,2.8c-3.1,1.9-4.7,4.8-4.7,8.9c0,2.8,1,5.2,3,7.1c2,1.9,5.7,3.8,11,5.5l14.2,4.5c7.2,2.3,12.4,5.5,15.5,9.6c3.1,4.1,4.6,8.8,4.6,14c0,4.3-0.9,8.2-2.6,11.6c-1.8,3.4-4.2,6.4-7.3,8.8c-3.1,2.5-6.8,4.3-11.1,5.6C264.4,94.4,259.7,95.1,254.6,95.1z"
                    />
                    <path
                      fill={C.text}
                      d="M273.5,143.7c-32.9,24.3-80.7,37.2-121.8,37.2c-57.6,0-109.5-21.3-148.7-56.7c-3.1-2.8-0.3-6.6,3.4-4.4c42.4,24.6,94.7,39.5,148.8,39.5c36.5,0,76.6-7.6,113.5-23.2C274.2,133.6,278.9,139.7,273.5,143.7z"
                    />
                    <path
                      fill={C.text}
                      d="M287.2,128.1c-4.2-5.4-27.8-2.6-38.5-1.3c-3.2,0.4-3.7-2.4-0.8-4.5c18.8-13.2,49.7-9.4,53.3-5c3.6,4.5-1,35.4-18.6,50.2c-2.7,2.3-5.3,1.1-4.1-1.9C282.5,155.7,291.4,133.4,287.2,128.1z"
                    />
                  </svg>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`https://cdn.simpleicons.org/${logo.slug}/${C.text.replace('#', '')}`}
                    alt={logo.name}
                    width={18}
                    height={18}
                    style={{ objectFit: 'contain' }}
                  />
                )}
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{logo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FACILITIES — Bento grid (asymmetric)
      ═══════════════════════════════════════════════════════════════ */}
      <section
        id="facilities"
        className="scroll-mt-20"
        style={{ background: C.bgAlt2, borderBottom: `1px solid ${C.border}` }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-20 md:py-28">
          {/* Header — no eyebrow (restrained) */}
          <div className="max-w-xl mb-16">
            <h2
              data-animate
              style={{ ...s(0), fontFamily: FU }}
              className="text-[clamp(2rem,4.5vw,3.4rem)] font-black leading-none tracking-tight mb-4"
            >
              Three JV types.
              <br />
              <span style={{ color: C.textMuted }}>One place.</span>
            </h2>
            <p
              data-animate
              style={{ ...s(80), color: C.textSub, fontSize: 16, lineHeight: 1.65, maxWidth: 420 }}
            >
              JV Syarikat, Tanah, dan Pinjaman Individu. Same system, same process, same reports.
            </p>
          </div>

          {/* Asymmetric bento grid: 1 large + 2 small */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Large card — JV1 */}
            <div
              data-animate
              style={{
                ...s(0),
                background: C.dark,
                minHeight: 320,
                border: `1px solid rgba(255,255,255,0.06)`,
              }}
              className="lg:col-span-2 rounded-2xl overflow-hidden relative flex flex-col justify-end group"
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'radial-gradient(ellipse at 70% 30%, rgba(0,102,255,0.3) 0%, transparent 60%)',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 28,
                  right: 28,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.3)',
                  textTransform: 'uppercase',
                }}
              >
                JV Syarikat
              </div>
              {/* Abstract bar chart decoration */}
              <div
                className="absolute bottom-20 left-8 flex items-end gap-1.5"
                style={{ pointerEvents: 'none' }}
              >
                {[35, 60, 42, 88, 55, 72, 48, 90, 65].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      width: 10,
                      height: h * 1.2,
                      background: i === 7 ? C.brand : `rgba(0,102,255,${0.12 + i * 0.04})`,
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.4s',
                    }}
                  />
                ))}
              </div>
              <div style={{ position: 'relative', padding: '0 28px 28px', zIndex: 2 }}>
                <div
                  style={{
                    fontFamily: FU,
                    fontSize: 28,
                    fontWeight: 900,
                    color: '#fff',
                    lineHeight: 1.1,
                    marginBottom: 6,
                  }}
                >
                  JV1 · Syarikat
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                  Corporate accounts: akaun status, tunggakan, dan susulan.
                </div>
              </div>
            </div>

            {/* JV2 */}
            <div
              data-animate
              style={{
                ...s(100),
                background: C.bgAlt,
                minHeight: 200,
                border: `1px solid ${C.border}`,
                padding: 28,
              }}
              className="rounded-2xl relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: C.brand,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom: 12,
                  }}
                >
                  JV Tanah
                </div>
                <div
                  style={{
                    fontFamily: FU,
                    fontSize: 22,
                    fontWeight: 900,
                    color: C.text,
                    lineHeight: 1.1,
                    marginBottom: 8,
                  }}
                >
                  JV2 · Tanah
                </div>
                <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.6 }}>
                  Land financing. Log site visits, track progress, export kronologi.
                </div>
              </div>
              <div className="flex items-end gap-1 mt-6">
                {[20, 40, 30, 60, 45, 55, 35].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: h,
                      background: i === 5 ? C.brand : `rgba(0,102,255,${0.08 + i * 0.05})`,
                      borderRadius: '3px 3px 0 0',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* JV3 */}
            <div
              data-animate
              style={{ ...s(180), background: C.brand, minHeight: 200, padding: 28 }}
              className="rounded-2xl relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.6)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom: 12,
                  }}
                >
                  Pinjaman Individu
                </div>
                <div
                  style={{
                    fontFamily: FU,
                    fontSize: 22,
                    fontWeight: 900,
                    color: '#fff',
                    lineHeight: 1.1,
                    marginBottom: 8,
                  }}
                >
                  JV3 · Individu
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
                  Individual loans. Log visits, monitor status, generate PDF.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ArrowUpRight size={14} color="#fff" />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                  Active accounts: 100+
                </span>
              </div>
            </div>

            {/* Stats card */}
            <div
              data-animate
              style={{
                ...s(240),
                background: C.bgAlt,
                minHeight: 160,
                padding: '28px 36px',
                border: `1px solid ${C.border}`,
              }}
              className="rounded-2xl flex flex-col justify-center gap-6 lg:col-span-2"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { v: '100+', l: 'Facilities tracked' },
                  { v: '3', l: 'JV categories' },
                  { v: '.docx', l: 'Report format' },
                  { v: 'RBAC', l: 'Access control' },
                ].map((stat) => (
                  <div key={stat.v}>
                    <div
                      style={{
                        fontFamily: FU,
                        fontSize: 28,
                        fontWeight: 900,
                        color: C.text,
                        lineHeight: 1,
                      }}
                    >
                      {stat.v}
                    </div>
                    <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{stat.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ABOUT — Dashboard mockup + text
      ═══════════════════════════════════════════════════════════════ */}
      <section
        id="about"
        className="scroll-mt-20"
        style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text */}
            <div>
              <h2
                data-animate
                style={{ ...s(0), fontFamily: FU }}
                className="text-[clamp(2rem,4vw,3.2rem)] font-black leading-tight tracking-tight mb-6"
              >
                Log it.
                <br />
                Report it.
              </h2>
              <p
                data-animate
                style={{
                  ...s(80),
                  color: C.textSub,
                  fontSize: 16,
                  lineHeight: 1.7,
                  marginBottom: 24,
                  maxWidth: 440,
                }}
              >
                Log monitoring visits, attach photos, check account status, and export Word reports.
                No file switching.
              </p>

              <div data-animate style={s(160)} className="space-y-3">
                {[
                  'All three JV types in one system. No separate files.',
                  'Every visit logged with date, notes, and photos',
                  'Export to Word and PDF directly from logged visits',
                  'Admin, Pengurus, Pegawai Susulan. Each sees only what they need.',
                ].map((item) => (
                  <div
                    key={item}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontSize: 14,
                      color: C.textSub,
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: C.brandSubtle,
                        border: `1px solid rgba(0,102,255,0.2)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Check size={11} color={C.brand} strokeWidth={2.5} />
                    </div>
                    {item}
                  </div>
                ))}
              </div>

              <div data-animate style={{ ...s(240), marginTop: 36 }}>
                <Link
                  href="/login"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    color: C.brand,
                    textDecoration: 'none',
                  }}
                >
                  Get Started <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Right: Dashboard image */}
            <div
              data-animate
              style={{
                ...s(120),
                border: `1px solid ${C.border}`,
                boxShadow: `0 24px 80px rgba(0,0,0,0.08)`,
              }}
              className="relative rounded-2xl overflow-hidden"
            >
              <Image
                src="/traceo-dashboard.png"
                alt="Traceo dashboard showing JV facility monitoring overview"
                width={800}
                height={450}
                style={{ width: '100%', height: 'auto', display: 'block' }}
                priority={false}
              />
              {/* Gradient overlay bottom */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 80,
                  background: 'linear-gradient(transparent, rgba(255,255,255,0.6))',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FEATURES — Numbered editorial list (not card grid)
      ═══════════════════════════════════════════════════════════════ */}
      <section
        id="features"
        className="scroll-mt-20"
        style={{ background: C.bgAlt2, borderBottom: `1px solid ${C.border}` }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-20 md:py-28">
          <div className="grid lg:grid-cols-[340px_1fr] gap-16">
            {/* Left sticky header */}
            <div className="lg:sticky" style={{ top: 100, alignSelf: 'start' }}>
              <h2
                data-animate
                style={{ ...s(0), fontFamily: FU }}
                className="text-[clamp(2rem,4vw,3rem)] font-black leading-tight tracking-tight mb-5"
              >
                Five things Traceo does.
              </h2>
              <p
                data-animate
                style={{
                  ...s(80),
                  color: C.textSub,
                  fontSize: 15,
                  lineHeight: 1.7,
                  marginBottom: 28,
                }}
              >
                Five core functions. Nothing more.
              </p>
              <div data-animate style={s(160)}>
                <Link
                  href="/login"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    height: 44,
                    padding: '0 20px',
                    borderRadius: 12,
                    background: C.brand,
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: 'none',
                    fontFamily: FU,
                  }}
                >
                  Use Traceo <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Right: numbered list */}
            <div style={{ borderTop: `1px solid ${C.border}` }}>
              <FeatureRow
                delay={0}
                num="01"
                title="Centralized Facility Database"
                desc="Account details, borrower info, and financing amounts for every JV facility. JV1, JV2, and JV3 in one database."
              />
              <FeatureRow
                delay={80}
                num="02"
                title="Chronology Tracking"
                desc="Log each site visit: date, notes, photos. Every susulan is permanently recorded in sequence, tied to the facility."
              />
              <FeatureRow
                delay={160}
                num="03"
                title="Official Report Generation"
                desc="Generate a full kronologi report in Word and PDF, directly from logged visits. No copy-pasting, no formatting."
              />
              <FeatureRow
                delay={240}
                num="04"
                title="RBAC Access Control"
                desc="Three roles: Admin, Pengurus, Pegawai Susulan. Each sees and does exactly what's relevant. Nothing more."
              />
              <FeatureRow
                delay={320}
                num="05"
                title="Real-Time Portfolio Overview"
                desc="The dashboard shows which accounts are overdue, which need a visit, and what's been resolved. No digging required."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CONTACT
      ═══════════════════════════════════════════════════════════════ */}
      <section
        id="contact"
        className="scroll-mt-20"
        style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Left */}
            <div>
              <h2
                data-animate
                style={{ ...s(0), fontFamily: FU }}
                className="text-[clamp(2rem,4vw,3rem)] font-black leading-tight tracking-tight mb-5"
              >
                Questions?
                <br />
                Let&apos;s talk.
              </h2>
              <p data-animate style={{ ...s(80), color: C.textSub, fontSize: 15, lineHeight: 1.7 }}>
                Drop us a message for account access, technical issues, or anything else. We&apos;ll get
                back to you.
              </p>
            </div>

            {/* Right: contact links */}
            <div data-animate style={s(120)}>
              <ContactRow
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="2"
                      y="4"
                      width="20"
                      height="16"
                      rx="3"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                }
                title="System Administrator"
                value="admin@traceo.my"
                href="mailto:admin@traceo.my"
              />
              <ContactRow
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="2"
                      y="4"
                      width="20"
                      height="16"
                      rx="3"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                }
                title="Operations Officer"
                value="support@traceo.my"
                href="mailto:support@traceo.my"
              />
              <ContactRow
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
                title="Telegram Helpdesk"
                value="@TraceoSupport"
                href="https://t.me/TraceoSupport"
              />

              {/* SLA info */}
              <div
                style={{
                  marginTop: 24,
                  padding: '16px 20px',
                  borderRadius: 14,
                  background: C.bgAlt,
                  border: `1px solid ${C.border}`,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#22c55e',
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                    Office Hours Support
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>Mon – Fri, 9 am – 5 pm</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          PREMIUM FOOTER — Layered card + glass text
      ═══════════════════════════════════════════════════════════════ */}
      <footer className="w-full" style={{ background: '#F0F1F3' }}>
        <div className="px-4 pt-12 pb-0 flex flex-col items-center gap-0">
          <FooterCard />
          <GlassText />
        </div>
      </footer>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Footer Sub-Components
───────────────────────────────────────────────────────────────────────────── */

function FooterLogoIcon() {
  return (
    <div
      className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0"
      style={{ background: C.brand }}
    >
      <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
        <path d="M7 1L1.5 4.5v5L7 13l5.5-3.5v-5L7 1z" fill="rgba(255,255,255,0.9)" />
        <path
          d="M7 4.5v5M4.5 6L7 7.5 9.5 6"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

function FooterCard() {
  const socials = [
    {
      label: 'LinkedIn',
      svg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect
            x="2"
            y="9"
            width="4"
            height="12"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      ),
    },
    {
      label: 'X / Twitter',
      svg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      label: 'Website',
      svg: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      ),
    },
  ]

  const cols: { header: string; links: { label: string; href: string }[] }[] = [
    {
      header: 'Platform',
      links: [
        { label: 'Fasiliti', href: '/dashboard/fasiliti' },
        { label: 'Tanah JV', href: '/dashboard/tanah-jv' },
        { label: 'Summary', href: '/dashboard/summary' },
        { label: 'Dashboard', href: '/dashboard' },
      ],
    },
    {
      header: 'Resources',
      links: [
        { label: 'Kronologi', href: '/dashboard/fasiliti' },
        { label: 'Reports', href: '/dashboard/summary' },
        { label: 'Audit Log', href: '/dashboard/audit' },
        { label: 'Assistant', href: '/dashboard/assistant' },
      ],
    },
    {
      header: 'Company',
      links: [
        { label: 'About Us', href: '#about' },
        { label: 'Contact', href: '#contact' },
        { label: 'Privacy', href: '#privacy' },
      ],
    },
  ]

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-[#E9EBEE] rounded-[48px] border border-slate-200 shadow-sm overflow-hidden">
        {/* Inner white box */}
        <div className="bg-white rounded-[40px] m-2 shadow-sm">
          <div className="p-8 md:p-10 lg:p-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 md:gap-12">
            {/* Brand block — spans 2 cols */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <FooterLogoIcon />
                  <span
                    className="text-[26px] font-bold tracking-tight text-[#0F172A]"
                    style={{ fontFamily: FU }}
                  >
                    Traceo
                  </span>
                </div>
                <p
                  className="text-[#64748B] leading-relaxed text-[16px] font-normal max-w-[320px]"
                  style={{ fontFamily: DM }}
                >
                  Facility monitoring for JV Syarikat, Tanah, and Pinjaman Individu. Log visits,
                  track accounts, export reports.
                </p>
              </div>

              {/* Social buttons */}
              <div className="flex items-center gap-3">
                {socials.map(({ svg, label }) => (
                  <button
                    key={label}
                    aria-label={label}
                    className="w-[44px] h-[44px] flex items-center justify-center rounded-xl border border-slate-100 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-slate-50 transition-all active:scale-95 text-slate-700 hover:text-slate-900"
                  >
                    {svg}
                  </button>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {cols.map((col) => (
              <div key={col.header} className="space-y-6">
                <h4 className="text-[14px] font-medium text-[#94A3B8]" style={{ fontFamily: DM }}>
                  {col.header}
                </h4>
                <ul className="space-y-4">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-[15px] font-medium text-[#1E293B] no-underline transition-colors duration-150"
                        style={{ fontFamily: DM }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = C.brand
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#1E293B'
                        }}
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Legal bar — outside white box, inside gray outer */}
        <div className="px-6 sm:px-12 md:px-16 lg:px-20 py-5 flex flex-col md:flex-row justify-between items-center gap-6 text-[15px]">
          <p className="text-[#64748B] font-medium" style={{ fontFamily: DM }}>
            © 2026 Traceo. Designed & Developed by{' '}
            <strong className="text-[#0066FF] font-bold">@syaakiirr</strong>. All rights reserved.
          </p>
          <div
            className="flex items-center gap-8 text-[#64748B] font-medium"
            style={{ fontFamily: DM }}
          >
            <a
              href="#privacy"
              className="transition-colors duration-150"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#1E293B'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#64748B'
              }}
            >
              Privacy Policy
            </a>
            <div className="w-[1px] h-4 bg-slate-300" />
            <a
              href="#terms"
              className="transition-colors duration-150"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#1E293B'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#64748B'
              }}
            >
              Terms of Use
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function GlassText() {
  return (
    <div className="relative w-full flex items-center justify-center select-none overflow-hidden pt-0">
      {/* Hidden SVG defining the glass filter */}
      <svg className="absolute w-0 h-0" aria-hidden focusable={false}>
        <defs>
          <filter id="glass-effect" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="6"
              floodColor="#000000"
              floodOpacity="0.25"
              result="outer-shadow"
            />
            <feComponentTransfer in="SourceAlpha" result="alpha">
              <feFuncA type="linear" slope="1" />
            </feComponentTransfer>
            <feOffset in="alpha" dx="0" dy="4" result="offset-white" />
            <feGaussianBlur in="offset-white" stdDeviation="4" result="blur-white" />
            <feComposite in="alpha" in2="blur-white" operator="out" result="inner-white-mask" />
            <feFlood floodColor="#ffffff" floodOpacity="0.25" result="white-fill" />
            <feComposite
              in="white-fill"
              in2="inner-white-mask"
              operator="in"
              result="inner-white-final"
            />
            <feGaussianBlur in="alpha" stdDeviation="6" result="blur-black" />
            <feComposite in="alpha" in2="blur-black" operator="out" result="inner-black-mask" />
            <feFlood floodColor="#000000" floodOpacity="0.25" result="black-fill" />
            <feComposite
              in="black-fill"
              in2="inner-black-mask"
              operator="in"
              result="inner-black-final"
            />
            <feMerge>
              <feMergeNode in="outer-shadow" />
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="inner-white-final" />
              <feMergeNode in="inner-black-final" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Glass branded text */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
      >
        <h2
          className="font-black tracking-normal leading-none select-none text-white px-4"
          style={{
            fontFamily: FU,
            fontSize: 'min(22vw, 340px)',
            filter: 'url(#glass-effect)',
          }}
        >
          Traceo
        </h2>
      </motion.div>
    </div>
  )
}
