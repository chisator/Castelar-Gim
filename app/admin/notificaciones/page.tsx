import { redirect } from "next/navigation"
import { createClient } from "@/lib/server"
import { getAllNotifications } from "@/app/actions/notification-actions"
import { NotificationsManagement } from "@/components/notifications-management"
import { LogoutButton } from "@/components/logout-button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function NotificationsPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/auth/login")
    }

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (profile?.role !== "administrador") {
        redirect("/unauthorized")
    }

    const backUrl = "/admin"

    const { notifications } = await getAllNotifications()

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild className="mr-2">
                            <Link href={backUrl}>
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-lg font-bold">Avisos Globales</h1>
                            <p className="text-xs text-muted-foreground">Administración</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block text-right">
                            <p className="text-sm font-medium">{profile?.full_name}</p>
                            <Badge variant="secondary" className="capitalize bg-purple-100 text-purple-800 dark:bg-purple-900">{profile?.role}</Badge>
                        </div>
                        <LogoutButton />
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <NotificationsManagement initialNotifications={notifications || []} />
            </main>
        </div>
    )
}
