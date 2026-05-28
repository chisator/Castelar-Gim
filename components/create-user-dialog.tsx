"use client"

import { useState } from "react"
import { createUser } from "@/app/actions/admin-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Eye, EyeOff } from "lucide-react"

interface CreateUserDialogProps {
  currentUserRole: "administrador" | "entrenador"
  onUserCreated?: () => void
  triggerClassName?: string
  triggerSize?: "default" | "sm" | "lg" | "icon"
}

export function CreateUserDialog({
  currentUserRole,
  onUserCreated,
  triggerClassName,
  triggerSize = "default",
}: CreateUserDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState("")
  const [telefono, setTelefono] = useState("")
  const [role, setRole] = useState<"deportista" | "entrenador" | "administrador">("deportista")

  const isAdmin = currentUserRole === "administrador"
  const effectiveRole = isAdmin ? role : "deportista"

  const resetForm = () => {
    setEmail("")
    setPassword("")
    setFullName("")
    setTelefono("")
    setRole("deportista")
    setError(null)
    setShowPassword(false)
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!fullName.trim()) {
      setError("El nombre completo es requerido")
      setIsLoading(false)
      return
    }

    if (!email.trim()) {
      setError("El email es requerido")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener mínimo 6 caracteres")
      setIsLoading(false)
      return
    }

    const result = await createUser({
      email,
      password,
      fullName,
      role: effectiveRole,
      telefono,
    })

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    setIsOpen(false)
    resetForm()
    setIsLoading(false)
    onUserCreated?.()
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) resetForm()
      }}
    >
      <DialogTrigger asChild>
        <Button size={triggerSize} className={triggerClassName}>
          Crear Usuario
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Nuevo Usuario</DialogTitle>
          <DialogDescription>Registra un nuevo usuario en el sistema</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="cu-fullName">Nombre Completo</Label>
            <Input
              id="cu-fullName"
              placeholder="Juan Pérez"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cu-email">Email</Label>
            <Input
              id="cu-email"
              type="email"
              placeholder="usuario@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cu-telefono">Teléfono</Label>
            <Input
              id="cu-telefono"
              type="tel"
              placeholder="+54 11 1234-5678"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cu-password">Contraseña</Label>
            <div className="relative">
              <Input
                id="cu-password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="sr-only">
                  {showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                </span>
              </Button>
            </div>
          </div>

          {isAdmin && (
            <div className="grid gap-2">
              <Label htmlFor="cu-role">Rol</Label>
              <Select value={role} onValueChange={(value: any) => setRole(value)}>
                <SelectTrigger id="cu-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deportista">Deportista</SelectItem>
                  <SelectItem value="entrenador">Entrenador</SelectItem>
                  <SelectItem value="administrador">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Creando..." : "Crear Usuario"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
