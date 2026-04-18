"use server"

import { createClient as createServerClient } from "@/lib/server"
import { revalidatePath } from "next/cache"

export async function getWorkoutLogs(routineId: string) {
    const supabase = await createServerClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: "No autenticado" }
    }

    try {
        const { data, error } = await supabase
            .from("workout_logs")
            .select("*")
            .eq("routine_id", routineId)
            .eq("user_id", user.id)
            .order("date", { ascending: false })

        if (error) throw error

        return { data }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function getWorkoutLog(logId: string) {
    const supabase = await createServerClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: "No autenticado" }
    }

    try {
        const { data, error } = await supabase
            .from("workout_logs")
            .select(`
        *,
        entries:workout_log_entries(*)
      `)
            .eq("id", logId)
            .eq("user_id", user.id)
            .single()

        if (error) throw error

        // Ordenar entradas por el campo 'order'
        if (data && data.entries) {
            data.entries.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
        }

        return { data }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function createWorkoutLog(data: {
    routineId: string
    date: string
    notes?: string
    entries: {
        exercise_name: string
        sets_data: any[]
        notes?: string
        order: number
    }[]
}) {
    const supabase = await createServerClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: "No autenticado" }
    }

    try {
        // 1. Crear el log
        const { data: log, error: logError } = await supabase
            .from("workout_logs")
            .insert({
                user_id: user.id,
                routine_id: data.routineId,
                date: `${data.date}T12:00:00Z`,

                notes: data.notes,
            })
            .select()
            .single()

        if (logError) throw logError

        // 2. Crear las entradas
        if (data.entries && data.entries.length > 0) {
            const entriesToInsert = data.entries.map((entry) => ({
                workout_log_id: log.id,
                exercise_name: entry.exercise_name,
                sets_data: entry.sets_data,
                notes: entry.notes,
                order: entry.order,
            }))

            const { error: entriesError } = await supabase
                .from("workout_log_entries")
                .insert(entriesToInsert)

            if (entriesError) throw entriesError
        }

        revalidatePath(`/deportista/registros/${data.routineId}`)
        return { success: true, logId: log.id }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function updateWorkoutLog(
    logId: string,
    data: {
        date?: string
        notes?: string
        entries?: {
            id?: string // Si tiene ID, actualizamos. Si no, creamos.
            exercise_name: string
            sets_data: any[]
            notes?: string
            order: number
        }[]
    }
) {
    const supabase = await createServerClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: "No autenticado" }
    }

    try {
        // 1. Actualizar el log principal
        if (data.date || data.notes !== undefined) {
            const { error: updateError } = await supabase
                .from("workout_logs")
                .update({
                    date: `${data.date}T12:00:00Z`,

                    notes: data.notes,
                })
                .eq("id", logId)
                .eq("user_id", user.id)

            if (updateError) throw updateError
        }

        // 2. Manejar entradas (Upsert/Delete logic could be complex, implementing simple replacement strategy for simplicity or individual upserts)
        // Estrategia: Upsert para los que tienen ID o nuevos, y podríamos necesitar lógica para borrar los que se quitaron si la UI lo permite.
        // Para simplificar: La UI enviará todas las entradas actuales. 
        // Lo ideal sería borrar las que no están en la lista, pero por seguridad, haremos upserts.

        if (data.entries) {
            for (const entry of data.entries) {
                if (entry.id) {
                    // Update existing
                    await supabase
                        .from("workout_log_entries")
                        .update({
                            sets_data: entry.sets_data,
                            notes: entry.notes,
                            // exercise_name usually doesn't change for an existing entry linked to routine order, but permitted
                        })
                        .eq("id", entry.id)
                        .eq("workout_log_id", logId)
                } else {
                    // New entry (e.g. added exercise not in original routine? or just missing id)
                    await supabase.from("workout_log_entries").insert({
                        workout_log_id: logId,
                        exercise_name: entry.exercise_name,
                        sets_data: entry.sets_data,
                        notes: entry.notes,
                        order: entry.order
                    })
                }
            }
        }

        revalidatePath(`/deportista/registros`)
        // Better validation path handling might be needed depending on where we redirect

        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}
