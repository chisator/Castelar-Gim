"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, LineChart, ClipboardList, BookOpen, ImageIcon, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileMenu } from "./mobile-menu"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/client"

export function BottomNav() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // El rol sale de `profiles` (protegido por RLS), no de `user_metadata`,
    // que el propio usuario puede reescribir. Acá es solo cosmético —decide
    // qué pestañas se muestran— pero se mantiene una única fuente de verdad.
    async function loadRole(userId: string | undefined) {
      if (!userId) {
        setUserRole(null)
        return
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single()
      setUserRole(profile?.role ?? null)
    }

    supabase.auth.getUser().then(({ data: { user } }) => loadRole(user?.id))

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUserRole(null)
      } else if (session?.user?.id) {
        loadRole(session.user.id)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  // No mostrar en rutas de autenticación o la raíz si es un landing
  if (pathname.startsWith("/auth") || pathname === "/") {
    return null
  }

  // Determinar rol por la ruta como fallback
  const roleToUse = userRole || (
    pathname.startsWith("/deportista") ? "deportista" : 
    pathname.startsWith("/admin") ? "administrador" : 
    pathname.startsWith("/entrenador") ? "entrenador" : ""
  )

  let links: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = []

  if (roleToUse === "deportista") {
    links = [
      { href: "/deportista", label: "Inicio", icon: Home },
      { href: "/deportista/registros", label: "Registros", icon: ClipboardList },
      { href: "/deportista/progreso", label: "Progreso", icon: LineChart },
    ]
  } else if (roleToUse === "administrador") {
    links = [
      { href: "/admin", label: "Inicio", icon: Home },
      { href: "/admin/ejercicios", label: "Catálogo", icon: BookOpen },
      { href: "/admin/banners", label: "Banners", icon: ImageIcon },
      { href: "/admin/notificaciones", label: "Avisos", icon: Bell },
    ]
  } else if (roleToUse === "entrenador") {
    links = [
      { href: "/entrenador", label: "Inicio", icon: Home },
      { href: "/admin/ejercicios", label: "Catálogo", icon: BookOpen },
    ]
  }

  if (links.length === 0) return null

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t pb-safe">
      <nav className="flex justify-around items-center h-16 px-2">
        {links.map((link) => {
          const isActive = pathname === link.href
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 text-xs transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
              <span className="font-medium">{link.label}</span>
            </Link>
          )
        })}
        {/* Usamos MobileMenu como el botón "Más" */}
        <div className="flex flex-col items-center justify-center w-full h-full">
          <MobileMenu />
        </div>
      </nav>
    </div>
  )
}
