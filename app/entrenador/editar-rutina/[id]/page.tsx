import { getAuthenticatedUser } from "@/lib/auth"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { EditRoutineForm } from "@/components/edit-routine-form"
import { getExerciseCatalog } from "@/app/actions/admin-actions"

type PageProps = {
  params: { id: string }
}

export default async function EditRoutinePage({ params }: PageProps) {
  // El rol se lee de `profiles`, no de `user_metadata` (reescribible por el usuario).
  const { user, role: userRole } = await getAuthenticatedUser()

  if (!user || (userRole !== "entrenador" && userRole !== "administrador")) {
    redirect("/unauthorized")
  }

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Obtener la rutina
  const query = supabaseAdmin
    .from("routines")
    .select("*")
    .eq("id", params.id)

  const { data: routine, error } = await query.single()

  if (error || !routine) {
    // Redirigir si no se encuentra la rutina o no tiene permisos (para no admin)
    redirect(userRole === "administrador" ? "/admin" : "/entrenador")
  }

  // Esta consulta usa la clave de servicio, que saltea RLS: hay que validar
  // la propiedad a mano. Sin esto, un entrenador podía abrir el editor de
  // las rutinas de cualquier otro entrenador escribiendo el id en la URL.
  if (userRole === "entrenador" && routine.trainer_id !== user.id) {
    redirect("/entrenador")
  }

  // Obtener TODOS los perfiles de deportistas
  let trainerUserIds = [] as string[]
  const { data: allProfiles } = await supabaseAdmin.from("profiles").select("id").eq("role", "deportista")
  trainerUserIds = allProfiles?.map(p => p.id) || []

  // Obtener usuarios asignados a la rutina específica
  const { data: routineAssignments } = await supabaseAdmin
    .from("routine_user_assignments")
    .select("user_id")
    .eq("routine_id", params.id)

  const assignedUserIds = (routineAssignments || []).map((a: { user_id: string }) => a.user_id) || []

  // Obtener perfiles de deportistas (filtrados por entrenador o todos para admin)
  const { data: athletes } = trainerUserIds.length
    ? await supabaseAdmin.from("profiles").select("*").in("id", trainerUserIds).order("full_name")
    : { data: [] }

  // Obtener todos los entrenadores si el usuario actual es administrador
  let allTrainers = [] as { id: string; full_name?: string; email?: string }[]
  if (userRole === "administrador") {
    const { data: trainersData } = await supabaseAdmin.from("profiles").select("id, full_name, email").eq("role", "entrenador").order("full_name")
    allTrainers = (trainersData as { id: string; full_name?: string; email?: string }[]) || []
  }

  // Obtener catálogo de ejercicios
  const { exercises: exerciseCatalog } = await getExerciseCatalog()

  return (
    <div className="w-full">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-balance">Editar Rutina</h1>
          <p className="text-muted-foreground mt-2">Actualiza los detalles de la rutina de entrenamiento</p>
        </div>

        <EditRoutineForm
          routine={routine}
          athletes={athletes || []}
          assignedUserIds={assignedUserIds}
          isAdmin={userRole === "administrador"}
          trainers={allTrainers}
          exerciseCatalog={exerciseCatalog || []}
        />
      </div>
    </div>
  )
}
