"use client"

import type React from "react"

import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

import { Logo } from "@/components/logo"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [introPhase, setIntroPhase] = useState<"intro" | "done">("intro")
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("__splash_active") === "1") {
      sessionStorage.removeItem("__splash_active")
      setIntroPhase("done")
      return
    }
    const timer = setTimeout(() => setIntroPhase("done"), 2000)
    return () => clearTimeout(timer)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      // Obtener el rol del usuario
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

        const loginLogoEl = document.querySelector('[data-splash-source="login"]') as HTMLElement | null
        const sourceRect = loginLogoEl?.getBoundingClientRect() ?? null

        window.dispatchEvent(
          new CustomEvent("splash:trigger", {
            detail: { mode: "login-to-panel", sourceRect },
          })
        )

        // Redirigir según el rol
        if (profile?.role === "deportista") {
          router.push("/deportista")
        } else if (profile?.role === "entrenador") {
          router.push("/entrenador")
        } else if (profile?.role === "administrador") {
          router.push("/admin")
        }
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-transparent">
      {introPhase === "intro" && (
        <div
          className="fixed inset-0 z-50 bg-background"
          style={{ animation: "login-overlay-fade 1.8s ease-in-out forwards" }}
        />
      )}
      <div className="w-full max-w-md relative bottom-20">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center text-center">
            <div
              data-splash-source="login"
              className={introPhase === "intro" ? "relative z-[60]" : undefined}
              style={
                introPhase === "intro"
                  ? { animation: "login-logo-intro 1.6s ease-in-out forwards" }
                  : undefined
              }
            >
              <Logo size={150} />
            </div>
            <p
              className={
                introPhase === "done"
                  ? "text-muted-foreground z-10 opacity-100 transition-opacity duration-500"
                  : "text-muted-foreground z-10 opacity-0"
              }
            >
              Sistema de gestión de entrenamientos
            </p>
          </div>
          <Card
            className={
              introPhase === "done"
                ? "z-20 bg-card/40 backdrop-blur-sm border-white/50 shadow-xl opacity-100 transition-opacity duration-500"
                : "z-20 bg-card/40 backdrop-blur-sm border-white/50 shadow-xl opacity-0"
            }
          >
            <CardHeader>
              <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
              <CardDescription>Ingresa tus credenciales para acceder al sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}




