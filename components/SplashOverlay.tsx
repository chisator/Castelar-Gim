"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { usePathname } from "next/navigation"

type Phase = "idle" | "burst" | "shrinking" | "growing" | "fading" | "done"
type Mode = "login-to-panel" | "logout-to-login"

interface SplashEventDetail {
  mode: Mode
  sourceRect?: { top: number; left: number; width: number; height: number } | null
}

let splashLocked = false

const SHARED_FINAL_SIZE = 180
const BURST_DURATION = 1400
const SHRINK_DURATION = 600
const GROW_DURATION = 1000
const FADE_DURATION = 300
const SAFETY_TIMEOUT = 8000

export function SplashOverlay() {
  const [phase, setPhase] = useState<Phase>("idle")
  const [cloneStyle, setCloneStyle] = useState<React.CSSProperties>({})
  const pathname = usePathname()
  const modeRef = useRef<Mode | null>(null)
  const startTimeRef = useRef<number>(0)
  const triggerPathRef = useRef<string | null>(null)
  const logoWrapperRef = useRef<HTMLDivElement>(null)
  const sourceRectRef = useRef<{ top: number; left: number; width: number; height: number } | null>(null)
  const hasStartedFadeRef = useRef(false)
  const animatingRef = useRef(false)
  const pollRafRef = useRef(0)

  const cleanup = useCallback(() => {
    cancelAnimationFrame(pollRafRef.current)
    setPhase("done")
    document.body.classList.remove("splash-active")
    splashLocked = false
    hasStartedFadeRef.current = false
    animatingRef.current = false
  }, [])

  const doFade = useCallback(() => {
    if (hasStartedFadeRef.current) return
    hasStartedFadeRef.current = true
    setPhase("fading")
    setTimeout(() => {
      cleanup()
    }, FADE_DURATION)
  }, [cleanup])

  const start = useCallback(
    (detail: SplashEventDetail) => {
      if (splashLocked) return
      splashLocked = true

      modeRef.current = detail.mode
      sourceRectRef.current = detail.sourceRect ?? null
      triggerPathRef.current = pathname
      startTimeRef.current = Date.now()
      hasStartedFadeRef.current = false
      animatingRef.current = false

      sessionStorage.setItem("__splash_active", "1")
      document.body.classList.add("splash-active")

      if (detail.mode === "login-to-panel") {
        const rect = detail.sourceRect
        if (rect && rect.width > 0) {
          setCloneStyle({
            position: "absolute",
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          })
        }
        setPhase("burst")
      } else if (detail.mode === "logout-to-login") {
        const rect = detail.sourceRect
        if (rect && rect.width > 0) {
          setCloneStyle({
            position: "absolute",
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          })
        }
        setPhase("growing")
      }
    },
    [pathname]
  )

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<SplashEventDetail>).detail
      start(detail)
    }
    window.addEventListener("splash:trigger", handler)
    return () => window.removeEventListener("splash:trigger", handler)
  }, [start])

  useEffect(() => {
    if (phase !== "burst") return
    if (animatingRef.current) return
    animatingRef.current = true

    const wrapper = logoWrapperRef.current
    if (!wrapper) return

    const cloneSize = Number(cloneStyle.width) || 80
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2

    const rect = sourceRectRef.current
    const startScale = rect && rect.width > 0 ? 1 : 0.3
    const startX = rect && rect.width > 0 ? rect.left + rect.width / 2 : centerX
    const startY = rect && rect.width > 0 ? rect.top + rect.height / 2 : centerY

    const dx = centerX - startX
    const dy = centerY - startY
    const endScale = SHARED_FINAL_SIZE / cloneSize

    try {
      wrapper.animate(
        [
          { transform: `translate(0px, 0px) scale(${startScale})` },
          { transform: `translate(${dx}px, ${dy}px) scale(${endScale})` },
        ],
        {
          duration: BURST_DURATION,
          easing: "ease-in-out",
          fill: "forwards",
        }
      )
    } catch {
      doFade()
    }
  }, [phase, cloneStyle, doFade])

  useEffect(() => {
    if (phase === "burst") {
      if (
        !triggerPathRef.current ||
        pathname === triggerPathRef.current
      )
        return

      const elapsed = Date.now() - startTimeRef.current
      const remaining = Math.max(0, BURST_DURATION - elapsed)

      setTimeout(() => {
        const startPoll = () => {
          const poll = () => {
            const el = (
                document.querySelector('[data-splash-target-logo]') ||
                document.querySelector('[data-splash-target="header"]')
              ) as HTMLElement | null
            if (el) {
              animateShrink(el)
            } else {
              pollRafRef.current = requestAnimationFrame(poll)
            }
          }
          pollRafRef.current = requestAnimationFrame(poll)
        }
        startPoll()
      }, remaining)
    }
  }, [phase, pathname])

  const animateShrink = useCallback(
    (targetEl: HTMLElement) => {
      if (animatingRef.current) return
      animatingRef.current = true

      const targetRect = targetEl.getBoundingClientRect()
      const wrapper = logoWrapperRef.current
      if (!wrapper) {
        doFade()
        return
      }

      const cloneSize = Number(cloneStyle.width) || 80
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2

      const targetCenterX = targetRect.left + targetRect.width / 2
      const targetCenterY = targetRect.top + targetRect.height / 2
      const targetScale = targetRect.width / cloneSize

      const dx = targetCenterX - centerX
      const dy = targetCenterY - centerY

      wrapper.getAnimations().forEach((a) => a.cancel())

      try {
        wrapper.animate(
          [
            {
              transform: `translate(0px, 0px) scale(${
                SHARED_FINAL_SIZE / cloneSize
              })`,
            },
            {
              transform: `translate(${dx}px, ${dy}px) scale(${targetScale})`,
            },
          ],
          {
            duration: SHRINK_DURATION,
            easing: "ease-in-out",
            fill: "forwards",
          }
        ).onfinish = () => {
          doFade()
        }
      } catch {
        doFade()
      }
    },
    [doFade]
  )

  useEffect(() => {
    if (phase !== "growing") return
    if (animatingRef.current) return
    animatingRef.current = true

    const wrapper = logoWrapperRef.current
    if (!wrapper) return

    const cloneSize = Number(cloneStyle.width) || 80
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2

    const endScale = SHARED_FINAL_SIZE / cloneSize

    const rect = sourceRectRef.current
    const startX = rect && rect.width > 0 ? rect.left + rect.width / 2 : centerX
    const startY = rect && rect.width > 0 ? rect.top + rect.height / 2 : centerY
    const dx = centerX - startX
    const dy = centerY - startY

    try {
      wrapper.animate(
        [
          { transform: `translate(0px, 0px) scale(1)` },
          { transform: `translate(${dx}px, ${dy}px) scale(${endScale})` },
        ],
        {
          duration: GROW_DURATION,
          easing: "ease-in-out",
          fill: "forwards",
        }
      )
    } catch {
      doFade()
    }
  }, [phase, cloneStyle, doFade])

  useEffect(() => {
    if (phase !== "growing") return
    if (pathname !== "/auth/login") return
    const elapsed = Date.now() - startTimeRef.current
    const remaining = Math.max(0, 1000 - elapsed)
    const timer = setTimeout(() => doFade(), remaining)
    return () => clearTimeout(timer)
  }, [phase, pathname, doFade])

  useEffect(() => {
    if (phase === "burst" || phase === "growing") {
      const safetyTimer = setTimeout(() => {
        if (!hasStartedFadeRef.current) {
          doFade()
        }
      }, SAFETY_TIMEOUT)

      return () => clearTimeout(safetyTimer)
    }
  }, [phase, doFade])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(pollRafRef.current)
      document.body.classList.remove("splash-active")
      splashLocked = false
      hasStartedFadeRef.current = false
    }
  }, [])

  if (phase === "idle" || phase === "done") return null

  const isFading = phase === "fading"

  return (
    <div
      className={
        isFading
          ? "fixed inset-0 z-[9999] flex items-center justify-center bg-background opacity-0 transition-opacity duration-300 pointer-events-none"
          : "fixed inset-0 z-[9999] flex items-center justify-center bg-background pointer-events-none"
      }
    >
      <div
        ref={logoWrapperRef}
        style={{
          ...cloneStyle,
          transformOrigin: "center center",
        }}
      >
        <img
          src="/Layer1000.svg"
          alt="Castelar Gimnasio"
          width={cloneStyle.width ? undefined : 80}
          height={cloneStyle.height ? undefined : 80}
          style={
            cloneStyle.width
              ? { width: cloneStyle.width, height: cloneStyle.height }
              : undefined
          }
        />
      </div>
    </div>
  )
}
