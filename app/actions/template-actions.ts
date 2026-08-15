"use server"

import { createClient as createServerClient } from "@/lib/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { requireRole } from "@/lib/auth"

interface SetDetail {
  reps?: string
  time?: string
  weight?: string
  rest?: string
}

interface Exercise {
  name: string
  sets?: string
  reps?: string
  weight?: string
  duration?: string
  notes?: string
  video_url?: string
  catalog_id?: string
  metric_type?: "reps" | "time"
  time_unit?: "seconds" | "minutes"
  type?: "exercise" | "marker"
  marker_color?: string
  sets_detailed?: boolean
  sets_detail?: SetDetail[]
}

export async function createTemplate(formData: {
  title: string
  description: string
  exercises: Exercise[]
}) {
  try {
    const auth = await requireRole(["entrenador"], "No tienes permisos para crear plantillas")
    if (!auth.ok) return { error: auth.error }
    const { user } = auth

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("routine_templates")
      .insert({
        trainer_id: user.id,
        title: formData.title,
        description: formData.description,
        exercises: formData.exercises,
      })
      .select("id")
      .single()

    if (insertErr || !inserted) {
      return { error: insertErr?.message || "No se pudo crear la plantilla" }
    }

    revalidatePath("/entrenador/plantillas")
    return { success: true, templateId: inserted.id }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Error al crear plantilla" }
  }
}

export async function updateTemplate(formData: {
  templateId: string
  title: string
  description: string
  exercises: Exercise[]
}) {
  try {
    const auth = await requireRole(["entrenador"], "No tienes permisos para actualizar plantillas")
    if (!auth.ok) return { error: auth.error }
    const { user } = auth

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const { error: updateErr } = await supabaseAdmin
      .from("routine_templates")
      .update({
        title: formData.title,
        description: formData.description,
        exercises: formData.exercises,
      })
      .eq("id", formData.templateId)
      .eq("trainer_id", user.id)

    if (updateErr) {
      return { error: updateErr.message }
    }

    revalidatePath("/entrenador/plantillas")
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Error al actualizar plantilla" }
  }
}

export async function deleteTemplate(templateId: string) {
  try {
    const auth = await requireRole(["entrenador"], "No tienes permisos para eliminar plantillas")
    if (!auth.ok) return { error: auth.error }
    const { user } = auth

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const { error } = await supabaseAdmin
      .from("routine_templates")
      .delete()
      .eq("id", templateId)
      .eq("trainer_id", user.id)

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/entrenador/plantillas")
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Error al eliminar plantilla" }
  }
}

export async function getMyTemplates() {
  try {
    const auth = await requireRole(["entrenador"], "No tienes permisos")
    if (!auth.ok) return { error: auth.error, data: [] }
    const { user } = auth

    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("routine_templates")
      .select("*")
      .eq("trainer_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      return { error: error.message, data: [] }
    }

    return { data: data || [] }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Error al obtener plantillas", data: [] }
  }
}

export async function getAllTemplates() {
  try {
    const auth = await requireRole(["administrador"], "No tienes permisos")
    if (!auth.ok) return { error: auth.error, data: [] }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const { data, error } = await supabaseAdmin
      .from("routine_templates")
      .select("*, profiles!routine_templates_trainer_id_fkey(full_name)")
      .order("created_at", { ascending: false })

    if (error) {
      return { error: error.message, data: [] }
    }

    return { data: data || [] }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Error al obtener plantillas", data: [] }
  }
}
