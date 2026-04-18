import { createClient } from "@/lib/server"
import { getWorkoutLogs } from "@/app/actions/workout-actions"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft, Plus, Calendar, Edit2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default async function RoutineHistoryPage({ params }: { params: { routineId: string } }) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect("/auth/login")

    // Obtener detalles de la rutina
    const { data: routine } = await supabase
        .from("routines")
        .select("title")
        .eq("id", params.routineId)
        .single()

    if (!routine) return <div>Rutina no encontrada</div>

    // Obtener logs
    const { data: logs, error } = await getWorkoutLogs(params.routineId)

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="mb-6 flex items-center justify-between">
                <Button variant="ghost" asChild className="p-0 hover:bg-transparent">
                    <Link href="/deportista/registros" className="flex items-center gap-2">
                        <ChevronLeft className="h-5 w-5" />
                        <span>Volver</span>
                    </Link>
                </Button>
            </div>

            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{routine.title}</h1>
                    <p className="text-muted-foreground">Historial de Entrenamientos</p>
                </div>
                <Button asChild>
                    <Link href={`/deportista/registros/${params.routineId}/nuevo`}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Registro
                    </Link>
                </Button>
            </div>

            <div className="space-y-4">
                {logs && logs.length > 0 ? (
                    logs.map((log: any) => (
                        <Link key={log.id} href={`/deportista/registros/${params.routineId}/${log.id}`}>
                            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                                <CardHeader className="flex flex-row items-center justify-between p-4 pb-2 space-y-0">
                                    <CardTitle className="text-base font-medium flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        {format(new Date(log.date), "PPP", { locale: es })}
                                    </CardTitle>
                                    <Edit2 className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent className="p-4 pt-2">
                                    {log.notes && (
                                        <p className="text-sm text-muted-foreground line-clamp-2">{log.notes}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Toca para ver detalles o editar
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                ) : (
                    <div className="text-center py-12 border rounded-lg bg-muted/10">
                        <p className="text-muted-foreground mb-4">No hay registros para esta rutina.</p>
                        <Button asChild variant="outline">
                            <Link href={`/deportista/registros/${params.routineId}/nuevo`}>
                                Crear primer registro
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
