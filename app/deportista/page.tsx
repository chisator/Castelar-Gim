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
import { BannerCarousel } from "@/components/banner-carousel"
import { getActiveBanners } from "@/app/actions/banner-actions"



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

  // Obtener rutinas asignadas al usuario y sus entrenadores en una sola consulta
  const { data: routineAssignments } = await supabase
    .from("routine_user_assignments")
    .select(`
      routines (
        *,
        trainer:profiles!routines_trainer_id_fkey (
          full_name
        )
      )
    `)
    .eq("user_id", user.id)

  // Extraer, aplanar y ordenar las rutinas
  let routinesWithTrainers = routineAssignments
    ?.map((assignment: any) => {
      if (!assignment.routines) return null;
      // Supabase puede devolver un arreglo si la relación es 1:N o un objeto si es N:1
      // routine_user_assignments -> routines es N:1 (cada asignación tiene 1 rutina)
      const routine = Array.isArray(assignment.routines) ? assignment.routines[0] : assignment.routines;
      if (!routine) return null;
      
      return {
        ...routine,
        // El alias trainer puede venir como objeto o arreglo dependiendo de cómo supabase infiera la relación
        trainer: Array.isArray(routine.trainer) ? routine.trainer[0] : routine.trainer,
      };
    })
    .filter(Boolean) || [];

  // Ordenar rutinas por fecha de fin
  routinesWithTrainers.sort((a, b) => {
    const dateA = a.end_date ? new Date(a.end_date).getTime() : 0;
    const dateB = b.end_date ? new Date(b.end_date).getTime() : 0;
    return dateA - dateB;
  });

  // Calcular estadísticas
  const totalRoutines = routinesWithTrainers.length || 0

  // Banners
  const { banners } = await getActiveBanners()

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

      {banners && banners.length > 0 && (
        <div className="w-full">
          <BannerCarousel banners={banners} />
        </div>
      )}

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
