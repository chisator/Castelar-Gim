import { redirect } from "next/navigation"
import { createClient } from "@/lib/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogoutButton } from "@/components/logout-button"
import { Logo } from "@/components/logo"
import Link from "next/link"
import { Dumbbell, FileText, Pencil, Trash2 } from "lucide-react"
import { deleteTemplate } from "@/app/actions/template-actions"

interface Template {
  id: string
  title: string
  description?: string
  exercises: { type?: "exercise" | "marker" }[]
  created_at: string
}

interface Exercise {
  type?: "exercise" | "marker"
}

export default async function PlantillasPage() {
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

  const { data: templates } = await supabaseAdmin
    .from("routine_templates")
    .select("*")
    .eq("trainer_id", user.id)
    .order("created_at", { ascending: false })

  const exerciseCount = (exercises: Exercise[]) => {
    return exercises?.filter((ex) => ex.type !== "marker").length || 0
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div className="w-full">
      <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex min-h-[5rem] items-center justify-between px-4 py-2 relative">
          <div className="flex items-center gap-4">
            <Logo size={80} />
            <div className="hidden sm:block border-l pl-4 border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Panel de<br />Entrenador</p>
            </div>
          </div>
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 gap-4">
            <Button asChild variant="ghost" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              <Link href="/entrenador">Principal</Link>
            </Button>
            <Button asChild variant="ghost" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              <Link href="/admin/ejercicios">Ejercicios</Link>
            </Button>
            <Button asChild variant="ghost" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              <Link href="/entrenador/plantillas">Plantillas</Link>
            </Button>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{profile?.full_name}</p>
              <Badge variant="secondary" className="text-xs hidden sm:inline-flex bg-emerald-100 text-emerald-800 dark:bg-emerald-900">
                Entrenador
              </Badge>
            </div>
            <div className="hidden md:block">
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-balance">Mis Plantillas</h2>
            <p className="text-muted-foreground mt-1">Plantillas de rutinas para reutilizar rápidamente</p>
          </div>
          <Button asChild size="lg">
            <Link href="/entrenador/plantillas/nueva">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Plantilla
            </Link>
          </Button>
        </div>

        {templates && templates.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(templates as Template[]).map((template) => (
              <Card key={template.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{template.title}</CardTitle>
                  {template.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                  )}
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Dumbbell className="h-3 w-3" />
                      <span>{exerciseCount(template.exercises)} ejercicios</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(template.created_at)}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/entrenador/plantillas/${template.id}/editar`}>
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Editar
                      </Link>
                    </Button>
                    <form
                      action={async () => {
                        "use server"
                        await deleteTemplate(template.id)
                      }}
                      className="flex-1"
                    >
                      <Button type="submit" variant="outline" size="sm" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Eliminar
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">No tenés plantillas guardadas.</p>
              <Button asChild>
                <Link href="/entrenador/plantillas/nueva">Crear Primera Plantilla</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
