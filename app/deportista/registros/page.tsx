import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronRight, ClipboardList, ChevronLeft } from "lucide-react"
import { Logo } from "@/components/logo"

import { LogoutButton } from "@/components/logout-button"
import { Badge } from "@/components/ui/badge"

export default async function RegistrosPage() {
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

    // Obtener rutinas asignadas
    const { data: routineAssignments } = await supabase
        .from("routine_user_assignments")
        .select("routine_id")
        .eq("user_id", user.id)

    const routineIds = routineAssignments?.map((r: any) => r.routine_id) || []

    const { data: routines } = routineIds.length
        ? await supabase
            .from("routines")
            .select("*")
            .in("id", routineIds)
            .order("end_date", { ascending: false })
        : { data: [] }

    // Filtrar rutinas por fecha
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const activeRoutines = routines?.filter((r) => {
        const routineEnd = r.end_date ? new Date(r.end_date) : r.start_date ? new Date(r.start_date) : null
        if (!routineEnd) return false
        routineEnd.setHours(0, 0, 0, 0)
        return routineEnd >= today
    }) || []

    const pastRoutines = routines?.filter((r) => {
        const routineEnd = r.end_date ? new Date(r.end_date) : r.start_date ? new Date(r.start_date) : null
        if (!routineEnd) return false
        routineEnd.setHours(0, 0, 0, 0)
        return routineEnd < today
    }) || []

    return (
        <div className="w-full">
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto flex min-h-[5rem] items-center justify-between px-4 py-2">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild className="mr-2">
                            <Link href="/deportista">
                                <ChevronLeft className="h-6 w-6" />
                                <span className="sr-only">Volver</span>
                            </Link>
                        </Button>
                        <span className="font-semibold text-lg hidden sm:inline-block">Mis Registros</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="hidden md:flex gap-4 mr-4">
                            <Button asChild variant="ghost">
                                <Link href="/deportista">Inicio</Link>
                            </Button>
                            <Button asChild variant="secondary">
                                <Link href="/deportista/registros">Registros</Link>
                            </Button>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium">{profile?.full_name}</p>
                            <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
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
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Registro de Entrenamiento</h1>
                    <p className="text-muted-foreground">Selecciona una rutina para ver tu historial o registrar una nueva sesión.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {activeRoutines.map((routine) => (
                        <Link key={routine.id} href={`/deportista/registros/${routine.id}`}>
                            <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer border-l-4 border-l-indigo-500">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex justify-between items-start">
                                        <span>{routine.title}</span>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    </CardTitle>
                                    <CardDescription className="line-clamp-2">{routine.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center text-sm text-muted-foreground mt-2">
                                        <ClipboardList className="h-4 w-4 mr-2" />
                                        <span>Ver historial y registrar</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}

                    {activeRoutines.length === 0 && (
                        <div className="col-span-full text-center py-8 text-muted-foreground">
                            No tienes rutinas activas para registrar.
                        </div>
                    )}
                </div>

                {pastRoutines.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-2xl font-bold mb-6">Rutinas Finalizadas</h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {pastRoutines.map((routine) => (
                                <Card key={routine.id} className="h-full opacity-60 bg-muted/30 border-l-4 border-l-gray-400">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-muted-foreground">
                                            {routine.title}
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2">{routine.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center text-sm text-muted-foreground mt-2">
                                            <span>Rutina finalizada - Detalles ocultos</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
