"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { deleteRoutine } from "@/app/actions/trainer-actions"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

interface RoutinesTableProps {
  routines: any[]
  trainers: any[]
  users?: any[]
  totalPages?: number
}

export function RoutinesTable({ routines, trainers, users = [], totalPages = 1 }: RoutinesTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const getTrainerName = (trainerId: string) => {
    return trainers.find(t => t.id === trainerId)?.full_name || "N/A"
  }

  const getAssignedUserNames = (routine: any) => {
    if (!routine.routine_user_assignments || routine.routine_user_assignments.length === 0) {
      return "Sin asignar";
    }
    return routine.routine_user_assignments.map((assignment: any) => {
      const user = users.find(u => u.id === assignment.user_id);
      return user ? user.full_name : "Deportista";
    }).join(", ");
  }

  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const titleFilter = searchParams.get("routinesSearch") || ""
  const trainerFilter = searchParams.get("routinesTrainer") || "all"
  const currentPage = Number(searchParams.get("routinesPage")) || 1

  const updateSearchParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    if (key !== "routinesPage") {
      params.set("routinesPage", "1")
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleDelete = async (routineId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta rutina? Esta acción no se puede deshacer.")) {
      return
    }
    setIsDeleting(routineId)
    const result = await deleteRoutine(routineId)
    if (result.error) {
      alert(result.error)
    }
    setIsDeleting(null)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gestión de Rutinas</CardTitle>
            <CardDescription>Visualiza, edita y crea nuevas rutinas para cualquier usuario.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/crear-rutina">Crear Rutina</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px] align-top pt-4">
                <div className="flex flex-col gap-2">
                  <span className="font-bold py-1">Título</span>
                  <div className="pb-2">
                    <Input
                      placeholder="Buscar título..."
                      value={titleFilter}
                      onChange={(e) => updateSearchParam("routinesSearch", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </TableHead>
              <TableHead className="align-top pt-4">
                <div className="flex flex-col gap-2 h-full justify-start">
                  <span className="font-bold py-1">Entrenador Asignado</span>
                  <div className="pb-2">
                    <Select value={trainerFilter} onValueChange={(val) => updateSearchParam("routinesTrainer", val)}>
                      <SelectTrigger className="h-8 text-xs w-[180px]">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {trainers.map((trainer) => (
                          <SelectItem key={trainer.id} value={trainer.id}>
                            {trainer.full_name || "Sin Nombre"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TableHead>
              <TableHead className="align-top pt-4">
                <div className="flex flex-col gap-2 h-full justify-start">
                  <span className="font-bold py-1">Asignada a</span>
                </div>
              </TableHead>
              <TableHead className="align-top pt-4">
                <div className="flex flex-col gap-2 h-full justify-start">
                  <span className="font-bold py-1">Fecha de Inicio</span>
                </div>
              </TableHead>
              <TableHead className="align-top pt-4">
                <div className="flex flex-col gap-2 h-full justify-start">
                  <span className="font-bold py-1">Fecha de Fin</span>
                </div>
              </TableHead>
              <TableHead className="align-top pt-4">
                <div className="flex flex-col gap-2 h-full justify-start">
                  <span className="font-bold py-1"># Ejercicios</span>
                </div>
              </TableHead>
              <TableHead className="text-right align-top pt-4">
                <span className="font-bold">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {routines.map((routine) => (
              <TableRow key={routine.id}>
                <TableCell className="font-medium">{routine.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">{getTrainerName(routine.trainer_id)}</Badge>
                </TableCell>
                <TableCell className="max-w-[150px] truncate" title={getAssignedUserNames(routine)}>
                  {getAssignedUserNames(routine)}
                </TableCell>
                <TableCell>{new Date(routine.start_date).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })}</TableCell>
                <TableCell>{new Date(routine.end_date).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })}</TableCell>
                <TableCell>{routine.exercises?.length || 0}</TableCell>
                <TableCell className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/entrenador/editar-rutina/${routine.id}`}>
                      Ver/Editar
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(routine.id)}
                    disabled={isDeleting === routine.id}
                  >
                    {isDeleting === routine.id ? "Eliminando..." : "Borrar"}
                  </Button>
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
              onClick={() => updateSearchParam("routinesPage", (currentPage - 1).toString())}
              disabled={currentPage <= 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateSearchParam("routinesPage", (currentPage + 1).toString())}
              disabled={currentPage >= totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
