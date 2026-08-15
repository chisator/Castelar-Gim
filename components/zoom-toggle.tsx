"use client"

import * as React from "react"
import { ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useZoom, ZOOM_LABELS } from "@/components/zoom-provider"

export function ZoomToggle() {
  const [mounted, setMounted] = React.useState(false)
  const { zoom, cycleZoom } = useZoom()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" className="w-full flex justify-between px-4">
        <span className="font-medium">Cargando...</span>
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      onClick={cycleZoom}
      className="w-full flex justify-between px-4"
    >
      <span className="font-medium">Tamaño: {ZOOM_LABELS[zoom]}</span>
      <ZoomIn className="h-[1.2rem] w-[1.2rem] transition-all" />
      <span className="sr-only">Cambiar tamaño de texto</span>
    </Button>
  )
}
