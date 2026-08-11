'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface LogoBrandProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'light' | 'dark' | 'gradient'
  showText?: boolean
  className?: string
  iconClassName?: string
  textClassName?: string
}

export function LogoBrand({
  size = 'md',
  variant = 'default',
  showText = true,
  className,
  iconClassName,
  textClassName,
}: LogoBrandProps) {
  const sizeMap = {
    sm: {
      box: 'w-6 h-6 rounded-md text-xs',
      text: 'text-sm font-bold tracking-tight',
    },
    md: {
      box: 'w-7.5 h-7.5 rounded-lg text-sm',
      text: 'text-base font-bold tracking-tight',
    },
    lg: {
      box: 'w-9 h-9 rounded-lg text-base',
      text: 'text-lg font-bold tracking-tight',
    },
    xl: {
      box: 'w-11 h-11 rounded-xl text-xl',
      text: 'text-2xl font-extrabold tracking-tight',
    },
  }

  const variantTextMap = {
    default: 'text-[var(--color-text-primary)]',
    dark: 'text-slate-900',
    light: 'text-white',
    gradient: 'bg-gradient-to-r from-[#0066FF] via-slate-800 to-slate-900 bg-clip-text text-transparent',
  }

  const currentSize = sizeMap[size] || sizeMap.md
  const currentVariant = variantTextMap[variant] || variantTextMap.default

  return (
    <div className={cn('flex items-center gap-2.5 select-none group', className)}>
      {/* Liquid Glass Brand Icon Box (#0066FF) */}
      <div
        className={cn(
          'bg-[#0066FF] text-white font-extrabold flex items-center justify-center flex-shrink-0 shadow-[inset_0px_2px_4px_rgba(255,255,255,0.35),0_2px_8px_rgba(0,102,255,0.3)] transition-transform duration-200 group-hover:scale-105',
          currentSize.box,
          iconClassName
        )}
      >
        <svg width="16" height="16" viewBox="0 0 512 512" fill="none">
          {/* Outer Hexagon Gem Body */}
          <path d="M256 96 L394 176 V336 L256 416 L118 336 V176 Z" fill="rgba(255,255,255,0.95)" />
          {/* T-Stem Cutout */}
          <path d="M256 220 V380" stroke="#0066FF" strokeWidth="26" strokeLinecap="round" />
          {/* T-Crossbar Facet Cuts */}
          <path d="M178 260 L256 304 L334 260" stroke="#0066FF" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {/* Top Bar Accent */}
          <path d="M190 176 H322" stroke="#0066FF" strokeWidth="22" strokeLinecap="round" fill="none" />
        </svg>
      </div>
      {showText && (
        <span
          className={cn(
            'font-fustat leading-none font-bold',
            currentSize.text,
            currentVariant,
            textClassName
          )}
        >
          Traceo
        </span>
      )}
    </div>
  )
}

export default LogoBrand
