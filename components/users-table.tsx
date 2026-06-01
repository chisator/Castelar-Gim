"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { updateUser, deleteUser } from "@/app/actions/admin-actions"
import { CreateUserDialog } from "@/components/create-user-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

interface UsersTableProps {
  users: any[]
  totalPages?: number
}

export function UsersTable({ users, totalPages = 1 }: UsersTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [fullName, setFullName] = useState("")
  const [telefono, setTelefono] = useState("")
  const [role, setRole] = useState<"deportista" | "entrenador" | "administrador">("deportista")
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)

  const nameFilter = searchParams.get("usersSearch") || ""
  const roleFilter = searchParams.get("usersRole") || "all"
  const currentPage = Number(searchParams.get("usersPage")) || 1

  const [localNameFilter, setLocalNameFilter] = useState(nameFilter)
  const nameDidMountRef = useRef(false)

  useEffect(() => {
    if (!nameDidMountRef.current) {
      nameDidMountRef.current = true
      return
    }
    const timer = setTimeout(() => {
      updateSearchParam("usersSearch", localNameFilter)
    }, 300)
    return () => clearTimeout(timer)
  }, [localNameFilter])

  const updateSearchParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    if (key !== "usersPage") {
      params.set("usersPage", "1")
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const sortedUsers = [...users].sort((a, b) => {
    if (!sortConfig) return 0

    const { key, direction } = sortConfig

    let aValue = a[key]
    let bValue = b[key]

    if (key === "full_name") {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }

    if (aValue < bValue) {
      return direction === "asc" ? -1 : 1
    }
    if (aValue > bValue) {
      return direction === "asc" ? 1 : -1
    }
    return 0
  })

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  }

  const handleEditClick = (user: any) => {
    setEditingUser(user)
    setEmail(user.email)
    setFullName(user.full_name)
    setTelefono(user.telefono || "")
    setRole(user.role)
    setEditPassword("")
    setShowEditPassword(false)
    setIsEditOpen(true)
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const payload: any = {
      userId: editingUser.id,
      email,
      fullName,
      role,
      telefono
    }

    if (editPassword) {
      if (editPassword.length < 6) {
        setError("La contraseña debe tener mínimo 6 caracteres")
        setIsLoading(false)
        return
      }
      payload.password = editPassword
    }

    const result = await updateUser(payload)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    setIsEditOpen(false)
    setEditingUser(null)
    setEmail("")
    setFullName("")
    setTelefono("")
    setRole("deportista")
    setEditPassword("")
    setIsLoading(false)
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.")) {
      return
    }

    setIsLoading(true)
    const result = await deleteUser(userId)

    if (result.error) {
      alert(result.error)
    }

    setIsLoading(false)
  }

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline"; className: string }> = {
      deportista: { variant: "outline", className: "bg-blue-100 text-blue-800 dark:bg-blue-900" },
      entrenador: { variant: "outline", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900" },
      administrador: { variant: "outline", className: "bg-purple-100 text-purple-800 dark:bg-purple-900" },
    }

    const config = variants[role] || variants.deportista

    return (
      <Badge variant={config.variant} className={config.className}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }



  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gestión de Usuarios</CardTitle>
            <CardDescription>Administra los usuarios del club deportivo</CardDescription>
          </div>
          <CreateUserDialog
            currentUserRole="administrador"
            onUserCreated={() => router.refresh()}
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px] align-top pt-4">
                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => requestSort("full_name")}
                    className="hover:bg-transparent px-0 font-bold justify-start h-auto p-0"
                  >
                    Nombre
                    {getSortIcon("full_name")}
                  </Button>
                  <Input
                    placeholder="Buscar nombre..."
                    value={localNameFilter}
                    onChange={(e) => setLocalNameFilter(e.target.value)}
                    className="h-8 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </TableHead>
              <TableHead className="align-top pt-4">
                <div className="flex flex-col gap-2 h-full justify-start">
                  <span className="font-bold py-1">Email</span>
                </div>
              </TableHead>
              <TableHead className="align-top pt-4">
                <div className="flex flex-col gap-2">
                  <span className="font-bold py-0.5">Rol</span>
                  <Select value={roleFilter} onValueChange={(val) => updateSearchParam("usersRole", val)}>
                    <SelectTrigger className="h-8 text-xs w-[130px]">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="deportista">Deportista</SelectItem>
                      <SelectItem value="entrenador">Entrenador</SelectItem>
                      <SelectItem value="administrador">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TableHead>

              <TableHead className="align-top pt-4">
                <div className="flex flex-col gap-2">
                  <Button variant="ghost" onClick={() => requestSort("created_at")} className="hover:bg-transparent px-0 font-bold justify-start h-auto p-0">
                    Fecha de Registro
                    {getSortIcon("created_at")}
                  </Button>
                </div>
              </TableHead>
              <TableHead className="text-right align-top pt-4">
                <span className="font-bold">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.full_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell>{new Date(user.created_at).toLocaleDateString("es-ES")}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(user)}>
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      Eliminar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateSearchParam("usersPage", (currentPage - 1).toString())}
              disabled={currentPage <= 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateSearchParam("usersPage", (currentPage + 1).toString())}
              disabled={currentPage >= totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
              <DialogDescription>Actualiza la información del usuario</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-fullName">Nombre Completo</Label>
                <Input
                  id="edit-fullName"
                  placeholder="Juan Pérez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="usuario@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-telefono">Teléfono</Label>
                <Input
                  id="edit-telefono"
                  type="tel"
                  placeholder="+54 11 1234-5678"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>

              {editingUser?.role !== "administrador" && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-password">Nueva Contraseña (Opcional)</Label>
                  <div className="relative">
                    <Input
                      id="edit-password"
                      type={showEditPassword ? "text" : "password"}
                      placeholder="Dejar en blanco para mantener la actual"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      minLength={6}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      tabIndex={-1}
                    >
                      {showEditPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="sr-only">
                        {showEditPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      </span>
                    </Button>
                  </div>
                </div>
              )}



              <div className="grid gap-2">
                <Label htmlFor="edit-role">Rol</Label>
                <Select value={role} onValueChange={(value: any) => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deportista">Deportista</SelectItem>
                    <SelectItem value="entrenador">Entrenador</SelectItem>
                    <SelectItem value="administrador">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Actualizando..." : "Actualizar Usuario"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card >
  )
}



