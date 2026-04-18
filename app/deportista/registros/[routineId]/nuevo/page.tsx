import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"
import { WorkoutLogForm } from "@/components/workout-log-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default async function NewLogPage({ params }: { params: { routineId: string } }) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect("/auth/login")

    // Obtener rutina para tener la lista de ejercicios base
    const { data: routine } = await supabase
        .from("routines")
        .select("*")
        .eq("id", params.routineId)
        .single()

    if (!routine) return <div>Rutina no encontrada</div>

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="mb-6">
                <Button variant="ghost" asChild className="p-0 hover:bg-transparent mb-4">
                    <Link href={`/deportista/registros/${params.routineId}`} className="flex items-center gap-2">
                        <ChevronLeft className="h-5 w-5" />
                        <span>Volver al historial</span>
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Nuevo Registro</h1>
                <p className="text-muted-foreground">{routine.title}</p>
            </div>

            <WorkoutLogForm
                routineId={params.routineId}
                routineTitle={routine.title}
                initialExercises={routine.exercises || []}
            />
        </div>
    )
}
