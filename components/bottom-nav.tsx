"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, LineChart, ClipboardList, BookOpen, CalendarDays, ImageIcon, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileMenu } from "./mobile-menu"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/client"

export function BottomNav() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    
    async function getUserRole() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.user_metadata?.role) {
        setUserRole(user.user_metadata.role)
      }
    }
    
    getUserRole()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.user_metadata?.role) {
        setUserRole(session.user.user_metadata.role)
      } else if (event === "SIGNED_OUT") {
        setUserRole(null)
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

  let links: { href: string; label: string; icon: any }[] = []
  let role = roleToUse

  if (roleToUse === "deportista") {
    role = "deportista"
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
          <MobileMenu role={role} />
        </div>
      </nav>
    </div>
  )
}
