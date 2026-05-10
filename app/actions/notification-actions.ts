"use server"

import { revalidatePath } from "next/cache"
import { createClient as createServerClient } from "@/lib/server"

export async function getActiveNotification() {
  try {
    const supabase = await createServerClient()
    
    // Obtiene la notificación activa con active_until mayor a la fecha actual, ordenada por la más reciente
    const { data, error } = await supabase
      .from("global_notifications")
      .select("*")
      .eq("is_active", true)
      .gte("active_until", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") { // PGRST116 es "no rows returned", lo cual es normal si no hay avisos
      console.error("Error fetching active notification:", error)
      return { error: error.message }
    }

    return { success: true, notification: data || null }
  } catch (error: any) {
    return { error: error.message || "Error al obtener notificaciones" }
  }
}

export async function getAllNotifications() {
  try {
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "No autenticado" }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (profile?.role !== "administrador") return { error: "No autorizado" }

    const { data, error } = await supabase
      .from("global_notifications")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching all notifications:", error)
      return { error: error.message }
    }

    return { success: true, notifications: data || [] }
  } catch (error: any) {
    return { error: error.message || "Error al obtener notificaciones" }
  }
}

export async function createNotification(message: string, color: string, daysToLive: number) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "No autenticado" }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (profile?.role !== "administrador") return { error: "No autorizado" }

    // Primero, desactivar cualquier notificación actualmente activa para que solo haya una
    await supabase
      .from("global_notifications")
      .update({ is_active: false })
      .eq("is_active", true)

    const activeUntil = new Date()
    activeUntil.setDate(activeUntil.getDate() + daysToLive)

    const { error } = await supabase
      .from("global_notifications")
      .insert({
        message,
        color,
        active_until: activeUntil.toISOString(),
        is_active: true
      })

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/", "layout")
    revalidatePath("/admin/notificaciones")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Error al crear notificación" }
  }
}

export async function deactivateNotification(id: string) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "No autenticado" }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (profile?.role !== "administrador") return { error: "No autorizado" }

    const { error } = await supabase
      .from("global_notifications")
      .update({ is_active: false })
      .eq("id", id)

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/", "layout")
    revalidatePath("/admin/notificaciones")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Error al desactivar notificación" }
  }
}

export async function deleteNotification(id: string) {
    try {
      const supabase = await createServerClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { error: "No autenticado" }
  
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
      if (profile?.role !== "administrador") return { error: "No autorizado" }
  
      const { error } = await supabase
        .from("global_notifications")
        .delete()
        .eq("id", id)
  
      if (error) {
        return { error: error.message }
      }
  
      revalidatePath("/", "layout")
      revalidatePath("/admin/notificaciones")
      return { success: true }
    } catch (error: any) {
      return { error: error.message || "Error al eliminar notificación" }
    }
  }
