'use client'

import { useEffect, useRef, useState } from 'react'

const TOTAL_FRAMES = 160
const FPS = 24 // playback speed in frames per second

function getFramePath(index: number): string {
  const padded = String(index).padStart(4, '0')
  return `/vidhero/Abstract_motion_graphics_animation_minimalis-${padded}.jpg`
}

export default function AnimatedBackground() {
  const [currentFrame, setCurrentFrame] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const frameRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Preload first ~20 frames then start animation
  useEffect(() => {
    let count = 0
    const preloadCount = 20
    const images: HTMLImageElement[] = []

    for (let i = 0; i < preloadCount; i++) {
      const img = new Image()
      img.src = getFramePath(i)
      img.onload = () => {
        count++
        if (count >= preloadCount) {
          setLoaded(true)
        }
      }
      images.push(img)
    }

    return () => {
      images.forEach((img) => {
        img.onload = null
      })
    }
  }, [])

  useEffect(() => {
    if (!loaded) return

    intervalRef.current = setInterval(() => {
      frameRef.current = (frameRef.current + 1) % TOTAL_FRAMES
      setCurrentFrame(frameRef.current)
    }, 1000 / FPS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [loaded])

  return (
    <div aria-hidden="true" className="absolute inset-0 w-full h-full overflow-hidden">
      {/* Dark base so the screen-blend black disappears into the dark bg */}
      <div className="absolute inset-0 bg-[#030712]" />

      {/* Frame sequence — mix-blend-mode: screen removes the black bg */}
      {loaded && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={currentFrame}
          src={getFramePath(currentFrame)}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            mixBlendMode: 'screen',
            opacity: 0.85,
          }}
          draggable={false}
        />
      )}

      {/* Radial vignette — darkens edges so text is always readable */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 30%, rgba(3,7,18,0.65) 80%, rgba(3,7,18,0.92) 100%)',
        }}
      />

      {/* Bottom fade — ensures footer/CTAs area is legible */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48"
        style={{
          background: 'linear-gradient(to bottom, transparent, rgba(3,7,18,0.96))',
        }}
      />
    </div>
  )
}
