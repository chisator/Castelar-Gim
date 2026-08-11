"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateRoutine } from "@/app/actions/trainer-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Check, ChevronsUpDown, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ExerciseAutosuggest, ExerciseCatalogItem } from "@/components/exercise-selector"
import { SmartNumberInput } from "@/components/smart-number-input"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Routine {
  id: string
  title: string
  description?: string
  start_date?: string
  end_date?: string
  scheduled_date?: string
  trainer_id: string
  user_id?: string
  exercises?: { name: string; sets?: string; reps?: string; weight?: string; duration?: string; notes?: string; video_url?: string; metric_type?: "reps" | "time"; time_unit?: "seconds" | "minutes"; type?: "exercise" | "marker"; marker_color?: string }[]
}

interface Athlete {
  id: string
  full_name: string
  email?: string
}

interface Trainer {
  id: string
  full_name?: string
  email?: string
}

interface EditRoutineFormProps {
  routine: Routine
  athletes: Athlete[]
  assignedUserIds?: string[]
  isAdmin?: boolean
  trainers?: Trainer[]
  exerciseCatalog: ExerciseCatalogItem[]
}

export function EditRoutineForm({ routine, athletes, assignedUserIds = [], isAdmin = false, trainers = [], exerciseCatalog = [] }: EditRoutineFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openComboboxIndex, setOpenComboboxIndex] = useState<number | null>(null)

  const [title, setTitle] = useState(routine.title)
  const [description, setDescription] = useState(routine.description || "")
  const initialUserIds = assignedUserIds && assignedUserIds.length > 0
    ? assignedUserIds.filter(Boolean)
    : [routine.user_id || ""]
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(initialUserIds.length > 0 ? initialUserIds : [""])
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>(routine.trainer_id)
  const [startDate, setStartDate] = useState(
    routine.start_date ? String(routine.start_date).split("T")[0] : routine.scheduled_date ? String(routine.scheduled_date).split("T")[0] : ""
  )
  const [endDate, setEndDate] = useState(routine.end_date ? String(routine.end_date).split("T")[0] : routine.scheduled_date ? String(routine.scheduled_date).split("T")[0] : "")
  const [exercises, setExercises] = useState(routine.exercises || [])

  const sortedAthletes = [...athletes].sort((a, b) => a.full_name.localeCompare(b.full_name))

  const MARKER_COLORS = [
    "#FF6B00", // Naranja
    "#3B82F6", // Azul
    "#22C55E", // Verde
    "#EF4444", // Rojo
    "#A855F7", // Morado
    "#6B7280", // Gris
    "#EAB308", // Amarillo
  ]

  const addExercise = () => {
    setExercises([...exercises, { name: "", sets: "", reps: "", weight: "", duration: "", notes: "", video_url: "", metric_type: "reps", time_unit: "seconds", type: "exercise" }])
  }

  const addMarker = () => {
    setExercises([...exercises, { name: "", type: "marker", marker_color: MARKER_COLORS[0] }])
  }

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_: unknown, i: number) => i !== index))
  }

  const updateExercise = (index: number, field: string, value: string) => {
    const newExercises = [...exercises]
    newExercises[index] = { ...newExercises[index], [field]: value }
    setExercises(newExercises)
  }

  const toggleMetricType = (index: number) => {
    const newExercises = [...exercises]
    const current = newExercises[index]
    const newType = current.metric_type === "time" ? "reps" : "time"
    newExercises[index] = { ...current, metric_type: newType }
    setExercises(newExercises)
  }

  const toggleTimeUnit = (index: number) => {
    const newExercises = [...exercises]
    const current = newExercises[index]
    const newUnit = current.time_unit === "minutes" ? "seconds" : "minutes"
    newExercises[index] = { ...current, time_unit: newUnit }
    setExercises(newExercises)
  }

  const handleExerciseNameSelect = (index: number, item: ExerciseCatalogItem) => {
    const newExercises = [...exercises]
    newExercises[index].name = item.name
    if (item.video_url && !newExercises[index].video_url) {
      newExercises[index].video_url = item.video_url
    }
    setExercises(newExercises)
  }

  const updateSelectedUserAt = (idx: number, userId: string) => {
    setSelectedUserIds((prev) => {
      const next = [...prev]
      next[idx] = userId
      return next
    })
  }

  const addUserSlot = () => {
    setOpenComboboxIndex(null)
    setSelectedUserIds((prev) => [...prev, ""])
  }

  const removeUserSlot = (idx: number) => {
    setOpenComboboxIndex(null)
    setSelectedUserIds((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((_, i) => i !== idx)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const validUserIds = [...new Set(selectedUserIds.filter(Boolean))]
    if (validUserIds.length === 0) {
      setError("Debes seleccionar al menos un usuario deportista")
      setIsLoading(false)
      return
    }

    if (!startDate || !endDate) {
      setError("Debes seleccionar fecha de inicio y fin")
      setIsLoading(false)
      return
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError("La fecha de inicio no puede ser posterior a la fecha de fin")
      setIsLoading(false)
      return
    }

    const result = await updateRoutine({
      routineId: routine.id,
      title,
      description,
      userIds: validUserIds,
      startDate,
      endDate,
      exercises: exercises.filter((ex: { name: string }) => ex.name.trim() !== ""),
      trainerId: selectedTrainerId,
    })

    if (!result) {
      setError("El servidor no devolvió respuesta")
      setIsLoading(false)
      return
    }

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    router.push(isAdmin ? "/admin" : "/entrenador")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información de la Rutina</CardTitle>
        <CardDescription>Actualiza los detalles del entrenamiento</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {isAdmin && (
            <div className="grid gap-2">
              <Label htmlFor="trainer">Entrenador Responsable</Label>
              <Select onValueChange={setSelectedTrainerId} value={selectedTrainerId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un entrenador..." />
                </SelectTrigger>
                <SelectContent>
                  {trainers.map((trainer) => (
                    <SelectItem key={trainer.id} value={trainer.id}>
                      {trainer.full_name} ({trainer.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="title">Título de la Rutina</Label>
              <Input
                id="title"
                placeholder="Ej: Entrenamiento de Fuerza"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Usuario(s) Deportista(s)</Label>
              {selectedUserIds.map((userId, idx) => (
                <div key={idx} className="flex gap-2">
                  <Popover open={openComboboxIndex === idx} onOpenChange={(open) => setOpenComboboxIndex(open ? idx : null)}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openComboboxIndex === idx}
                        className="flex-1 justify-between"
                        type="button"
                      >
                        {userId
                          ? sortedAthletes.find((athlete) => athlete.id === userId)?.full_name
                          : "Seleccionar deportista..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[min(400px,calc(100vw-2rem))] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar deportista..." />
                        <CommandList>
                          <CommandEmpty>No se encontró deportista.</CommandEmpty>
                          <CommandGroup>
                            {sortedAthletes
                              .filter((a) => !selectedUserIds.some((uid, i) => i !== idx && uid === a.id))
                              .map((athlete) => (
                                <CommandItem
                                  key={athlete.id}
                                  value={athlete.full_name.toLowerCase()}
                                  onSelect={() => {
                                    updateSelectedUserAt(idx, athlete.id === userId ? "" : athlete.id)
                                    setOpenComboboxIndex(null)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      userId === athlete.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {athlete.full_name} ({athlete.email})
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedUserIds.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeUserSlot(idx)} className="shrink-0">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addUserSlot} className="w-fit">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Deportista
              </Button>
              {athletes.length === 0 && <p className="text-sm text-muted-foreground">No tienes usuarios asignados</p>}
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="startDate">Fecha Inicio</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">Fecha Fin</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe el objetivo de esta rutina..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Ejercicios</Label>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={addExercise}>
                  Agregar Ejercicio
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={addMarker}>
                  Agregar Marca
                </Button>
              </div>
            </div>

            {exercises.map((exercise: { name: string; sets?: string; reps?: string; weight?: string; duration?: string; notes?: string; video_url?: string; metric_type?: "reps" | "time"; time_unit?: "seconds" | "minutes"; type?: "exercise" | "marker"; marker_color?: string }, index: number) => (
              <div key={index}>
                {exercise.type === "marker" ? (
                  <Card 
                    style={{ 
                      backgroundColor: exercise.marker_color || MARKER_COLORS[0],
                      borderColor: exercise.marker_color || MARKER_COLORS[0],
                      opacity: 0.9
                    }}
                  >
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-white">Marca / División</h4>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeExercise(index)} className="text-white hover:text-white hover:bg-white/20">
                          Eliminar
                        </Button>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`marker-name-${index}`} className="text-white">Nombre de la división</Label>
                        <Input
                          id={`marker-name-${index}`}
                          placeholder="Ej: Día 1 - Piernas 🔥"
                          value={exercise.name}
                          onChange={(e) => updateExercise(index, "name", e.target.value)}
                          className="bg-white/90 border-white/50"
                        />
                      </div>
                      <div className="flex gap-2">
                        {MARKER_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => updateExercise(index, "marker_color", color)}
                            className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                            style={{ 
                              backgroundColor: color,
                              borderColor: exercise.marker_color === color ? "white" : "transparent"
                            }}
                            title={color}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 grid gap-2">
                            <Label htmlFor={`exercise-name-${index}`}>Nombre del Ejercicio</Label>
                            <ExerciseAutosuggest
                              value={exercise.name}
                              onChange={(val) => updateExercise(index, "name", val)}
                              onSelectCatalogItem={(item) => handleExerciseNameSelect(index, item)}
                              catalog={exerciseCatalog}
                            />
                          </div>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeExercise(index)}>
                            Eliminar
                          </Button>
                        </div>

                        <div className="grid gap-4 grid-cols-2">
                          <div className="grid gap-2">
                            <Label htmlFor={`exercise-sets-${index}`}>Series</Label>
                            <SmartNumberInput
                              value={exercise.sets || ""}
                              onChange={(val) => updateExercise(index, "sets", val)}
                              placeholder="Ej: 3"
                              suggestions={[3, 4, 5]}
                            />
                          </div>

                          <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor={`exercise-reps-${index}`}>
                                {exercise.metric_type === "time" ? "Tiempo" : "Repeticiones"}
                              </Label>
                              <div className="flex items-center gap-1 bg-muted rounded-full p-0.5">
                                <button
                                  type="button"
                                  onClick={() => toggleMetricType(index)}
                                  className={cn(
                                    "px-2 py-0.5 rounded-full text-xs font-medium transition-colors",
                                    exercise.metric_type !== "time"
                                      ? "bg-primary text-primary-foreground"
                                      : "text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  Repeticiones
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleMetricType(index)}
                                  className={cn(
                                    "px-2 py-0.5 rounded-full text-xs font-medium transition-colors",
                                    exercise.metric_type === "time"
                                      ? "bg-primary text-primary-foreground"
                                      : "text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  Tiempo
                                </button>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <SmartNumberInput
                                  value={exercise.reps || ""}
                                  onChange={(val) => updateExercise(index, "reps", val)}
                                  placeholder={exercise.metric_type === "time" ? "Ej: 40" : "Ej: 10"}
                                  suggestions={exercise.metric_type === "time" ? [30, 40, 60, 90] : [8, 10, 12, 15]}
                                />
                              </div>
                              {exercise.metric_type === "time" && (
                                <div className="flex items-center gap-1 bg-muted rounded-full p-0.5 self-start">
                                  <button
                                    type="button"
                                    onClick={() => toggleTimeUnit(index)}
                                    className={cn(
                                      "px-2 py-1 rounded-full text-xs font-medium transition-colors",
                                      exercise.time_unit !== "minutes"
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                    )}
                                  >
                                    seg (″)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => toggleTimeUnit(index)}
                                    className={cn(
                                      "px-2 py-1 rounded-full text-xs font-medium transition-colors",
                                      exercise.time_unit === "minutes"
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                    )}
                                  >
                                    min (′)
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor={`exercise-weight-${index}`}>Peso</Label>
                            <div className="relative">
                              <Input
                                id={`exercise-weight-${index}`}
                                placeholder="Ej: 20"
                                value={exercise.weight?.replace(/ ?kg$/i, "") || ""}
                                onChange={(e) => updateExercise(index, "weight", e.target.value)}
                                className="pr-8"
                                type="number"
                                step="0.5"
                              />
                              <span className="absolute right-3 top-2.5 text-sm text-muted-foreground pointer-events-none">kg</span>
                            </div>
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor={`exercise-duration-${index}`}>Descanso / Pausa</Label>
                            <Input
                              id={`exercise-duration-${index}`}
                              placeholder="Ej: 60 seg"
                              value={exercise.duration}
                              onChange={(e) => updateExercise(index, "duration", e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor={`exercise-video-${index}`}>Video URL (YouTube)</Label>
                          <Input
                            id={`exercise-video-${index}`}
                            placeholder="Ej: https://youtu.be/..."
                            value={exercise.video_url || ""}
                            onChange={(e) => updateExercise(index, "video_url", e.target.value)}
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor={`exercise-notes-${index}`}>Notas</Label>
                          <Textarea
                            id={`exercise-notes-${index}`}
                            placeholder="Instrucciones adicionales..."
                            value={exercise.notes}
                            onChange={(e) => updateExercise(index, "notes", e.target.value)}
                            rows={2}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
          </div>

          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Actualizando..." : "Actualizar Rutina"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push(isAdmin ? "/admin" : "/entrenador")}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
