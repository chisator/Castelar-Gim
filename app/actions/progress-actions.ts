"use server"

import { createClient as createServerClient } from "@/lib/server"

interface WorkoutLogEntry {
    exercise_name: string
}

interface ExerciseSet {
    weight: string | number
    reps: string | number
}

interface ProgressEntry {
    date: string
    weight: number
    oneRM: number
    volume: number
}

export async function getUniqueExercises() {
    const supabase = await createServerClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return []

    // Obtener nombres de ejercicios únicos de los logs del usuario
    // Supabase distinct toggle needed or use .select with distinct if possible on simple column, 
    // but here we are selecting from a joined table logic or just the entries table linked to user logs.

    // Strategy: Select distinct exercise_name from workout_log_entries where parent log belongs to user.
    // RLS allows reading own entries.

    const { data, error } = await supabase
        .from("workout_log_entries")
        .select("exercise_name, workout_logs!inner(user_id)")
        .eq("workout_logs.user_id", user.id)
        .order("exercise_name", { ascending: true })

    if (error || !data) return []

    // Filter distinct in JS/Typescript as supabase .select distinct on join might be tricky syntax or require raw sql
    const uniqueNames = Array.from(new Set(data.map((d: WorkoutLogEntry) => d.exercise_name)))

    return uniqueNames
}

export async function getExerciseProgress(exerciseName: string) {
    const supabase = await createServerClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { error: "No autenticado" }

    try {
        const { data, error } = await supabase
            .from("workout_log_entries")
            .select(`
                exercise_name,
                sets_data,
                workout_logs!inner (
                    date,
                    user_id
                )
            `)
            .eq("workout_logs.user_id", user.id)
            .eq("exercise_name", exerciseName)
            .order("workout_logs(date)", { ascending: true }) // Syntax might need adjustment, usually we order result in JS

        if (error) throw error

        if (!data) return { data: [] }

        // Process data to find metrics per session
        const progressData = (data as { exercise_name: string; sets_data: ExerciseSet[]; workout_logs: { date: string }[] }[]).map((entry) => {
            const sets = entry.sets_data || []
            let maxWeight = 0
            let maxOneRM = 0
            let totalVolume = 0

            sets.forEach((s: ExerciseSet) => {
                const w = parseFloat(String(s.weight))
                const r = parseFloat(String(s.reps))

                if (!isNaN(w) && w > 0) {
                    // Max Weight
                    if (w > maxWeight) maxWeight = w

                    // Volume (Weight * Reps)
                    if (!isNaN(r) && r > 0) {
                        totalVolume += w * r

                        // Estimated 1RM (Brzycki Formula)
                        // 1RM = Weight / (1.0278 - (0.0278 * Reps))
                        const oneRM = w / (1.0278 - (0.0278 * r))
                        if (oneRM > maxOneRM) maxOneRM = oneRM
                    }
                }
            })

            return {
                date: entry.workout_logs[0].date,
                weight: maxWeight,
                oneRM: Math.round(maxOneRM * 10) / 10, // Round to 1 decimal
                volume: totalVolume
            }
        })
            // Sort by date 
            .sort((a: ProgressEntry, b: ProgressEntry) => new Date(a.date).getTime() - new Date(b.date).getTime())

        return { data: progressData }
    } catch (error) {
        return { error: error instanceof Error ? error.message : String(error) }
    }
}
