import { redirect } from "next/navigation"
import { createClient } from "@/lib/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UsersTable } from "@/components/users-table"
import { AssignmentsTable } from "@/components/assignments-table"
import { RoutinesTable } from "@/components/routines-table"
import { TrainerRoutinesStats } from "@/components/trainer-routines-stats"
import Link from "next/link"
import { Logo } from "@/components/logo"



export default async function AdminPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (profile?.role !== "administrador") {
    redirect("/unauthorized")
  }

  // Params parsing
  const usersPage = Number(searchParams.usersPage) || 1
  const assignmentsPage = Number(searchParams.assignmentsPage) || 1
  const routinesPage = Number(searchParams.routinesPage) || 1
  const perPage = 10

  const usersSearch = typeof searchParams.usersSearch === 'string' ? searchParams.usersSearch : ''
  const usersRole = typeof searchParams.usersRole === 'string' ? searchParams.usersRole : 'all'
  const routinesSearch = typeof searchParams.routinesSearch === 'string' ? searchParams.routinesSearch : ''
  const routinesTrainer = typeof searchParams.routinesTrainer === 'string' ? searchParams.routinesTrainer : 'all'

  // Estadísticas (Consultas optimizadas solo para conteo)
  const [{ count: totalUsers }, { count: totalAthletes }, { count: totalTrainers }, { count: totalRoutines }, { count: totalAssignments }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "deportista"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "entrenador"),
    supabase.from("routines").select("*", { count: "exact", head: true }),
    supabase.from("trainer_user_assignments").select("*", { count: "exact", head: true })
  ])

  // Obtener lista mínima de todos los usuarios para los Selects (Crear Asignación, etc.)
  const { data: allMinimalUsers } = await supabase.from("profiles").select("id, full_name, email, role").order("full_name")

  // Usuarios paginados
  let usersQuery = supabase.from("profiles").select("*", { count: "exact" })
  if (usersSearch) usersQuery = usersQuery.ilike("full_name", `%${usersSearch}%`)
  if (usersRole !== 'all') usersQuery = usersQuery.eq("role", usersRole)
  
  const { data: users, count: usersCount } = await usersQuery
    .order("created_at", { ascending: false })
    .range((usersPage - 1) * perPage, usersPage * perPage - 1)

  // Asignaciones paginadas
  const { data: assignments, count: assignmentsCount } = await supabase
    .from("trainer_user_assignments")
    .select(
      `
      *,
      profiles:user_id (
        full_name,
        email
      ),
      trainer:trainer_id (
        full_name
      )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range((assignmentsPage - 1) * perPage, assignmentsPage * perPage - 1)

  // Rutinas paginadas
  let routinesQuery = supabase.from("routines").select(`
    *,
    routine_user_assignments(user_id)
  `, { count: "exact" })

  if (routinesSearch) routinesQuery = routinesQuery.ilike("title", `%${routinesSearch}%`)
  if (routinesTrainer !== 'all') routinesQuery = routinesQuery.eq("trainer_id", routinesTrainer)

  const { data: routines, count: routinesCount } = await routinesQuery
    .order("created_at", { ascending: false })
    .range((routinesPage - 1) * perPage, routinesPage * perPage - 1)

  // Para Stats, usamos todas las rutinas. Como Stats es pesado, idealmente tendríamos endpoints, pero por ahora...
  // Obtendremos todas las rutinas solo para Stats si es necesario. Para evitar romper `TrainerRoutinesStats`,
  // le pasaremos los datos completos o lo dejamos como estaba.
  const { data: allRoutinesForStats } = await supabase.from("routines").select(`
    *,
    routine_user_assignments(user_id)
  `)

  return (
    <div className="w-full">
      <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex min-h-[5rem] items-center justify-between px-4 py-2 relative">
          <div className="flex items-center gap-4">
            <Logo size={80} />
            <div className="hidden sm:block border-l pl-4 border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Panel de<br />Administración</p>
            </div>
            <div className="sm:hidden">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Admin</p>
            </div>
          </div>
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 gap-4">
            <Button asChild variant="ghost" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              <Link href="/admin/ejercicios">Ejercicios</Link>
            </Button>
            <Button asChild variant="ghost" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              <Link href="/admin/banners">Banners</Link>
            </Button>
            <Button asChild variant="ghost" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              <Link href="/admin/notificaciones">Avisos</Link>
            </Button>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{profile?.full_name}</p>
              <Badge variant="secondary" className="text-xs hidden sm:inline-flex bg-purple-100 text-purple-800 dark:bg-purple-900">
                Administrador
              </Badge>
            </div>

            <div className="hidden md:block">
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-balance">Panel de Administración</h2>
          <p className="text-muted-foreground mt-1">Gestiona usuarios, rutinas y asignaciones del gimnasio</p>
        </div>

        <div className="grid gap-2 grid-cols-2 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 pb-0">
              <CardTitle className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight">Total Usuarios</CardTitle>
              <svg className="h-3 w-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-lg sm:text-xl font-bold">{totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 pb-0">
              <CardTitle className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight">Deportistas</CardTitle>
              <svg className="h-3 w-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-lg sm:text-xl font-bold">{totalAthletes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 pb-0">
              <CardTitle className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight">Entrenadores</CardTitle>
              <svg className="h-3 w-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-lg sm:text-xl font-bold">{totalTrainers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 pb-0">
              <CardTitle className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight">Asignaciones</CardTitle>
              <svg className="h-3 w-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="text-lg sm:text-xl font-bold">{totalAssignments || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 pb-0">
              <CardTitle className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight">Rutinas</CardTitle>
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

        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1 gap-1">
            <TabsTrigger value="users" className="py-2">Usuarios</TabsTrigger>
            <TabsTrigger value="assignments" className="py-2">Asignaciones</TabsTrigger>
            <TabsTrigger value="routines" className="py-2">Rutinas</TabsTrigger>
            <TabsTrigger value="stats" className="py-2">Estadísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UsersTable users={users || []} totalPages={Math.ceil((usersCount || 0) / perPage)} />
          </TabsContent>

          <TabsContent value="assignments">
            <AssignmentsTable assignments={assignments || []} users={allMinimalUsers || []} totalPages={Math.ceil((assignmentsCount || 0) / perPage)} />
          </TabsContent>

          <TabsContent value="routines">
            <RoutinesTable routines={routines || []} trainers={allMinimalUsers?.filter(u => u.role === 'entrenador') || []} users={allMinimalUsers || []} totalPages={Math.ceil((routinesCount || 0) / perPage)} />
          </TabsContent>

          <TabsContent value="stats">
            <TrainerRoutinesStats routines={allRoutinesForStats || []} trainers={allMinimalUsers?.filter(u => u.role === 'entrenador') || []} users={allMinimalUsers || []} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
