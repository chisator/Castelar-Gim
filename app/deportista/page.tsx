import { redirect } from "next/navigation"
import { createClient } from "@/lib/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LogoutButton } from "@/components/logout-button"
import { RoutineCard } from "@/components/routine-card"
import Image from "next/image"
import { Logo } from "@/components/logo"



export default async function DeportistaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (profile?.role !== "deportista") {
    redirect("/unauthorized")
  }

  // Obtener rutinas asignadas al usuario via routine_user_assignments
  const { data: routineAssignments } = await supabase
    .from("routine_user_assignments")
    .select("routine_id")
    .eq("user_id", user.id)

  const routineIds = routineAssignments?.map((r: any) => r.routine_id) || []

  // Obtener rutinas sin join complejo
  const { data: routines } = routineIds.length
    ? await supabase
      .from("routines")
      .select("*")
      .in("id", routineIds)
      .order("end_date", { ascending: true })
    : { data: [] }

  // Obtener entrenadores manualmente
  const trainerIds = Array.from(new Set(routines?.map((r) => r.trainer_id).filter(Boolean))) as string[]

  const { data: trainers } = trainerIds.length > 0
    ? await supabase.from("profiles").select("id, full_name").in("id", trainerIds)
    : { data: [] }

  // Mapear entrenadores a rutinas
  const routinesWithTrainers = routines?.map((routine) => {
    const trainer = trainers?.find((t) => t.id === routine.trainer_id)
    return {
      ...routine,
      trainer: trainer ? { full_name: trainer.full_name } : null,
    }
  })

  // Calcular estadísticas
  const totalRoutines = routinesWithTrainers?.length || 0

  // Filtrar rutinas por fecha
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingRoutines = routinesWithTrainers?.filter((r) => {
    const routineEnd = r.end_date ? new Date(r.end_date) : r.start_date ? new Date(r.start_date) : null
    if (!routineEnd) return false
    routineEnd.setHours(0, 0, 0, 0)
    return routineEnd >= today
  })

  const pastRoutines = routinesWithTrainers?.filter((r) => {
    const routineEnd = r.end_date ? new Date(r.end_date) : r.start_date ? new Date(r.start_date) : null
    if (!routineEnd) return false
    routineEnd.setHours(0, 0, 0, 0)
    return routineEnd < today
  })

  return (
    <div className="w-full">
      <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex min-h-[5rem] items-center justify-between px-4 py-2 relative">
          <div className="flex items-center gap-3">
            <Logo size={80} />
          </div>

          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 gap-4">
            <Button asChild variant="ghost">
              <Link href="/deportista/registros">Registros</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/deportista/progreso">Progreso</Link>
            </Button>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{profile?.full_name}</p>
              <Badge variant="secondary" className="text-xs hidden sm:inline-flex bg-sky-100 text-sky-800 border border-sky-300">
                Deportista
              </Badge>
            </div>

            <div className="hidden md:block">
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-balance text-foreground">Bienvenido, {profile?.full_name}</h2>
          <p className="text-muted-foreground mt-1">Aquí puedes ver tus rutinas y seguir tu progreso</p>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">Próximas Rutinas</h3>
            {upcomingRoutines && upcomingRoutines.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 items-start">
                {upcomingRoutines.map((routine: any, index: number) => (
                  <RoutineCard
                    key={routine.id}
                    routine={routine}
                    athleteId={user.id}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No tienes rutinas próximas programadas</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-4">Rutinas Anteriores</h3>
            {pastRoutines && pastRoutines.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 items-start">
                {pastRoutines.slice(0, 4).map((routine: any, index: number) => (
                  <RoutineCard
                    key={routine.id}
                    routine={routine}
                    athleteId={user.id}
                    isPast
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No tienes rutinas anteriores</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
