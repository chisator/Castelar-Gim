import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/server"

export type AppRole = "deportista" | "entrenador" | "administrador"

/**
 * Devuelve el usuario autenticado y su rol leído desde `profiles`.
 *
 * IMPORTANTE: el rol SIEMPRE se lee de la tabla `profiles`, nunca de
 * `user.user_metadata`. `user_metadata` corresponde a
 * `auth.users.raw_user_meta_data`, que el propio usuario puede reescribir
 * con `supabase.auth.updateUser({ data: { role: "administrador" } })`.
 * Usarlo para autorizar permitía que cualquier deportista se hiciera
 * administrador. `profiles.role` está protegido por RLS y por el trigger
 * `protect_sensitive_profile_columns`.
 */
export async function getAuthenticatedUser(): Promise<{
  user: User | null
  role: AppRole | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, role: null }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  return { user, role: (profile?.role as AppRole) ?? null }
}

/**
 * Resultado de `requireRole`. El campo `ok` actúa como discriminante para
 * que TypeScript pueda estrechar el tipo: sin él, comprobar `if (auth.error)`
 * no descarta la rama de fallo (una `string` puede ser vacía y por lo tanto
 * falsy), y `user` seguiría siendo `possibly undefined`.
 */
export type RequireRoleResult =
  | { ok: true; user: User; role: AppRole }
  | { ok: false; error: string }

/**
 * Igual que `getAuthenticatedUser`, pero además valida que el rol esté
 * dentro de los permitidos.
 *
 * Uso desde un Server Action:
 *
 *   const auth = await requireRole(["administrador"])
 *   if (!auth.ok) return { error: auth.error }
 *   // acá `auth.user` y `auth.role` están garantizados
 */
export async function requireRole(
  allowed: AppRole[],
  errorMessage = "No tenés permisos para realizar esta acción",
): Promise<RequireRoleResult> {
  const { user, role } = await getAuthenticatedUser()

  if (!user) {
    return { ok: false, error: "No autenticado" }
  }

  if (!role || !allowed.includes(role)) {
    return { ok: false, error: errorMessage }
  }

  return { ok: true, user, role }
}
