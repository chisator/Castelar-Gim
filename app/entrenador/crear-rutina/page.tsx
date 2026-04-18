import { redirect } from "next/navigation"
import { createClient } from "@/lib/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"
import { CreateRoutineForm } from "@/components/create-routine-form"
import Link from "next/link"
import { getExerciseCatalog } from "@/app/actions/admin-actions"
import { Logo } from "@/components/logo"

export default async function CrearRutinaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (profile?.role !== "entrenador") {
    redirect("/unauthorized")
  }

  // Obtener usuarios asignados al entrenador
  const { data: assignments } = await supabase
    .from("trainer_user_assignments")
    .select("user_id")
    .eq("trainer_id", user.id)

  const userIds = assignments?.map((a) => a.user_id) || []

  // Obtener perfiles de esos usuarios
  const { data: athletes } = userIds.length
    ? await supabase.from("profiles").select("*").in("id", userIds).order("full_name")
    : { data: [] }

  const { exercises: exerciseCatalog } = await getExerciseCatalog()

  return (
    <div className="w-full">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex min-h-[5rem] items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            <Logo size={80} />
            <div className="hidden sm:block border-l pl-4 border-border/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Panel de<br />Entrenador</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Mobile: Show only Back button */}
            <Button variant="ghost" asChild className="md:hidden">
              <Link href="/entrenador" className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver
              </Link>
            </Button>

            {/* Desktop: Show standard header elements */}
            <div className="hidden md:flex items-center gap-4">
              <Button variant="outline" asChild>
                <Link href="/entrenador">Volver</Link>
              </Button>
              <div className="text-right">
                <p className="text-sm font-medium">{profile?.full_name}</p>
                <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900">
                  Entrenador
                </Badge>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-balance">Crear Nueva Rutina</h2>
          <p className="text-muted-foreground mt-1">Define los ejercicios y asigna la rutina a un usuario</p>
        </div>

        <CreateRoutineForm athletes={athletes || []} creatorId={user.id} exerciseCatalog={exerciseCatalog || []} />
      </main>
    </div>
  )
}
