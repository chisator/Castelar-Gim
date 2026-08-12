"use client"

import * as React from "react"

type ZoomLevel = "normal" | "large" | "xlarge"

interface ZoomContextType {
  zoom: ZoomLevel
  setZoom: (zoom: ZoomLevel) => void
  cycleZoom: () => void
}

const ZoomContext = React.createContext<ZoomContextType | undefined>(undefined)

const ZOOM_LABELS: Record<ZoomLevel, string> = {
  normal: "Normal",
  large: "Grande",
  xlarge: "Extra Grande",
}

const ZOOM_FONT_SIZES: Record<ZoomLevel, string> = {
  normal: "16px",
  large: "18.4px",
  xlarge: "20.8px",
}

const STORAGE_KEY = "castelar-zoom"

function getInitialZoom(): ZoomLevel {
  if (typeof window === "undefined") return "normal"
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as ZoomLevel | null
    if (stored && ["normal", "large", "xlarge"].includes(stored)) {
      return stored
    }
  } catch {
    // localStorage puede no estar disponible
  }
  return "normal"
}

export function ZoomProvider({ children }: { children: React.ReactNode }) {
  const [zoom, setZoomState] = React.useState<ZoomLevel>("normal")
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    setZoomState(getInitialZoom())
  }, [])

  const setZoom = React.useCallback((newZoom: ZoomLevel) => {
    setZoomState(newZoom)
    try {
      localStorage.setItem(STORAGE_KEY, newZoom)
    } catch {
      // ignore
    }
  }, [])

  const cycleZoom = React.useCallback(() => {
    const order: ZoomLevel[] = ["normal", "large", "xlarge"]
    const currentIndex = order.indexOf(zoom)
    const nextIndex = (currentIndex + 1) % order.length
    setZoom(order[nextIndex])
  }, [zoom, setZoom])

  React.useEffect(() => {
    if (!mounted) return
    const html = document.documentElement
    html.style.fontSize = ZOOM_FONT_SIZES[zoom]
    html.setAttribute("data-zoom", zoom)
  }, [zoom, mounted])

  return (
    <ZoomContext.Provider value={{ zoom, setZoom, cycleZoom }}>
      {children}
    </ZoomContext.Provider>
  )
}

export function useZoom() {
  const context = React.useContext(ZoomContext)
  if (!context) {
    throw new Error("useZoom debe usarse dentro de ZoomProvider")
  }
  return context
}

export { ZOOM_LABELS }
