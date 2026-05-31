"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { usePathname } from "next/navigation"

type Phase = "idle" | "animating" | "fading" | "done"

let splashLocked = false

export function SplashOverlay() {
  const [phase, setPhase] = useState<Phase>("idle")
  const pathname = usePathname()
  const triggerPathnameRef = useRef<string | null>(null)
  const startTimeRef = useRef<number>(0)
  const hasStartedFadeRef = useRef(false)

  const start = useCallback(() => {
    if (splashLocked) return
    splashLocked = true
    sessionStorage.setItem("__splash_active", "1")
    triggerPathnameRef.current = pathname
    startTimeRef.current = Date.now()
    hasStartedFadeRef.current = false
    setPhase("animating")
    setTimeout(() => {
      splashLocked = false
    }, 2500)
  }, [pathname])

  useEffect(() => {
    const handler = () => start()
    window.addEventListener("splash:trigger", handler)
    return () => window.removeEventListener("splash:trigger", handler)
  }, [start])

  useEffect(() => {
    if (phase !== "animating") return
    if (hasStartedFadeRef.current) return
    if (!triggerPathnameRef.current) return

    if (pathname === triggerPathnameRef.current) return

    hasStartedFadeRef.current = true

    const elapsed = Date.now() - startTimeRef.current
    const minDuration = 1000
    const remaining = Math.max(0, minDuration - elapsed)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          setPhase("fading")
        }, 150 + remaining)
      })
    })
  }, [phase, pathname])

  useEffect(() => {
    if (phase === "animating") {
      const safetyTimer = setTimeout(() => {
        if (!hasStartedFadeRef.current) {
          hasStartedFadeRef.current = true
          setPhase("fading")
        }
      }, 5000)

      return () => clearTimeout(safetyTimer)
    }
  }, [phase])

  useEffect(() => {
    if (phase === "fading") {
      const doneTimer = setTimeout(() => setPhase("done"), 300)
      return () => clearTimeout(doneTimer)
    }
  }, [phase])

  useEffect(() => {
    return () => {
      setPhase("done")
      splashLocked = false
      hasStartedFadeRef.current = false
    }
  }, [])

  if (phase === "idle" || phase === "done") return null

  return (
    <div
      className={
        phase === "fading"
          ? "fixed inset-0 z-[9999] flex items-center justify-center bg-background opacity-0 transition-opacity duration-300 pointer-events-none"
          : "fixed inset-0 z-[9999] flex items-center justify-center bg-background"
      }
    >
      <div
        style={{
          animation: "splash-logo-burst 1.4s ease-in-out forwards",
          transformOrigin: "center center",
        }}
      >
        <img
          src="/Layer1000.svg"
          alt="Castelar Gimnasio"
          width={80}
          height={80}
        />
      </div>
    </div>
  )
}
