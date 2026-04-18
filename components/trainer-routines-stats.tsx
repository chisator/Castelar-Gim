"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface TrainerRoutinesStatsProps {
    routines: any[]
    trainers: any[]
    users?: any[]
}

export function TrainerRoutinesStats({ routines, trainers, users = [] }: TrainerRoutinesStatsProps) {
    const [startDate, setStartDate] = useState<string>("")
    const [endDate, setEndDate] = useState<string>("")
    const [groupingDays, setGroupingDays] = useState<number | "">(21)

    // Filtrar rutinas por rango de fechas
    const filteredRoutines = routines.filter(routine => {
        // Usamos created_at, o si no existe, la fecha de inicio de la rutina para propósitos estadísticos
        const routineDateValue = routine.created_at || routine.start_date
        if (!routineDateValue) return false

        const routineDate = new Date(routineDateValue)

        // Si startDate está definido, comparar
        if (startDate) {
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)
            if (routineDate < start) return false
        }

        // Si endDate está definido, comparar
        if (endDate) {
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            if (routineDate > end) return false
        }

        return true
    })

    // Agrupar por entrenador y calcular programas
    let totalProgramsInRange = 0

    const programsPerTrainer = trainers.map(trainer => {
        // 1. Filtrar rutinas de este entrenador
        const trainerRoutines = filteredRoutines.filter(r => r.trainer_id === trainer.id)

        // 2. Extraer "asignaciones" individuales (rutina -> usuario)
        const assignments: { userId: string, date: Date, routineId: string }[] = []

        trainerRoutines.forEach(routine => {
            const routineDateValue = routine.created_at || routine.start_date
            if (!routineDateValue) return

            const rDate = new Date(routineDateValue)

            if (routine.routine_user_assignments && routine.routine_user_assignments.length > 0) {
                routine.routine_user_assignments.forEach((assign: any) => {
                    assignments.push({
                        userId: assign.user_id,
                        date: rDate,
                        routineId: routine.id
                    })
                })
            } else {
                // En caso de que haya una rutina vieja sin asignación, quizás contarla como 1
                assignments.push({
                    userId: "unknown",
                    date: rDate,
                    routineId: routine.id
                })
            }
        })

        // 3. Ordenar asignaciones por fecha ascendente
        assignments.sort((a, b) => a.date.getTime() - b.date.getTime())

        // 4. Contar "Programas" (agrupando por usuario en ventana de N días)
        let programCount = 0
        const lastProgramDateByUser: Record<string, Date> = {}
        const recordedNames = new Set<string>()

        assignments.forEach(assign => {
            const lastDate = lastProgramDateByUser[assign.userId]
            let isNewProgram = true

            if (lastDate) {
                const diffTime = Math.abs(assign.date.getTime() - lastDate.getTime())
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                const currentGrouping = Number(groupingDays) || 0
                if (diffDays <= currentGrouping) {
                    isNewProgram = false
                }
            }

            if (isNewProgram) {
                programCount++
                lastProgramDateByUser[assign.userId] = assign.date

                const userRecord = users.find(u => u.id === assign.userId)
                if (userRecord) {
                    recordedNames.add(userRecord.full_name || "Sin nombre")
                }
            }
        })

        totalProgramsInRange += programCount

        return {
            id: trainer.id,
            name: trainer.full_name || "Sin nombre",
            count: programCount,
            assignedNames: Array.from(recordedNames)
        }
    }).sort((a, b) => b.count - a.count)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Estadísticas: Entrenador X Programa</CardTitle>
                <CardDescription>
                    Calcula la cantidad de programas de entrenamiento vendidos. Las rutinas creadas para un mismo usuario dentro de un margen de días se agrupan y cuentan como 1 solo programa.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="grid w-full max-w-[150px] items-center gap-1.5">
                        <Label htmlFor="groupingDays" className="text-xs text-muted-foreground">Margen (días)</Label>
                        <Input
                            type="number"
                            id="groupingDays"
                            min={0}
                            value={groupingDays}
                            onChange={(e) => setGroupingDays(e.target.value === "" ? "" : Number(e.target.value))}
                        />
                    </div>
                    <div className="grid w-full max-w-[150px] items-center gap-1.5 ml-0 sm:ml-4">
                        <Label htmlFor="startDate" className="text-xs text-muted-foreground">Fecha Desde</Label>
                        <Input
                            type="date"
                            id="startDate"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="grid w-full max-w-[150px] items-center gap-1.5">
                        <Label htmlFor="endDate" className="text-xs text-muted-foreground">Fecha Hasta</Label>
                        <Input
                            type="date"
                            id="endDate"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Entrenador</TableHead>
                                <TableHead className="text-right">Programas Creados</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {programsPerTrainer.map((stat) => (
                                <TableRow key={stat.id}>
                                    <TableCell className="font-medium">{stat.name}</TableCell>
                                    <TableCell className="text-right">
                                        {stat.count > 0 ? (
                                            <Popover>
                                                <PopoverTrigger className="font-bold underline decoration-dashed cursor-help">
                                                    {stat.count}
                                                </PopoverTrigger>
                                                <PopoverContent className="w-64 p-3 text-sm" side="top">
                                                    <p className="font-semibold mb-2 text-primary">Asignados a:</p>
                                                    <ul className="list-disc pl-4 space-y-1 text-muted-foreground max-h-48 overflow-y-auto">
                                                        {stat.assignedNames.map(name => (
                                                            <li key={name}>{name}</li>
                                                        ))}
                                                    </ul>
                                                </PopoverContent>
                                            </Popover>
                                        ) : (
                                            <span className="font-bold text-muted-foreground">{stat.count}</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {programsPerTrainer.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                                        No hay entrenadores para mostrar.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="mt-4 text-sm text-muted-foreground text-right border-t pt-2">
                    Total de programas en este período: <span className="font-bold text-foreground">{totalProgramsInRange}</span>
                </div>
            </CardContent>
        </Card>
    )
}
