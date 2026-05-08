import { redirect } from "next/navigation"
import { createClient } from "@/lib/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"
import { TrainerRoutineCard } from "@/components/trainer-routine-card"
import Link from "next/link"
import { TrainerUserFilter } from "@/components/trainer-user-filter"
import { Logo } from "@/components/logo"
import { ExportPdfButton } from "@/components/export-pdf-button"



export default async function EntrenadorPage({ searchParams }: { searchParams?: { userId?: string } }) {
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

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Obtener asignaciones entrenador-usuario
  const { data: assignments } = await supabase
    .from("trainer_user_assignments")
    .select("user_id")
    .eq("trainer_id", user.id)
    .order("created_at", { ascending: false })

  const assignedUserIds = assignments?.map((a) => a.user_id) || []

  // Obtener TODOS los perfiles de deportistas para que el entrenador pueda ver/filtrar a cualquiera
  const { data: athletes } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("role", "deportista")
    .order("full_name")

  // Si hay filtro por usuario en querystring, obtener TODAS las rutinas asignadas a ese usuario sin filtrar por creador
  let routines = [] as any[]
  if (searchParams?.userId) {
    const { data: routineAssignments } = await supabaseAdmin
      .from("routine_user_assignments")
      .select("routine_id")
      .eq("user_id", searchParams.userId)
      .order("created_at", { ascending: false })

    const routineIds = (routineAssignments || []).map((r: any) => r.routine_id)
    if (routineIds.length > 0) {
      const { data } = await supabaseAdmin
        .from("routines")
        .select("*")
        .in("id", routineIds)
        .order("end_date", { ascending: false })
      routines = data || []
    } else {
      routines = []
    }
  } else {
    // Si no hay filtro, mostrar todas las rutinas asignadas a sus alumnos asignados OR creadas por este entrenador
    const { data: assignedRoutinesQuery } = assignedUserIds.length > 0 
      ? await supabaseAdmin.from("routine_user_assignments").select("routine_id").in("user_id", assignedUserIds) 
      : { data: [] }
    const routineIds = (assignedRoutinesQuery || []).map((r: any) => r.routine_id)
    
    let query = supabaseAdmin.from("routines").select("*").order("end_date", { ascending: false })
    
    if (routineIds.length > 0) {
      query = query.or(`id.in.(${routineIds.join(',')}),trainer_id.eq.${user.id}`)
    } else {
      query = query.eq("trainer_id", user.id)
    }
    const { data } = await query
    routines = data || []
  }

  // Anexar información de los creadores y los últimos editores a cada rutina
  const trainerIds = new Set<string>()
  routines.forEach(r => {
    if (r.trainer_id) trainerIds.add(r.trainer_id)
    if (r.updated_by) trainerIds.add(r.updated_by)
  })
  
  if (trainerIds.size > 0) {
    const { data: trainersInfo } = await supabaseAdmin.from("profiles").select("id, full_name").in("id", Array.from(trainerIds))
    const trainerMap = new Map((trainersInfo || []).map(t => [t.id, t.full_name]))
    routines = routines.map(r => ({
      ...r,
      creator_name: trainerMap.get(r.trainer_id) || "Sin Creador",
      updater_name: r.updated_by ? trainerMap.get(r.updated_by) : null
    }))
  }

  // Calcular estadísticas
  const totalRoutines = routines?.length || 0
  const totalAssignedUsers = assignedUserIds.length || 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingRoutines =
    routines?.filter((r) => {
      const routineEnd = r.end_date ? new Date(r.end_date) : r.start_date ? new Date(r.start_date) : null
      if (!routineEnd) return false
      routineEnd.setHours(0, 0, 0, 0)
      return routineEnd >= today
    }) || []

  const pastRoutines =
    routines?.filter((r) => {
      const routineEnd = r.end_date ? new Date(r.end_date) : r.start_date ? new Date(r.start_date) : null
      if (!routineEnd) return false
      routineEnd.setHours(0, 0, 0, 0)
      return routineEnd < today
    }) || []

  const selectedAthlete = searchParams?.userId 
    ? athletes?.find(a => a.id === searchParams.userId) || null
    : null;

  return (
    <div className="w-full">
      <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex min-h-[5rem] items-center justify-between px-4 py-2 relative">
          <div className="flex items-center gap-4">
            <Logo size={80} />
            <div className="hidden sm:block border-l pl-4 border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Panel de<br />Entrenador</p>
            </div>
            <div className="sm:hidden">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Entrenador</p>
            </div>
          </div>
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 gap-4">
            <Button asChild variant="ghost" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              <Link href="/admin/ejercicios">Ejercicios</Link>
            </Button>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{profile?.full_name}</p>
              <Badge variant="secondary" className="text-xs hidden sm:inline-flex bg-emerald-100 text-emerald-800 dark:bg-emerald-900">
                Entrenador
              </Badge>
            </div>

            <div className="hidden md:block">
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-balance">Bienvenido, {profile?.full_name}</h2>
            <p className="text-muted-foreground mt-1">Gestiona tus rutinas de entrenamiento</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="lg" className="text-xs sm:text-base">
              <Link href="/entrenador/crear-rutina">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nueva Rutina
              </Link>
            </Button>
          </div>
        </div>
        <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="flex-1">
            <TrainerUserFilter athletes={athletes || []} />
          </div>
          {searchParams?.userId && selectedAthlete && routines.length > 0 && (
            <ExportPdfButton athlete={selectedAthlete} routines={routines} />
          )}
        </div>
        <div className="grid gap-2 grid-cols-2 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 pb-0">
              <CardTitle className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight">Total Rutinas</CardTitle>
              <svg className="h-3 w-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-lg sm:text-xl font-bold">{totalRoutines}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 pb-0">
              <CardTitle className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight">Próximas</CardTitle>
              <svg className="h-3 w-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-lg sm:text-xl font-bold">{upcomingRoutines.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 pb-0">
              <CardTitle className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight">Asignados</CardTitle>
              <svg className="h-3 w-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM6 20a9 9 0 0118 0v-2a9 9 0 00-18 0v2z"
                />
              </svg>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-lg sm:text-xl font-bold">{totalAssignedUsers}</div>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Usuarios asignados</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">Próximas Rutinas</h3>
            {upcomingRoutines.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 items-start">
                {upcomingRoutines.map((routine: any, index: number) => (
                  <TrainerRoutineCard key={routine.id} routine={routine} index={index} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">No tienes rutinas próximas programadas</p>
                  <Button asChild>
                    <Link href="/entrenador/crear-rutina">Crear Primera Rutina</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-4">Rutinas Anteriores</h3>
            {pastRoutines.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 items-start">
                {pastRoutines.slice(0, 4).map((routine: any, index: number) => (
                  <TrainerRoutineCard key={routine.id} routine={routine} isPast index={index} />
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
