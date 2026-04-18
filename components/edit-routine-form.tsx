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
import { Check, ChevronsUpDown } from "lucide-react"
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

interface EditRoutineFormProps {
  routine: any
  athletes: any[]
  assignedUserIds?: string[]
  isAdmin?: boolean
  trainers?: any[]
  exerciseCatalog: ExerciseCatalogItem[]
}

export function EditRoutineForm({ routine, athletes, assignedUserIds = [], isAdmin = false, trainers = [], exerciseCatalog = [] }: EditRoutineFormProps) {
  const router = useRouter()
  // ... (maintain existing state)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openCombobox, setOpenCombobox] = useState(false)

  const [title, setTitle] = useState(routine.title)
  const [description, setDescription] = useState(routine.description || "")
  const initialUserId = assignedUserIds.length > 0 ? assignedUserIds[0] : (routine.user_id || "")
  const [selectedUserId, setSelectedUserId] = useState<string>(initialUserId)
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>(routine.trainer_id)
  const [startDate, setStartDate] = useState(
    routine.start_date ? String(routine.start_date).split("T")[0] : routine.scheduled_date ? String(routine.scheduled_date).split("T")[0] : ""
  )
  const [endDate, setEndDate] = useState(routine.end_date ? String(routine.end_date).split("T")[0] : routine.scheduled_date ? String(routine.scheduled_date).split("T")[0] : "")
  const [exercises, setExercises] = useState(routine.exercises || [])

  const sortedAthletes = [...athletes].sort((a, b) => a.full_name.localeCompare(b.full_name))

  const addExercise = () => {
    setExercises([...exercises, { name: "", sets: "", reps: "", weight: "", duration: "", notes: "", video_url: "" }])
  }

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_: any, i: number) => i !== index))
  }

  const updateExercise = (index: number, field: string, value: string) => {
    const newExercises = [...exercises]
    newExercises[index][field] = value
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!selectedUserId) {
      setError("Debes seleccionar un usuario deportista")
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
      userIds: [selectedUserId],
      startDate,
      endDate,
      exercises: exercises.filter((ex: any) => ex.name.trim() !== ""),
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
              <Label>Usuario Deportista</Label>
              <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCombobox}
                    className="w-full justify-between"
                    type="button"
                  >
                    {selectedUserId
                      ? sortedAthletes.find((athlete) => athlete.id === selectedUserId)?.full_name
                      : "Seleccionar deportista..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar deportista..." />
                    <CommandList>
                      <CommandEmpty>No se encontró deportista.</CommandEmpty>
                      <CommandGroup>
                        {sortedAthletes.map((athlete) => (
                          <CommandItem
                            key={athlete.id}
                            value={athlete.full_name.toLowerCase()}
                            onSelect={() => {
                              setSelectedUserId(athlete.id === selectedUserId ? "" : athlete.id)
                              setOpenCombobox(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                "opacity-100"
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
              <Button type="button" variant="outline" size="sm" onClick={addExercise}>
                Agregar Ejercicio
              </Button>
            </div>

            {exercises.map((exercise: any, index: number) => (
              <Card key={index}>
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
                        <Label htmlFor={`exercise-reps-${index}`}>Repeticiones</Label>
                        <SmartNumberInput
                          value={exercise.reps || ""}
                          onChange={(val) => updateExercise(index, "reps", val)}
                          placeholder="Ej: 10"
                          suggestions={[8, 10, 12, 15]}
                        />
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
