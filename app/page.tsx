import { redirect } from "next/navigation"
import { createClient } from "@/lib/server"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  const role = profile?.role

  if (role === "deportista") {
    redirect("/deportista")
  } else if (role === "entrenador") {
    redirect("/entrenador")
  } else if (role === "administrador") {
    redirect("/admin")
  }

  // Fallback si no hay rol o no coincide
  redirect("/auth/login")
}
