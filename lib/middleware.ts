import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Rutas públicas
  const publicRoutes = ["/", "/auth/login", "/auth/sign-up"]
  const isPublicRoute = publicRoutes.some(
    (route) => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith("/auth"),
  )

  // Redirigir a login si no hay usuario y no es ruta pública
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  /**
   * El rol se lee de `profiles`, NUNCA de `user.user_metadata`.
   * `user_metadata` es reescribible por el propio usuario mediante
   * `supabase.auth.updateUser({ data: { role: "administrador" } })`, así que
   * usarlo acá permitía que cualquier deportista entrara al panel de admin.
   *
   * Se resuelve de forma perezosa: solo se consulta la base cuando la ruta
   * realmente necesita decidir por rol, para no agregar una query a cada request.
   */
  let cachedRole: string | null | undefined
  const getRole = async () => {
    if (cachedRole !== undefined) return cachedRole
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user!.id)
      .single()
    cachedRole = profile?.role ?? null
    return cachedRole
  }

  // Si hay usuario, verificar rol y redirigir al dashboard correspondiente
  if (user && request.nextUrl.pathname === "/") {
    const role = await getRole()

    const url = request.nextUrl.clone()
    if (role === "deportista") {
      url.pathname = "/deportista"
    } else if (role === "entrenador") {
      url.pathname = "/entrenador"
    } else if (role === "administrador") {
      url.pathname = "/admin"
    } else {
      // Si el perfil no tiene rol asignado, volver al login
      url.pathname = "/auth/login"
    }
    return NextResponse.redirect(url)
  }

  // Protección de rutas por rol
  const needsRoleCheck =
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/entrenador") ||
    request.nextUrl.pathname.startsWith("/deportista")

  if (user && needsRoleCheck) {
    const role = await getRole()

    // Verificar acceso a rutas de administrador
    if (request.nextUrl.pathname.startsWith("/admin")) {
      const isAllowedAdminRouteForTrainer =
        request.nextUrl.pathname.startsWith("/admin/ejercicios")

      if (role === "entrenador" && isAllowedAdminRouteForTrainer) {
        // Permitido para entrenadores
      } else if (role !== "administrador") {
        const url = request.nextUrl.clone()
        url.pathname = "/unauthorized"
        return NextResponse.redirect(url)
      }
    }

    // Verificar acceso a rutas de entrenador
    if (request.nextUrl.pathname.startsWith("/entrenador") && role !== "entrenador" && role !== "administrador") {
      const url = request.nextUrl.clone()
      url.pathname = "/unauthorized"
      return NextResponse.redirect(url)
    }

    // Verificar acceso a rutas de deportista
    if (request.nextUrl.pathname.startsWith("/deportista") && role !== "deportista" && role !== "administrador") {
      const url = request.nextUrl.clone()
      url.pathname = "/unauthorized"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
