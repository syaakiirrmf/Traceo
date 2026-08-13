'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { href: '/#kemudahan', label: 'Kemudahan' },
  { href: '/#tentang', label: 'Tentang Sistem' },
  { href: '/#ciri', label: 'Ciri-ciri' },
  { href: '/#hubungi', label: 'Hubungi' },
]

export default function NotFoundPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [menuOpen])

  return (
    <div
      className="w-full h-screen overflow-hidden flex flex-col relative font-dm"
      style={{ background: '#060618' }}
    >
      {/* ─────────────────────────────────────────────────────
          LAYER 1 — Ambient glow atmosphere (z-0)
      ───────────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        {/* centre glow */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 700,
            height: 600,
            background:
              'radial-gradient(ellipse, rgba(0,102,255,0.22) 0%, rgba(96,177,255,0.06) 45%, transparent 72%)',
            filter: 'blur(72px)',
          }}
        />
        {/* top-left leak */}
        <div
          style={{
            position: 'absolute',
            top: '-8%',
            left: '-4%',
            width: 420,
            height: 380,
            background: 'radial-gradient(ellipse, rgba(0,102,255,0.18) 0%, transparent 66%)',
            filter: 'blur(56px)',
          }}
        />
        {/* bottom-right accent */}
        <div
          style={{
            position: 'absolute',
            bottom: '-6%',
            right: '-4%',
            width: 460,
            height: 400,
            background: 'radial-gradient(ellipse, rgba(96,177,255,0.12) 0%, transparent 60%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* ─────────────────────────────────────────────────────
          LAYER 2 — Giant "404" watermark (z-10)
      ───────────────────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden"
        aria-hidden
      >
        <span
          className="font-fustat font-black leading-none tracking-tighter text-[#0066FF] select-none"
          style={{
            fontSize: 'clamp(180px, 40vw, 680px)',
            opacity: 0.08,
            letterSpacing: '-0.04em',
          }}
        >
          404
        </span>
      </div>

      {/* ─────────────────────────────────────────────────────
          LAYER 3 — Mascot animation video (z-20)
      ───────────────────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
        style={{ paddingTop: '56px', paddingBottom: '140px' }}
        aria-hidden
      >
        <div
          style={{
            width: 'clamp(220px, 44vw, 560px)',
            height: 'clamp(280px, 54vh, 640px)',
            background: 'transparent',
          }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              mixBlendMode: 'screen',
              background: 'transparent',
            }}
          >
            <source
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260713_234424_b1332b69-2e69-4302-8dbc-40f86846afbd.mp4"
              type="video/mp4"
            />
          </video>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────
          LAYER 4 — Top navigation (z-30)
      ───────────────────────────────────────────────────── */}
      <nav className="relative z-30 flex items-center justify-between px-5 sm:px-8 md:px-14 py-4 sm:py-5 flex-shrink-0">
        {/* Logo */}
        <Link
          href="/"
          transitionTypes={['nav-back']}
          className="flex items-center gap-2.5"
          style={{ textDecoration: 'none' }}
        >
          <div className="w-8 h-8 rounded-lg bg-[#0066FF] flex items-center justify-center shadow-[inset_0px_2px_4px_rgba(255,255,255,0.35),0_2px_8px_rgba(0,102,255,0.3)]">
            <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L1.5 4.5v5L7 13l5.5-3.5v-5L7 1z" fill="rgba(255,255,255,0.95)" />
              <path
                d="M7 4.5v5M4.5 6L7 7.5 9.5 6"
                stroke="rgba(0,102,255,0.8)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="text-white font-fustat font-bold text-[15px] tracking-tight">
            Traceo
          </span>
        </Link>

        {/* Desktop nav pills */}
        <div className="hidden md:flex items-center gap-1 bg-white/8 border border-white/10 rounded-full px-1.5 py-1.5 backdrop-blur-md">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-white/75 hover:text-white hover:bg-white/12 transition-all duration-150"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(true)}
          className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-full text-white text-sm font-semibold bg-[#0066FF]/80 hover:bg-[#0066FF] border border-[#0066FF]/40 backdrop-blur-sm transition-colors"
          aria-label="Buka menu"
        >
          <Menu className="w-4 h-4" />
          <span>Menu</span>
        </button>
      </nav>

      {/* ─────────────────────────────────────────────────────
          LAYER 5 — Bottom text + CTA (z-30)
      ───────────────────────────────────────────────────── */}
      <div className="relative z-30 mt-auto flex-shrink-0 flex flex-col items-center text-center px-4 pb-8 sm:pb-12 gap-3">
        {/* Sparkle accent */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="block w-1.5 h-1.5 rounded-full bg-[#0066FF] opacity-90 animate-ping" />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#60B1FF]">
            Ralat 404 &bull; Page Not Found
          </span>
          <span className="block w-1.5 h-1.5 rounded-full bg-[#0066FF] opacity-90 animate-ping" />
        </div>

        <h1 className="text-white text-xl sm:text-2xl md:text-3xl font-fustat font-black tracking-tight leading-tight">
          Halaman ini tidak wujud.
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-xs sm:max-w-sm leading-relaxed">
          Halaman yang anda cari telah dipadam atau URL yang dimasukkan tidak tepat.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-1 font-fustat">
          <Link
            href="/dashboard"
            transitionTypes={['nav-back']}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm bg-[#0066FF] hover:bg-[#0048CC] transition-all duration-200 shadow-lg hover:shadow-[#0066FF]/30 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Ke Dashboard
          </Link>
          <Link
            href="/"
            transitionTypes={['nav-back']}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white/80 font-bold text-sm border border-white/15 bg-white/8 hover:bg-white/15 transition-all duration-200 active:scale-95"
          >
            Laman Utama
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────
          LAYER 6 — Mobile menu drawer (z-50)
      ───────────────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-50 ${menuOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!menuOpen}
      >
        {/* Backdrop */}
        <div
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-400 ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        {/* Drawer */}
        <div
          className={`absolute top-0 right-0 h-full w-full sm:w-[360px] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
          style={{ background: 'linear-gradient(160deg, #102F2B 0%, #0a1a14 100%)' }}
        >
          {/* Drawer glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 80% 0%, rgba(13,148,136,0.18) 0%, transparent 55%)',
            }}
          />

          {/* Drawer header */}
          <div className="relative flex items-center justify-between px-6 py-5 border-b border-white/8">
            <Link
              href="/"
              className="flex items-center gap-2.5"
              onClick={() => setMenuOpen(false)}
              style={{ textDecoration: 'none' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 2L3 7v10l9 5 9-5V7L12 2z"
                  stroke="#0d9488"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                  fill="rgba(13,148,136,0.15)"
                />
                <path
                  d="M12 7v10M7 9.5l5 2.5 5-2.5"
                  stroke="#0d9488"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-white font-bold text-base">Traceo</span>
            </Link>
            <button
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
              aria-label="Tutup menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer links */}
          <div className="relative flex flex-col gap-1.5 px-5 pt-5">
            <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
              Navigasi
            </p>
            {NAV_LINKS.map((link, i) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`px-5 py-3.5 text-base font-semibold text-white rounded-xl bg-white/8 hover:bg-teal-500/20 hover:text-teal-200 border border-white/8 hover:border-teal-500/30 transition-all duration-300 ${menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                style={{ transitionDelay: menuOpen ? `${120 + i * 55}ms` : '0ms' }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Drawer footer CTA */}
          <div className="relative mt-auto p-5 pb-8">
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-all duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
              style={{ transitionDelay: menuOpen ? '380ms' : '0ms' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Ke Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
