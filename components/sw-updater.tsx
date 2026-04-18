"use client"

import { useEffect } from "react"

export function ServiceWorkerUpdater() {
    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            // Unregister all service workers to clear old/broken caches
            navigator.serviceWorker.getRegistrations().then((registrations) => {
                for (const registration of registrations) {
                    registration.unregister()
                    console.log("Service Worker unregistered")
                }
            })

            // Clear caches
            if ('caches' in window) {
                caches.keys().then((names) => {
                    names.forEach((name) => {
                        caches.delete(name);
                    });
                });
                console.log("Caches cleared");
            }
        }
    }, [])

    return null
}
