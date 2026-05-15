"use server"

import { createClient as createServerClient } from "@/lib/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
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

export async function getLatestPRForUserAndExercise(userId: string, exerciseId: string) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Usuario no autenticado", data: null }
    }

    // Use admin client to bypass RLS, because the trainer needs to fetch the athlete's PR
    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    )

    const { data, error } = await supabaseAdmin
        .from("personal_records")
        .select("one_rm")
        .eq("user_id", userId)
        .eq("exercise_id", exerciseId)
        .order("date", { ascending: false })
        .limit(1)
        .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is no rows returned
        console.error("Error fetching latest PR:", error)
        return { error: error.message, data: null }
    }

    return { data: data?.one_rm || null }
}

