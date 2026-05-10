"use client"

import { useState } from "react"
import { createNotification, deactivateNotification, deleteNotification } from "@/app/actions/notification-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Trash2, Plus, PowerOff } from "lucide-react"
import { toast } from "sonner"

const COLORS = [
    { id: "blue", name: "Azul", class: "bg-blue-500", textClass: "text-blue-500" },
    { id: "red", name: "Rojo (Urgente)", class: "bg-red-500", textClass: "text-red-500" },
    { id: "green", name: "Verde (Éxito)", class: "bg-green-500", textClass: "text-green-500" },
    { id: "yellow", name: "Amarillo (Advertencia)", class: "bg-yellow-500", textClass: "text-yellow-500" },
    { id: "purple", name: "Púrpura", class: "bg-purple-500", textClass: "text-purple-500" },
]

export function NotificationsManagement({ initialNotifications }: { initialNotifications: any[] }) {
    const [notifications, setNotifications] = useState(initialNotifications)
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    
    // Form state
    const [message, setMessage] = useState("")
    const [color, setColor] = useState("blue")
    const [days, setDays] = useState("7")

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!message.trim()) {
            toast.error("El mensaje no puede estar vacío")
            return
        }

        setIsLoading(true)
        const result = await createNotification(message, color, parseInt(days))

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Aviso creado correctamente")
            setIsOpen(false)
            setMessage("")
            window.location.reload()
        }
        setIsLoading(false)
    }

    const handleDeactivate = async (id: string) => {
        setIsLoading(true)
        const result = await deactivateNotification(id)
        
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Aviso desactivado")
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_active: false } : n))
        }
        setIsLoading(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de que deseas eliminar este registro?")) return
        
        setIsLoading(true)
        const result = await deleteNotification(id)
        
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Registro eliminado")
            setNotifications(notifications.filter(n => n.id !== id))
        }
        setIsLoading(false)
    }

    const isCurrentlyActive = (notif: any) => {
        return notif.is_active && new Date(notif.active_until) >= new Date()
    }

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Gestión de Avisos Globales</CardTitle>
                    <CardDescription>
                        Crea notificaciones que aparecerán a todos los usuarios cuando abran la aplicación.
                    </CardDescription>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" /> Nuevo Aviso
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Crear Nuevo Aviso</DialogTitle>
                            <DialogDescription>
                                Solo puede haber un aviso activo a la vez. Al crear uno nuevo, los anteriores se desactivarán automáticamente.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="message">Mensaje</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Ej: El gimnasio permanecerá cerrado el día de mañana por feriado."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                    rows={3}
                                />
                            </div>
                            
                            <div className="grid gap-2">
                                <Label>Color del Banner</Label>
                                <RadioGroup value={color} onValueChange={setColor} className="flex flex-wrap gap-4 mt-2">
                                    {COLORS.map((c) => (
                                        <div key={c.id} className="flex items-center space-x-2">
                                            <RadioGroupItem value={c.id} id={`color-${c.id}`} />
                                            <Label htmlFor={`color-${c.id}`} className={`flex items-center gap-2 cursor-pointer ${c.textClass} font-medium`}>
                                                <span className={`w-3 h-3 rounded-full ${c.class}`}></span>
                                                {c.name}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="days">Duración</Label>
                                <div className="flex gap-4 items-center">
                                    <Input
                                        id="days"
                                        type="number"
                                        min="1"
                                        max="365"
                                        value={days}
                                        onChange={(e) => setDays(e.target.value)}
                                        required
                                        className="w-24"
                                    />
                                    <span className="text-sm text-muted-foreground">días</span>
                                </div>
                            </div>
                            
                            <Button type="submit" disabled={isLoading} className="w-full">
                                {isLoading ? "Guardando..." : "Publicar Aviso"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {notifications.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        No hay avisos registrados en el historial.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((notif) => {
                            const active = isCurrentlyActive(notif)
                            const colorObj = COLORS.find(c => c.id === notif.color) || COLORS[0]

                            return (
                                <div key={notif.id} className={`flex flex-col sm:flex-row gap-4 p-4 border rounded-lg ${active ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'}`}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            {active ? (
                                                <Badge variant="default" className="bg-green-500 hover:bg-green-600">Activo Ahora</Badge>
                                            ) : (
                                                <Badge variant="secondary">Inactivo</Badge>
                                            )}
                                            <span className="text-xs text-muted-foreground">
                                                Hasta: {new Date(notif.active_until).toLocaleDateString()}
                                            </span>
                                            <span className={`w-3 h-3 rounded-full ${colorObj.class}`} title={`Color: ${colorObj.name}`}></span>
                                        </div>
                                        <p className="text-sm font-medium">{notif.message}</p>
                                    </div>

                                    <div className="flex sm:flex-col gap-2 justify-center">
                                        {active && (
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleDeactivate(notif.id)}
                                                disabled={isLoading}
                                            >
                                                <PowerOff className="h-4 w-4 mr-2" />
                                                Apagar
                                            </Button>
                                        )}
                                        <Button 
                                            variant="ghost" 
                                            size="sm"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleDelete(notif.id)}
                                            disabled={isLoading}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Eliminar
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
