"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/client"
import { importRoutine } from "@/app/actions/trainer-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImportExercisesDialog } from "@/components/import-exercises-dialog"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
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
import { ExerciseAutosuggest, ExerciseCatalogItem } from "@/components/exercise-selector"
import { SmartNumberInput } from "@/components/smart-number-input"

interface Exercise {
  name: string
  sets?: string
  reps?: string
  weight?: string
  duration?: string
  notes?: string
  video_url?: string
}

interface CreateRoutineFormProps {
  athletes: any[]
  creatorId: string
  trainers?: any[]
  isAdmin?: boolean
  exerciseCatalog: ExerciseCatalogItem[]
}

export function CreateRoutineForm({ athletes, creatorId, trainers = [], isAdmin = false, exerciseCatalog = [] }: CreateRoutineFormProps) {
  const router = useRouter()
  // ... (maintain existing state)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [openCombobox, setOpenCombobox] = useState(false)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>(isAdmin ? "" : creatorId)
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [exercises, setExercises] = useState<Exercise[]>([{ name: "", sets: "", reps: "", weight: "", duration: "", notes: "", video_url: "" }])

  const sortedAthletes = [...athletes].sort((a, b) => a.full_name.localeCompare(b.full_name))

  const addExercise = () => {
    setExercises([...exercises, { name: "", sets: "", reps: "", weight: "", duration: "", notes: "", video_url: "" }])
  }

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  const updateExercise = (index: number, field: keyof Exercise, value: string) => {
    const newExercises = [...exercises]
    newExercises[index] = { ...newExercises[index], [field]: value }
    setExercises(newExercises)
  }

  const handleExerciseNameSelect = (index: number, item: ExerciseCatalogItem) => {
    const newExercises = [...exercises]
    // Update name
    newExercises[index] = { ...newExercises[index], name: item.name }

    // Auto-fill video if available and current is empty
    if (item.video_url && !newExercises[index].video_url) {
      newExercises[index].video_url = item.video_url
    }
    setExercises(newExercises)
  }

  // ... (maintain handleImportExercises and handleSubmit)
  const handleImportExercises = (importedExercises: Exercise[]) => {
    const currentEmpty = exercises.filter((ex) => ex.name.trim() === "")
    if (currentEmpty.length === exercises.length) {
      setExercises(importedExercises)
    } else {
      setExercises([...exercises, ...importedExercises])
    }
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

    try {
      const validExercises = exercises.filter((ex) => ex.name.trim() !== "")

      console.log("Calling importRoutine with:", {
        title,
        description,
        start_date: startDate ? new Date(startDate).toISOString() : "",
        end_date: endDate ? new Date(endDate).toISOString() : "",
        exercises: validExercises,
        userIds: [selectedUserId],
        trainerId: selectedTrainerId,
      })

      const result = await importRoutine({
        title,
        description,
        start_date: startDate ? new Date(startDate).toISOString() : "",
        end_date: endDate ? new Date(endDate).toISOString() : "",
        exercises: validExercises,
        userIds: [selectedUserId],
        trainerId: selectedTrainerId,
      })

      console.log("importRoutine result:", result)

      if (!result) {
        throw new Error("El servidor no devolvió respuesta (result is undefined)")
      }

      if (result.error) throw new Error(result.error)

      router.push(isAdmin ? "/admin" : "/entrenador")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Error al crear la rutina")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Información de la Rutina</CardTitle>
          <CardDescription>Completa los datos básicos de la rutina</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ... (Existing fields for trainer, title, description, user, dates) */}
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

          <div className="grid gap-2">
            <Label htmlFor="title">Título de la Rutina</Label>
            <Input
              id="title"
              placeholder="Ej: Entrenamiento de Resistencia"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
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
                              selectedUserId === athlete.id ? "opacity-100" : "opacity-0"
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
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex-1 min-w-fit">
              <CardTitle>Ejercicios</CardTitle>
              <CardDescription>Agrega los ejercicios de la rutina</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setShowImportDialog(true)}>
                Importar Ejercicios
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {exercises.map((exercise, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Ejercicio {index + 1}</h4>
                {exercises.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeExercise(index)}>
                    Eliminar
                  </Button>
                )}
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor={`exercise-name-${index}`}>Nombre del Ejercicio</Label>
                  <ExerciseAutosuggest
                    value={exercise.name}
                    onChange={(val) => updateExercise(index, "name", val)}
                    onSelectCatalogItem={(item) => handleExerciseNameSelect(index, item)}
                    catalog={exerciseCatalog}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addExercise} className="w-full border-dashed">
            <Plus className="mr-2 h-4 w-4" />
            Agregar Ejercicio
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="mt-6 rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          <p>{error}</p>
        </div>
      )}

      <div className="mt-6 flex gap-4">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? "Creando rutina..." : "Crear Rutina"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(isAdmin ? "/admin" : "/entrenador")} disabled={isLoading}>
          Cancelar
        </Button>
      </div>

      <ImportExercisesDialog
        isOpen={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={handleImportExercises}
      />
    </form>
  )
}
