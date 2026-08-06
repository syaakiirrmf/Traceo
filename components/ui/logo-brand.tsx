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
    gradient: 'bg-gradient-to-r from-teal-700 via-slate-800 to-slate-900 bg-clip-text text-transparent dark:from-teal-400 dark:to-white',
  }

  const currentSize = sizeMap[size] || sizeMap.md
  const currentVariant = variantTextMap[variant] || variantTextMap.default

  return (
    <div className={cn('flex items-center gap-2.5 select-none group', className)}>
      {/* Clean solid brand letter mark (White "T" in solid teal #0f766e box) */}
      <div
        className={cn(
          'bg-[#0f766e] text-white font-extrabold flex items-center justify-center flex-shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-105',
          currentSize.box,
          iconClassName
        )}
      >
        <span className="leading-none select-none">T</span>
      </div>
      {showText && (
        <span
          className={cn(
            'font-sans leading-none',
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
