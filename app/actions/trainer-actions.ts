"use server"

import { createClient as createServerClient } from "@/lib/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

export async function updateRoutine(formData: {
  routineId: string
  title: string
  description: string
  // support multiple assigned users
  userIds?: string[]
  startDate?: string
  endDate?: string
  exercises: any[]
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

    const updatePayload: any = {
      title: formData.title,
      description: formData.description,
      exercises: formData.exercises,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }

    const normalizeDate = (d: string) => {
      if (!d) return null
      // Ensure we only have YYYY-MM-DD element
      const datePart = d.toString().split("T")[0]
      return new Date(`${datePart}T12:00:00Z`).toISOString()
    }

    if (formData.startDate) updatePayload.start_date = normalizeDate(formData.startDate)
    if (formData.endDate) updatePayload.end_date = normalizeDate(formData.endDate)
    // If admin is updating, they can change the trainer_id
    if (userRole === 'administrador' && formData.trainerId) {
      updatePayload.trainer_id = formData.trainerId
    }

    let query = supabaseAdmin.from("routines").update(updatePayload).eq("id", formData.routineId)

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
  } catch (error: any) {
    return { error: error.message || "Error al actualizar rutina" }
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

    let query = supabase.from("routines").delete().eq("id", routineId)

    // If not admin, restrict deletion to their own routines
    if (userRole !== "administrador") {
      query = query.eq("trainer_id", user.id)
    }

    const { error } = await query

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/entrenador")
    revalidatePath("/admin") // Revalidate admin page also
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Error al eliminar rutina" }
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

    if (!user || user.user_metadata?.role !== "entrenador") {
      return { error: "No tienes permisos para renovar la rutina" }
    }

    // Obtener rutina para validar propietario y fecha actual
    const { data: routine, error: getErr } = await supabase
      .from("routines")
      .select("id, trainer_id, start_date, end_date")
      .eq("id", routineId)
      .eq("trainer_id", user.id)
      .single()

    if (getErr || !routine) {
      return { error: getErr?.message || "Rutina no encontrada o sin permisos" }
    }

    let newEnd: Date | null = null

    if (newEndDate) {
      // Ensure specific date is set to Noon UTC
      newEnd = new Date(`${newEndDate.toString().split("T")[0]}T12:00:00Z`)
    } else if (months && months > 0) {
      // Baseamos la extensión en la fecha de fin actual si existe, o en hoy
      const base = routine.end_date ? new Date(routine.end_date) : new Date()
      // Si la fecha base ya pasó, empezamos desde hoy
      const now = new Date()
      const from = base < now ? now : base
      newEnd = new Date(from)
      newEnd.setMonth(newEnd.getMonth() + months)
      // Force calculated date to Noon UTC to match standard
      newEnd.setUTCHours(12, 0, 0, 0)
    } else {
      return { error: "Indica meses a extender o una nueva fecha de fin" }
    }

    const { error: updateErr } = await supabase
      .from("routines")
      .update({ end_date: newEnd.toISOString() })
      .eq("id", routineId)
      .eq("trainer_id", user.id)

    if (updateErr) {
      return { error: updateErr.message }
    }

    revalidatePath("/entrenador")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Error al renovar rutina" }
  }
}

export async function exportRoutine(routineId: string, format: "json" | "csv") {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.user_metadata?.role !== "entrenador") {
      return { error: "No tienes permisos para exportar rutinas" }
    }

    // Obtener rutina
    const { data: routine, error: routineErr } = await supabase
      .from("routines")
      .select("*")
      .eq("id", routineId)
      .eq("trainer_id", user.id)
      .single()

    if (routineErr || !routine) {
      return { error: "Rutina no encontrada o sin permisos" }
    }

    const exercises = routine.exercises || []

    if (format === "json") {
      // Exportar solo los ejercicios como array
      return { success: true, data: JSON.stringify(exercises, null, 2), filename: `${routine.title}-ejercicios.json` }
    }

    if (format === "csv") {
      // Exportar solo ejercicios en CSV con encabezados
      let csv = "name,sets,reps,weight,rest,notes\n"
      exercises.forEach((ex: any) => {
        const weight = ex.weight || ""
        const rest = ex.rest || ""
        const notes = (ex.notes || "").replace(/"/g, '""') // Escapar comillas
        csv += `"${ex.name}","${ex.sets || ""}","${ex.reps || ""}","${weight}","${rest}","${notes}"\n`
      })
      return { success: true, data: csv, filename: `${routine.title}-ejercicios.csv` }
    }

    return { error: "Formato no soportado" }
  } catch (error: any) {
    return { error: error.message || "Error al exportar rutina" }
  }
}

export async function importRoutine(formData: {
  title: string
  description: string
  start_date: string
  end_date: string
  exercises: any[]
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

    // Determine the trainer_id for the new routine
    // If admin is creating, trainerId must be provided.
    // If trainer is creating, it's their own user.id.
    const trainer_id = userRole === 'administrador' ? formData.trainerId : user.id
    if (!trainer_id) {
      return { error: "Como administrador, debes seleccionar un entrenador." }
    }

    // Crear rutina
    const { data: inserted, error: insertErr } = await supabase
      .from("routines")
      .insert({
        title: formData.title,
        description: formData.description,
        trainer_id: trainer_id,
        start_date: formData.start_date ? new Date(`${formData.start_date.toString().split("T")[0]}T12:00:00Z`).toISOString() : null,
        end_date: formData.end_date ? new Date(`${formData.end_date.toString().split("T")[0]}T12:00:00Z`).toISOString() : null,
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
      const { data: insertedAssignments, error: assignErr } = await supabase
        .from("routine_user_assignments")
        .insert(assignments)
        .select("id, routine_id, user_id")
      if (assignErr) return { error: assignErr.message }
    }

    // Revalidate trainer and deportista pages so cached content updates
    revalidatePath("/entrenador")
    revalidatePath("/deportista")
    return { success: true, routineId: inserted.id }
  } catch (error: any) {
    return { error: error.message || "Error al importar rutina" }
  }
}
