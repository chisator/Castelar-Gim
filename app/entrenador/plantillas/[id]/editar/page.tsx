import { redirect } from "next/navigation"
import { createClient } from "@/lib/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"
import { TemplateForm } from "@/components/template-form"
import Link from "next/link"
import { getExerciseCatalog } from "@/app/actions/admin-actions"
import { Logo } from "@/components/logo"

type PageProps = {
  params: { id: string }
}

export default async function EditarPlantillaPage({ params }: PageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (profile?.role !== "entrenador") {
    redirect("/unauthorized")
  }

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: template, error } = await supabaseAdmin
    .from("routine_templates")
    .select("*")
    .eq("id", params.id)
    .eq("trainer_id", user.id)
    .single()

  if (error || !template) {
    redirect("/entrenador/plantillas")
  }

  const { exercises: exerciseCatalog } = await getExerciseCatalog()

  return (
    <div className="w-full">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex min-h-[5rem] items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            <Logo size={80} />
            <div className="hidden sm:block border-l pl-4 border-border/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Panel de<br />Entrenador</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild className="md:hidden">
              <Link href="/entrenador/plantillas" className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver
              </Link>
            </Button>
            <div className="hidden md:flex items-center gap-4">
              <Button variant="outline" asChild>
                <Link href="/entrenador/plantillas">Volver</Link>
              </Button>
              <div className="text-right">
                <p className="text-sm font-medium">{profile?.full_name}</p>
                <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900">
                  Entrenador
                </Badge>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-balance">Editar Plantilla</h2>
          <p className="text-muted-foreground mt-1">Actualizá los ejercicios de la plantilla</p>
        </div>

        <TemplateForm
          mode="edit"
          initialTemplate={template}
          exerciseCatalog={exerciseCatalog || []}
        />
      </main>
    </div>
  )
}
