"use server"

import { createClient as createServerClient } from "@/lib/server"
import { revalidatePath } from "next/cache"

export async function savePersonalRecord(exerciseId: string, weight: number, reps: number, dateStr: string) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Usuario no autenticado" }
    }

    if (reps >= 37) {
        return { error: "Las repeticiones deben ser menores a 37 para la fórmula de Brzycki." }
    }

    // Fórmula de Brzycki: 1RM = Peso × (36 / (37 - repeticiones))
    const oneRM = weight * (36 / (37 - reps))
    const roundedOneRM = Math.round(oneRM * 10) / 10

    const { error } = await supabase
        .from("personal_records")
        .insert({
            user_id: user.id,
            exercise_id: exerciseId,
            weight: weight,
            reps: reps,
            one_rm: roundedOneRM,
            date: dateStr
        })

    if (error) {
        console.error("Error saving PR:", error)
        return { error: error.message }
    }

    revalidatePath("/deportista/registros")
    revalidatePath("/deportista/registros/pr/nuevo")
    return { success: true, oneRM: roundedOneRM }
}

export async function getPersonalRecords() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Usuario no autenticado", data: [] }
    }

    const { data, error } = await supabase
        .from("personal_records")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })

    if (error) {
        console.error("Error fetching PRs:", error)
        return { error: error.message, data: [] }
    }

    return { data }
}

export async function getExerciseCatalog() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Usuario no autenticado", data: [] }
    }

    const { data, error } = await supabase
        .from("exercise_catalog")
        .select("id, name")
        .order("name")

    if (error) {
        console.error("Error fetching exercise catalog:", error)
        return { error: error.message, data: [] }
    }

    return { data }
}

