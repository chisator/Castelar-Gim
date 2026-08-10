"use server"

import { createClient as createServerClient } from "@/lib/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

interface Exercise {
  name: string
  sets?: string
  reps?: string
  weight?: string
  duration?: string
  notes?: string
  video_url?: string
  metric_type?: "reps" | "time"
  time_unit?: "seconds" | "minutes"
}

function normalizeToNoonUTC(dateStr: string): string | null {
  if (!dateStr) return null
  const datePart = dateStr.toString().split("T")[0]
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null
  const d = new Date(`${datePart}T12:00:00Z`)
  if (isNaN(d.getTime())) return null
  return d.toISOString()
}

export async function updateRoutine(formData: {
  routineId: string
  title: string
  description: string
  // support multiple assigned users
  userIds?: string[]
  startDate?: string
  endDate?: string
  exercises: Exercise[]
  // New optional field for admin to assign routine to a specific trainer
  trainerId?: string
}) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const userRole = user?.user_metadata?.role

    // Allow both trainers and admins
    if (!user || (userRole !== "entrenador" && userRole !== "administrador")) {
      return { error: "No tienes permisos para actualizar rutinas" }
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const updatePayload: Record<string, unknown> = {
      title: formData.title,
      description: formData.description,
      exercises: formData.exercises,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }

    if (formData.startDate) updatePayload.start_date = normalizeToNoonUTC(formData.startDate)
    if (formData.endDate) updatePayload.end_date = normalizeToNoonUTC(formData.endDate)
    // If admin is updating, they can change the trainer_id
    if (userRole === 'administrador' && formData.trainerId) {
      updatePayload.trainer_id = formData.trainerId
    }

    const query = supabaseAdmin.from("routines").update(updatePayload).eq("id", formData.routineId)

    const { error: updateError } = await query

    if (updateError) {
      return { error: updateError.message }
    }

    // Si vienen userIds, sincronizar las asignaciones en routine_user_assignments
    if (formData.userIds) {
      // Borrar asignaciones previas para esta rutina (supabaseAdmin bypasses RLS)
      const { error: delError } = await supabaseAdmin.from("routine_user_assignments").delete().eq("routine_id", formData.routineId)
      if (delError) return { error: delError.message }

      if (formData.userIds.length > 0) {
        const rows = formData.userIds.map((uid) => ({
          routine_id: formData.routineId,
          user_id: uid
        }))
        const { error: insError } = await supabaseAdmin.from("routine_user_assignments").insert(rows)
        if (insError) return { error: insError.message }
      }
    }

    revalidatePath("/entrenador")
    revalidatePath("/admin") // Revalidate admin page also
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Error al actualizar rutina" }
  }
}

export async function deleteRoutine(routineId: string) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const userRole = user?.user_metadata?.role

    // Allow both trainers and admins
    if (!user || (userRole !== "entrenador" && userRole !== "administrador")) {
      return { error: "No tienes permisos para eliminar rutinas" }
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Limpiar asignaciones de usuarios antes de borrar la rutina
    const { error: delAssignmentsError } = await supabaseAdmin
      .from("routine_user_assignments")
      .delete()
      .eq("routine_id", routineId)

    if (delAssignmentsError) {
      return { error: delAssignmentsError.message }
    }

    const { error } = await supabaseAdmin.from("routines").delete().eq("id", routineId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/entrenador")
    revalidatePath("/admin") // Revalidate admin page also
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Error al eliminar rutina" }
  }
}

export async function renewRoutine({
  routineId,
  months,
  newEndDate,
}: {
  routineId: string
  months?: number
  newEndDate?: string
}) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const userRole = user?.user_metadata?.role

    // Allow both trainers and admins
    if (!user || (userRole !== "entrenador" && userRole !== "administrador")) {
      return { error: "No tienes permisos para renovar la rutina" }
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Obtener rutina para validar existencia y fecha actual
    const { data: routine, error: getErr } = await supabaseAdmin
      .from("routines")
      .select("id, trainer_id, start_date, end_date")
      .eq("id", routineId)
      .single()

    if (getErr || !routine) {
      return { error: getErr?.message || "Rutina no encontrada" }
    }

    let newEnd: Date | null = null

    if (newEndDate) {
      const normalized = normalizeToNoonUTC(newEndDate)
      if (!normalized) {
        return { error: "Fecha de fin inválida" }
      }
      newEnd = new Date(normalized)
    } else if (months && months > 0) {
      const base = routine.end_date ? new Date(routine.end_date) : new Date()
      const now = new Date()
      const from = base < now ? now : base
      newEnd = new Date(from)
      newEnd.setMonth(newEnd.getMonth() + months)
      newEnd.setUTCHours(12, 0, 0, 0)
    } else {
      return { error: "Indica meses a extender o una nueva fecha de fin" }
    }

    const { error: updateErr } = await supabaseAdmin
      .from("routines")
      .update({
        end_date: newEnd.toISOString(),
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", routineId)

    if (updateErr) {
      return { error: updateErr.message }
    }

    revalidatePath("/entrenador")
    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Error al renovar rutina" }
  }
}

export async function exportRoutine(routineId: string, format: "json" | "csv") {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const userRole = user?.user_metadata?.role

    // Allow both trainers and admins
    if (!user || (userRole !== "entrenador" && userRole !== "administrador")) {
      return { error: "No tienes permisos para exportar rutinas" }
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Obtener rutina
    const { data: routine, error: routineErr } = await supabaseAdmin
      .from("routines")
      .select("*")
      .eq("id", routineId)
      .single()

    if (routineErr || !routine) {
      return { error: "Rutina no encontrada" }
    }

    const exercises = (routine.exercises as Exercise[]) || []

    if (format === "json") {
      // Exportar solo los ejercicios como array
      return { success: true, data: JSON.stringify(exercises, null, 2), filename: `${routine.title}-ejercicios.json` }
    }

    if (format === "csv") {
      // Exportar solo ejercicios en CSV con encabezados
      let csv = "name,sets,reps,weight,rest,notes\n"
      exercises.forEach((ex: Exercise) => {
        const weight = ex.weight || ""
        const rest = ex.duration || ""
        const notes = (ex.notes || "").replace(/"/g, '""') // Escapar comillas
        let repsValue = ex.reps || ""
        if (ex.metric_type === "time" && ex.reps) {
          const unit = ex.time_unit === "minutes" ? "'" : "\""
          repsValue = `${ex.reps}${unit}`
        }
        csv += `"${ex.name}","${ex.sets || ""}","${repsValue}","${weight}","${rest}","${notes}"\n`
      })
      return { success: true, data: csv, filename: `${routine.title}-ejercicios.csv` }
    }

    return { error: "Formato no soportado" }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Error al exportar rutina" }
  }
}

export async function importRoutine(formData: {
  title: string
  description: string
  start_date: string
  end_date: string
  exercises: Exercise[]
  userIds: string[]
  // New optional field for admin
  trainerId?: string
}) {
  console.log("SERVER ACTION: importRoutine called with", JSON.stringify({ ...formData, exercises: `${formData.exercises?.length} exercises` }))
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Allow both trainers and admins
    const userRole = user?.user_metadata?.role
    if (!user || (userRole !== "entrenador" && userRole !== "administrador")) {
      return { error: "No tienes permisos para importar rutinas" }
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Determine the trainer_id for the new routine
    // If admin is creating, trainerId must be provided.
    // If trainer is creating, it's their own user.id.
    const trainer_id = userRole === 'administrador' ? formData.trainerId : user.id
    if (!trainer_id) {
      return { error: "Como administrador, debes seleccionar un entrenador." }
    }

    // Crear rutina
    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("routines")
      .insert({
        title: formData.title,
        description: formData.description,
        trainer_id: trainer_id,
        start_date: formData.start_date ? normalizeToNoonUTC(formData.start_date) : null,
        end_date: formData.end_date ? normalizeToNoonUTC(formData.end_date) : null,
        exercises: formData.exercises,
      })
      .select("id")
      .single()

    if (insertErr || !inserted) {
      return { error: insertErr?.message || "No se pudo crear la rutina" }
    }

    // Asignar usuarios
    if (formData.userIds.length > 0) {
      const assignments = formData.userIds.map((uid) => ({
        routine_id: inserted.id,
        user_id: uid,
      }))
      const { error: assignErr } = await supabaseAdmin
        .from("routine_user_assignments")
        .insert(assignments)
        .select("id, routine_id, user_id")
      if (assignErr) return { error: assignErr.message }
    }

    // Revalidate trainer and deportista pages so cached content updates
    revalidatePath("/entrenador")
    revalidatePath("/deportista")
    return { success: true, routineId: inserted.id }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Error al importar rutina" }
  }
}
