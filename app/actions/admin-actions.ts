"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { createClient as createServerClient } from "@/lib/server"

export async function createUser(formData: {
  email: string
  password: string
  fullName: string
  role: "deportista" | "entrenador" | "administrador"
  telefono?: string
}) {
  try {
    console.log("[v0] Starting user creation:", formData.email)

    // Verificar que el usuario actual es administrador
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log("[v0] No authenticated user")
      return { error: "No autenticado" }
    }

    const userRole = user.user_metadata?.role

    if (userRole !== "administrador" && userRole !== "entrenador") {
      console.log("[v0] User is not admin/trainer:", userRole)
      return { error: "No tienes permisos para crear usuarios" }
    }

    // Si el caller es entrenador, forzar rol deportista
    const effectiveRole = userRole === "entrenador" ? "deportista" : formData.role
    if (userRole === "entrenador") {
      console.log("[v0] Trainer creating user — forcing deportista role")
    }

    // Crear cliente con service role para tener permisos de admin
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("[v0] Creating user with admin client")

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: formData.email,
      password: formData.password,
      email_confirm: true,
      user_metadata: {
        full_name: formData.fullName,
        role: effectiveRole,
      },
    })

    if (createError) {
      console.log("[v0] Error creating user:", createError)
      return { error: createError.message }
    }

    console.log("[v0] User created successfully:", newUser.user?.id)

    // Asegurar que el perfil se cree/actualice con el rol correcto.
    // Algunos entornos pueden disparar el trigger antes de que user_metadata
    // esté disponible en raw_user_meta_data, o los triggers pueden no detectar
    // correctamente la metadata. Para garantizar consistencia, insertamos/actualizamos
    // explícitamente el registro en `profiles` usando el cliente de servicio.
    try {
      await supabaseAdmin.from("profiles").upsert(
        {
          id: newUser.user?.id,
          email: formData.email,
          full_name: formData.fullName,
          role: effectiveRole,
          telefono: formData.telefono || null
        },
        { onConflict: "id" },
      )
    } catch (e) {
      console.log("[v0] Warning: could not upsert profile:", e)
    }

    // Asignación automática a todos los entrenadores si es deportista
    if (effectiveRole === "deportista") {
      try {
        // Obtener todos los entrenadores
        const { data: trainers, error: trainersError } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("role", "entrenador")

        if (trainersError) {
          console.error("[v0] Error fetching trainers for auto-assignment:", trainersError)
        } else if (trainers && trainers.length > 0) {
          const assignments = trainers.map((trainer) => ({
            user_id: newUser.user?.id,
            trainer_id: trainer.id,
          }))

          const { error: assignError } = await supabaseAdmin.from("trainer_user_assignments").insert(assignments)

          if (assignError) {
            console.error("[v0] Error auto-assigning user to trainers:", assignError)
          } else {
            console.log(`[v0] User ${newUser.user?.id} assigned to ${trainers.length} trainers automatically.`)
          }
        }
      } catch (assignCatchError) {
          console.error("[v0] Unexpected error in auto-assignment:", assignCatchError)
      }
    }

    revalidatePath("/admin")
    revalidatePath("/entrenador")

    return { success: true, user: newUser }
  } catch (error: any) {
    console.error("[v0] Unexpected error:", error)
    return { error: error.message || "Error al crear usuario" }
  }
}

export async function assignUserToTrainer(formData: { userId: string; trainerId: string }) {
  try {
    const supabase = await createServerClient()

    const { error } = await supabase.from("trainer_user_assignments").insert({
      user_id: formData.userId,
      trainer_id: formData.trainerId,
    })

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Error al asignar usuario" }
  }
}

export async function removeUserFromTrainer(formData: { userId: string; trainerId: string }) {
  try {
    const supabase = await createServerClient()

    const { error } = await supabase
      .from("trainer_user_assignments")
      .delete()
      .eq("user_id", formData.userId)
      .eq("trainer_id", formData.trainerId)

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Error al desasignar usuario" }
  }
}

export async function updateUser(formData: {
  userId: string
  email: string
  fullName: string
  role: "deportista" | "entrenador" | "administrador"
  telefono?: string
  password?: string
}) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.user_metadata?.role !== "administrador") {
      return { error: "No tienes permisos para actualizar usuarios" }
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Actualizar email y metadata del usuario
    const updateData: any = {
      email: formData.email,
      user_metadata: {
        full_name: formData.fullName,
        role: formData.role,
      },
    }

    if (formData.password) {
      const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(formData.userId)
      if (targetUser.user?.user_metadata?.role === "administrador") {
        return { error: "No puedes cambiar la contraseña de otro administrador" }
      }
      updateData.password = formData.password
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(formData.userId, updateData)

    if (updateError) {
      return { error: updateError.message }
    }

    // Actualizar perfil
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        email: formData.email,
        full_name: formData.fullName,
        role: formData.role,
        telefono: formData.telefono || null
      })
      .eq("id", formData.userId)

    if (profileError) {
      return { error: profileError.message }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Error al actualizar usuario" }
  }
}

export async function deleteUser(userId: string) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.user_metadata?.role !== "administrador") {
      return { error: "No tienes permisos para eliminar usuarios" }
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Limpieza manual de dependencias para evitar errores de Foreign Key
    console.log("[v0] Cleaning up user dependencies for:", userId)

    // 1. Asignaciones (Como deportista o entrenador)
    const { error: assignErr } = await supabaseAdmin.from("trainer_user_assignments").delete().or(`user_id.eq.${userId},trainer_id.eq.${userId}`)
    if (assignErr) console.error("[v0] Error cleaning trainer user assignments:", assignErr)

    // 2. Asignaciones de Rutinas (Como deportista)
    const { error: rouAssignErr } = await supabaseAdmin.from("routine_user_assignments").delete().eq("user_id", userId)
    if (rouAssignErr) console.error("[v0] Error cleaning routine user assignments:", rouAssignErr)

    // 4. Clases aka Eventos (Si es instructor) - Desvincular para mantener historial
    const { error: classErr } = await supabaseAdmin.from("gym_classes").update({ instructor_id: null }).eq("instructor_id", userId)
    if (classErr) console.error("[v0] Error cleaning gym classes:", classErr)

    // 5. Rutinas creadas (Si es entrenador)
    // El trainer_id es NOT NULL, por lo que NO podemos desvincular (set null). Debemos BORRAR las rutinas.
    // Antes de borrar rutinas, debemos borrar sus dependencias (workout_logs que referencian estas rutinas)

    // a. Obtener IDs de rutinas de este entrenador
    const { data: trainerRoutines } = await supabaseAdmin.from("routines").select("id").eq("trainer_id", userId)

    if (trainerRoutines && trainerRoutines.length > 0) {
      const routineIds = trainerRoutines.map(r => r.id)
      console.log(`[v0] Deleting ${routineIds.length} routines owned by trainer`)

      // b. Borrar logs vinculados a estas rutinas
      const { error: logsRoutineErr } = await supabaseAdmin.from("workout_logs").delete().in("routine_id", routineIds)
      if (logsRoutineErr) console.error("[v0] Error cleaning workout_logs for trainer routines:", logsRoutineErr)

      // c. Borrar asignaciones de estas rutinas
      const { error: assignRoutineErr } = await supabaseAdmin.from("routine_user_assignments").delete().in("routine_id", routineIds)
      if (assignRoutineErr) console.error("[v0] Error cleaning routine_user_assignments for trainer routines:", assignRoutineErr)

      // d. Finalmente borrar las rutinas
      const { error: delRoutineErr } = await supabaseAdmin.from("routines").delete().in("id", routineIds)
      if (delRoutineErr) console.error("[v0] Error deleting trainer routines:", delRoutineErr)
    }

    // 6. Logs de entrenamiento del propio usuario (Si es deportista)
    const { error: logErr } = await supabaseAdmin.from("workout_logs").delete().eq("user_id", userId)
    if (logErr) console.error("[v0] Error cleaning user workout logs:", logErr)

    // 7. Eliminar perfil explícitamente
    const { error: profErr } = await supabaseAdmin.from("profiles").delete().eq("id", userId)
    if (profErr) console.error("[v0] Error cleaning profile:", profErr)

    // Eliminar usuario de auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error("[v0] Error deleting auth user:", deleteError)
      return { error: deleteError.message }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Error al eliminar usuario" }
  }
}

// --- GESTIÓN DE CATÁLOGO DE EJERCICIOS ---

export async function getExerciseCatalog() {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from("exercise_catalog")
      .select("*")
      .order("name", { ascending: true })

    if (error) {
      console.error("Error fetching exercise catalog:", error)
      return { error: error.message }
    }

    return { success: true, exercises: data || [] }
  } catch (error: any) {
    return { error: error.message || "Error al obtener ejercicios" }
  }
}

export async function createExerciseCatalogItem(formData: { name: string; video_url?: string }) {
  try {
    const supabase = await createServerClient()

    // Validar permisos (solo admin o entrenador podrían, asumimos admin por ubicación de archivo, 
    // pero idealmente deberíamos chequear rol. Por ahora confiamos en middleware/layout protection)
    // O mejor, chequeamos usuario auth básica.
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "No autenticado" }

    const { data, error } = await supabase
      .from("exercise_catalog")
      .insert({
        name: formData.name,
        video_url: formData.video_url,
      })
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/admin/ejercicios") // Path que crearemos
    return { success: true, exercise: data }
  } catch (error: any) {
    return { error: error.message || "Error al crear ejercicio" }
  }
}

export async function updateExerciseCatalogItem(formData: { id: string; name: string; video_url?: string }) {
  try {
    const supabase = await createServerClient()

    const { error } = await supabase
      .from("exercise_catalog")
      .update({
        name: formData.name,
        video_url: formData.video_url,
      })
      .eq("id", formData.id)

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/admin/ejercicios")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Error al actualizar ejercicio" }
  }
}

export async function deleteExerciseCatalogItem(id: string) {
  try {
    const supabase = await createServerClient()

    const { error } = await supabase
      .from("exercise_catalog")
      .delete()
      .eq("id", id)

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/admin/ejercicios")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Error al eliminar ejercicio" }
  }
}

// --- GESTIÓN DE EVENTOS Y ASISTENTES ---

export async function getAdminEvents() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || (user.user_metadata?.role !== "administrador" && user.user_metadata?.role !== "entrenador")) {
      return { error: "No tienes permisos" }
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data, error } = await supabaseAdmin
      .from('gym_classes')
      .select('*, profiles(full_name), reservations(id)')
      .order('start_time', { ascending: true })

    if (error) {
      return { error: error.message }
    }

    return { success: true, events: data || [] }
  } catch (error: any) {
    return { error: error.message || "Error al obtener eventos" }
  }
}

export async function getAttendees(classId: string) {
  try {
    console.log("getAttendees called for classId:", classId)
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || (user.user_metadata?.role !== "administrador" && user.user_metadata?.role !== "entrenador")) {
      console.log("getAttendees failed: not an admin or no user")
      return { error: "No tienes permisos" }
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: reservations, error } = await supabaseAdmin
      .from('reservations')
      .select('id, user_id')
      .eq('class_id', classId)

    if (error) {
      console.log("getAttendees failed with error:", error)
      return { error: error.message }
    }

    if (!reservations || reservations.length === 0) {
      return { success: true, attendees: [] }
    }

    const userIds = reservations.map(r => r.user_id)

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds)

    if (profilesError) {
      console.log("getAttendees failed fetching profiles:", profilesError)
      return { error: profilesError.message }
    }

    const attendees = reservations.map(r => ({
      id: r.id,
      user_id: r.user_id,
      profiles: profiles?.find(p => p.id === r.user_id) || null
    }))

    console.log("getAttendees success. Data:", attendees)
    return { success: true, attendees }
  } catch (error: any) {
    console.log("getAttendees caught error:", error)
    return { error: error.message || "Error al obtener asistentes" }
  }
}
