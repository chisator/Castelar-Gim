"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { LogoutButton } from "@/components/logout-button"
import { Logo } from "@/components/logo"
import { Separator } from "@/components/ui/separator"

interface MobileMenuProps {
    role?: string
}

export function MobileMenu({ role }: MobileMenuProps) {
    const [open, setOpen] = useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <div className="flex flex-col items-center justify-center w-full h-full space-y-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                    <Menu className="h-5 w-5" />
                    <span className="font-medium">Más</span>
                </div>
            </SheetTrigger>
            <SheetContent side="bottom" className="w-full rounded-t-xl px-4 pb-6 pt-2">
                <div className="mx-auto mt-2 mb-6 h-1.5 w-12 rounded-full bg-muted" />
                <SheetHeader className="flex flex-col items-center mb-6">
                    <Logo size={100} />
                    <SheetTitle className="mt-2 sr-only">Menú</SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-4">
                    <Separator />
                    
                    <div className="mt-auto pt-4 p-2">
                        <LogoutButton className="w-full justify-center" />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
