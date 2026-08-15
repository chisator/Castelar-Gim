"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, Eye } from "lucide-react"
import { updateAssignedUser } from "@/app/actions/trainer-actions"
import { toast } from "sonner"

interface User {
  id: string
  full_name: string
  email: string
  telefono?: string | null
}

interface TrainerUsersTableProps {
  users: User[]
}

export function TrainerUsersTable({ users }: TrainerUsersTableProps) {
  const [search, setSearch] = useState("")
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    telefono: "",
    password: "",
  })

  const filtered = users.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const openEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      fullName: user.full_name,
      email: user.email,
      telefono: user.telefono || "",
      password: "",
    })
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setIsLoading(true)
    const result = await updateAssignedUser({
      userId: editingUser.id,
      email: formData.email,
      fullName: formData.fullName,
      telefono: formData.telefono,
      password: formData.password || undefined,
    })
    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Deportista actualizado correctamente")
      setIsOpen(false)
      setEditingUser(null)
      setFormData({ fullName: "", email: "", telefono: "", password: "" })
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar deportista..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          {search ? "No se encontraron deportistas" : "No tienes deportistas asignados"}
        </p>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden sm:table-cell">Teléfono</TableHead>
                <TableHead className="w-[100px]">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {user.telefono || "—"}
                  </TableCell>
                  <TableCell>
                    <Dialog open={isOpen && editingUser?.id === user.id} onOpenChange={(open) => {
                      if (!open) {
                        setIsOpen(false)
                        setEditingUser(null)
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(user)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Ver/Editar</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Editar Deportista</DialogTitle>
                          <DialogDescription>
                            Actualiza los datos de {editingUser?.full_name}
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label htmlFor="fullName">Nombre completo</Label>
                            <Input
                              id="fullName"
                              value={formData.fullName}
                              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="telefono">Teléfono</Label>
                            <Input
                              id="telefono"
                              value={formData.telefono}
                              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                              placeholder="Ej: 11 5555-4444"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="role">Rol</Label>
                            <Input
                              id="role"
                              value="Deportista"
                              disabled
                              className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">El rol no puede ser modificado</p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="password">Nueva contraseña</Label>
                            <Input
                              id="password"
                              type="password"
                              value={formData.password}
                              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                              placeholder="Dejar vacío para no cambiar"
                              minLength={6}
                            />
                            <p className="text-xs text-muted-foreground">Mínimo 6 caracteres. Dejar vacío para mantener la actual.</p>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button type="submit" disabled={isLoading} className="flex-1">
                              {isLoading ? "Guardando..." : "Guardar cambios"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsOpen(false)
                                setEditingUser(null)
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
