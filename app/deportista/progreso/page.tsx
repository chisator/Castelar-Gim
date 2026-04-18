import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"
import { getUniqueExercises } from "@/app/actions/progress-actions"
import { ProgressPageClient } from "@/components/progress-page-client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Logo } from "@/components/logo"

import { LogoutButton } from "@/components/logout-button"

export default async function ProgressPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/auth/login")
    }

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    // Get list of exercises
    const exercises = await getUniqueExercises()

    return (
        <div className="w-full">
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container mx-auto flex min-h-[5rem] items-center justify-between px-4 py-2 relative">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild className="mr-2">
                            <Link href="/deportista">
                                <ChevronLeft className="h-5 w-5" />
                                <span className="sr-only">Volver al inicio</span>
                            </Link>
                        </Button>
                        <div className="hidden sm:block">
                            <Logo size={60} />
                        </div>
                    </div>

                    <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 gap-4">
                        <Button asChild variant="ghost">
                            <Link href="/deportista/registros">Registros</Link>
                        </Button>
                        <Button asChild variant="ghost">
                            <Link href="/deportista/progreso">Progreso</Link>
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="text-right">
                            <p className="text-sm font-medium">{profile?.full_name}</p>
                            <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                                Deportista
                            </Badge>
                        </div>

                        <div className="hidden md:block">
                            <LogoutButton />
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold">Tu Progreso</h1>
                        <p className="text-muted-foreground">Visualiza cómo has mejorado en tus ejercicios.</p>
                    </div>

                    <ProgressPageClient exercises={exercises} />
                </div>
            </main>
        </div>
    )
}
