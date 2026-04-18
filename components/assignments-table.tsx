"use client"

import type React from "react"

import { useState } from "react"
import { assignUserToTrainer, removeUserFromTrainer } from "@/app/actions/admin-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface AssignmentsTableProps {
  assignments: any[]
  users: any[]
}

export function AssignmentsTable({ assignments, users }: AssignmentsTableProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [userId, setUserId] = useState("")
  const [trainerId, setTrainerId] = useState("")

  const athletes = users.filter((u) => u.role === "deportista")
  const trainers = users.filter((u) => u.role === "entrenador")

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const result = await assignUserToTrainer({
      userId,
      trainerId,
    })

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    setIsOpen(false)
    setUserId("")
    setTrainerId("")
    setIsLoading(false)
  }

  const handleRemoveAssignment = async (userId: string, trainerId: string) => {
    setIsLoading(true)
    setError(null)

    const result = await removeUserFromTrainer({
      userId,
      trainerId,
    })

    if (result.error) {
      setError(result.error)
    }
    setIsLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Asignaciones Entrenador-Usuario</CardTitle>
            <CardDescription>Asigna usuarios a entrenadores específicos</CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>Nueva Asignación</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nueva Asignación</DialogTitle>
                <DialogDescription>Asigna un usuario a un entrenador</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="user">Usuario Deportista</Label>
                  <Select value={userId} onValueChange={setUserId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un usuario" />
                    </SelectTrigger>
                    <SelectContent>
                      {athletes.map((athlete) => (
                        <SelectItem key={athlete.id} value={athlete.id}>
                          {athlete.full_name} ({athlete.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="trainer">Entrenador</Label>
                  <Select value={trainerId} onValueChange={setTrainerId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un entrenador" />
                    </SelectTrigger>
                    <SelectContent>
                      {trainers.map((trainer) => (
                        <SelectItem key={trainer.id} value={trainer.id}>
                          {trainer.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? "Creando..." : "Crear Asignación"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Entrenador</TableHead>
              <TableHead>Fecha de Asignación</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell className="font-medium">{assignment.profiles?.full_name}</TableCell>
                <TableCell>{assignment.profiles?.email}</TableCell>
                <TableCell>{assignment.trainer?.full_name}</TableCell>
                <TableCell>{new Date(assignment.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAssignment(assignment.user_id, assignment.trainer_id)}
                    disabled={isLoading}
                  >
                    Remover
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
