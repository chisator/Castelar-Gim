"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createWorkoutLog, updateWorkoutLog } from "@/app/actions/workout-actions"
import { Plus, Trash2, Save, ChevronDown, ChevronUp } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { toast } from "sonner"

interface SetData {
    weight: string
    reps: string
}

interface LogEntry {
    id?: string
    exercise_name: string
    sets_data: SetData[]
    notes: string
    order: number
}

interface WorkoutLogFormProps {
    routineId: string
    routineTitle: string
    initialExercises: any[] // From routine definition
    existingLog?: any // If editing
}

export function WorkoutLogForm({ routineId, routineTitle, initialExercises, existingLog }: WorkoutLogFormProps) {
    const router = useRouter()
    const [date, setDate] = useState(existingLog ? new Date(existingLog.date).toISOString().split('T')[0] : new Date().toLocaleDateString('en-CA'))
    const [notes, setNotes] = useState(existingLog?.notes || "")
    const [isLoading, setIsLoading] = useState(false)

    // Initialize entries
    const [entries, setEntries] = useState<LogEntry[]>(() => {
        if (existingLog && existingLog.entries) {
            return existingLog.entries.map((entry: any) => ({
                id: entry.id,
                exercise_name: entry.exercise_name,
                sets_data: Array.isArray(entry.sets_data) ? entry.sets_data : [],
                notes: entry.notes || "",
                order: entry.order
            }))
        } else {
            // New log: map from routine exercises
            return initialExercises.map((ex, index) => ({
                exercise_name: ex.name,
                sets_data: [{ weight: "", reps: "" }], // Start with 1 empty set
                notes: "",
                order: index
            }))
        }
    })

    // State to manage open/closed exercises in UI
    const [openExercises, setOpenExercises] = useState<Record<number, boolean>>({})

    const toggleExercise = (index: number) => {
        setOpenExercises(prev => ({ ...prev, [index]: !prev[index] }))
    }

    const updateEntry = (index: number, field: keyof LogEntry, value: any) => {
        const newEntries = [...entries]
        newEntries[index] = { ...newEntries[index], [field]: value }
        setEntries(newEntries)
    }

    const addSet = (entryIndex: number) => {
        const newEntries = [...entries]
        const previousSet = newEntries[entryIndex].sets_data[newEntries[entryIndex].sets_data.length - 1]
        // Copy values from previous set for convenience
        newEntries[entryIndex].sets_data.push({
            weight: previousSet?.weight || "",
            reps: previousSet?.reps || ""
        })
        setEntries(newEntries)
    }

    const removeSet = (entryIndex: number, setIndex: number) => {
        const newEntries = [...entries]
        newEntries[entryIndex].sets_data = newEntries[entryIndex].sets_data.filter((_, i) => i !== setIndex)
        setEntries(newEntries)
    }

    const updateSet = (entryIndex: number, setIndex: number, field: keyof SetData, value: string) => {
        const newEntries = [...entries]
        newEntries[entryIndex].sets_data[setIndex] = {
            ...newEntries[entryIndex].sets_data[setIndex],
            [field]: value
        }
        setEntries(newEntries)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // Prepare data
            // Filter out empty sets or process them if needed. currently sending as is but maybe validtion needed.

            if (existingLog) {
                const result = await updateWorkoutLog(existingLog.id, {
                    date,
                    notes,
                    entries
                })
                if (result.error) throw new Error(result.error)
                toast.success("Registro actualizado")
            } else {
                const result = await createWorkoutLog({
                    routineId,
                    date,
                    notes,
                    entries
                })
                if (result.error) throw new Error(result.error)
                toast.success("Registro creado")
            }

            router.push(`/deportista/registros/${routineId}`)
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Error al guardar")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto pb-20">
            <div className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="date">Fecha</Label>
                    <Input
                        id="date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="notes">Notas generales</Label>
                    <Textarea
                        id="notes"
                        placeholder="¿Cómo te sentiste hoy?"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Ejercicios</h3>
                {entries.map((entry, index) => (
                    <Card key={index} className="overflow-hidden">
                        <CardHeader className="p-4 bg-muted/30">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">{entry.exercise_name}</CardTitle>
                                {/* Future: Add toggle functionality if list is long */}
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="space-y-2">
                                <div className="grid grid-cols-10 gap-2 mb-2 text-xs font-medium text-muted-foreground text-center">
                                    <div className="col-span-1">#</div>
                                    <div className="col-span-4">Peso (kg)</div>
                                    <div className="col-span-4">Reps</div>
                                    <div className="col-span-1"></div>
                                </div>
                                {entry.sets_data.map((set, setIndex) => (
                                    <div key={setIndex} className="grid grid-cols-10 gap-2 items-center">
                                        <div className="col-span-1 text-center font-medium text-sm text-muted-foreground">
                                            {setIndex + 1}
                                        </div>
                                        <div className="col-span-4">
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                value={set.weight}
                                                onChange={(e) => updateSet(index, setIndex, "weight", e.target.value)}
                                                className="text-center h-9"
                                            />
                                        </div>
                                        <div className="col-span-4">
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                value={set.reps}
                                                onChange={(e) => updateSet(index, setIndex, "reps", e.target.value)}
                                                className="text-center h-9"
                                            />
                                        </div>
                                        <div className="col-span-1 flex justify-center">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive/50 hover:text-destructive"
                                                onClick={() => removeSet(index, setIndex)}
                                                tabIndex={-1}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addSet(index)}
                                className="w-full border-dashed"
                            >
                                <Plus className="h-4 w-4 mr-2" /> Agregar Serie
                            </Button>

                            <div className="pt-2">
                                <Label htmlFor={`notes-${index}`} className="text-xs text-muted-foreground ml-1">Notas del ejercicio</Label>
                                <Input
                                    id={`notes-${index}`}
                                    placeholder="Notas opcionales..."
                                    value={entry.notes}
                                    onChange={(e) => updateEntry(index, "notes", e.target.value)}
                                    className="bg-transparent border-t-0 border-x-0 border-b rounded-none focus-visible:ring-0 px-1"
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()} disabled={isLoading}>
                    Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                    <Save className="mr-2 h-4 w-4" />
                    {isLoading ? "Guardando..." : "Guardar Registro"}
                </Button>
            </div>
        </form>
    )
}
