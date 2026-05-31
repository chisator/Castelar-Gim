"use client"

import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { LogOut } from "lucide-react"

interface LogoutButtonProps {
  className?: string
  iconOnly?: boolean
}

export function LogoutButton({ className, iconOnly = false }: LogoutButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)

    const menuEl = document.querySelector('[data-splash-source="menu"]') as HTMLElement | null
    const headerEl = (
      document.querySelector('[data-splash-target-logo]') ||
      document.querySelector('[data-splash-target="header"]')
    ) as HTMLElement | null

    let sourceRect: { top: number; left: number; width: number; height: number } | null = null

    const menuRect = menuEl?.getBoundingClientRect()
    if (menuRect && menuRect.width > 0) {
      sourceRect = menuRect
    } else {
      const headerRect = headerEl?.getBoundingClientRect()
      if (headerRect && headerRect.width > 0) {
        sourceRect = headerRect
      }
    }

    window.dispatchEvent(
      new CustomEvent("splash:trigger", {
        detail: { mode: "logout-to-login", sourceRect },
      })
    )

    await new Promise((resolve) => setTimeout(resolve, 50))
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      disabled={isLoading}
      className={className}
      size={iconOnly ? "icon" : "default"}
    >
      {isLoading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : iconOnly ? (
        <LogOut className="h-4 w-4" />
      ) : (
        "Cerrar Sesión"
      )}
    </Button>
  )
}
