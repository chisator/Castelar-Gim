"use client"

import { useState, useEffect } from "react"
import { X, Bell } from "lucide-react"

interface Notification {
    id: string
    message: string
    color: string
}

export function GlobalNotification({ notification }: { notification: Notification | null }) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (!notification) {
            setIsVisible(false)
            return
        }

        // Revisar si ya se cerró en esta sesión
        const dismissed = sessionStorage.getItem(`notification_dismissed_${notification.id}`)
        if (!dismissed) {
            setIsVisible(true)
        }
    }, [notification])

    if (!isVisible || !notification) return null

    const handleDismiss = () => {
        setIsVisible(false)
        sessionStorage.setItem(`notification_dismissed_${notification.id}`, "true")
    }

    const colorStyles: Record<string, string> = {
        blue: "bg-blue-600 text-white",
        red: "bg-red-600 text-white",
        green: "bg-green-600 text-white",
        yellow: "bg-yellow-500 text-black",
        purple: "bg-purple-600 text-white",
    }

    const styleClass = colorStyles[notification.color] || colorStyles.blue

    return (
        <div className={`w-full py-3 px-4 relative z-50 flex items-center justify-between shadow-md ${styleClass}`}>
            <div className="flex items-center gap-3 w-full justify-center max-w-4xl mx-auto pl-8">
                <Bell className="h-5 w-5 flex-shrink-0 animate-pulse" />
                <p className="text-sm sm:text-base font-medium text-center balance-text">
                    {notification.message}
                </p>
            </div>
            <button 
                onClick={handleDismiss}
                className="p-1.5 rounded-full hover:bg-black/10 transition-colors flex-shrink-0"
                aria-label="Cerrar aviso"
            >
                <X className="h-5 w-5" />
            </button>
        </div>
    )
}
