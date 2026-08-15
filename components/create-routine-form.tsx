"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { importRoutine } from "@/app/actions/trainer-actions"
import { getLatestPRForUserAndExercise } from "@/app/actions/pr-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImportExercisesDialog } from "@/components/import-exercises-dialog"
import { Check, ChevronsUpDown, Plus, X } from "lucide-react"
import { Reorder } from "framer-motion"
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
import { ExerciseSetEditor } from "@/components/exercise-set-editor"
import { ReorderableCard } from "@/components/reorderable-card"
import { TemplateSelectorDialog } from "@/components/template-selector-dialog"

interface SetDetail {
  reps?: string
  time?: string
  weight?: string
  rest?: string
}

interface Exercise {
  id?: string
  name: string
  sets?: string
  reps?: string
  weight?: string
  duration?: string
  notes?: string
  video_url?: string
  catalog_id?: string
  metric_type?: "reps" | "time"
  time_unit?: "seconds" | "minutes"
  type?: "exercise" | "marker"
  marker_color?: string
  sets_detailed?: boolean
  sets_detail?: SetDetail[]
}

interface Athlete {
  id: string
  full_name: string
  email?: string
}

interface Trainer {
  id: string
  full_name: string
  email?: string
}

interface CreateRoutineFormProps {
  athletes: Athlete[]
  creatorId: string
  trainers?: Trainer[]
  isAdmin?: boolean
  exerciseCatalog: ExerciseCatalogItem[]
}

export function CreateRoutineForm({ athletes, creatorId, trainers = [], isAdmin = false, exerciseCatalog = [] }: CreateRoutineFormProps) {
  const router = useRouter()
  // ... (maintain existing state)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [openComboboxIndex, setOpenComboboxIndex] = useState<number | null>(null)
  // Track loading state del popover de %
  const [loadingPRIndex, setLoadingPRIndex] = useState<number | null>(null)
  const [prNotFoundIndex, setPrNotFoundIndex] = useState<number | null>(null)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>(isAdmin ? "" : creatorId)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([""])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const generateId = () => crypto.randomUUID()

  const [exercises, setExercises] = useState<Exercise[]>([
    { id: generateId(), name: "", type: "marker", marker_color: "#FF6B00" },
    { id: generateId(), name: "", sets: "", reps: "", weight: "", duration: "", notes: "", video_url: "", catalog_id: "", metric_type: "reps", time_unit: "seconds", type: "exercise" }
  ])

  const sortedAthletes = [...athletes].sort((a, b) => a.full_name.localeCompare(b.full_name))

  const MARKER_COLORS = [
    "#FF6B00", // Naranja
    "#60A5FA", // Azul pastel
    "#34D399", // Verde esmeralda pastel
    "#F87171", // Rojo coral pastel
    "#A78BFA", // Violeta pastel
    "#9CA3AF", // Gris suave
    "#FCD34D", // Ámbar pastel
  ]

  const addExercise = () => {
    setExercises([...exercises, { id: generateId(), name: "", sets: "", reps: "", weight: "", duration: "", notes: "", video_url: "", catalog_id: "", metric_type: "reps", time_unit: "seconds", type: "exercise" }])
  }

  const addMarker = () => {
    setExercises([...exercises, { id: generateId(), name: "", type: "marker", marker_color: MARKER_COLORS[0] }])
  }

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  const moveExerciseUp = (index: number) => {
    if (index === 0) return
    const newExercises = [...exercises]
    const temp = newExercises[index]
    newExercises[index] = newExercises[index - 1]
    newExercises[index - 1] = temp
    setExercises(newExercises)
  }

  const moveExerciseDown = (index: number) => {
    if (index === exercises.length - 1) return
    const newExercises = [...exercises]
    const temp = newExercises[index]
    newExercises[index] = newExercises[index + 1]
    newExercises[index + 1] = temp
    setExercises(newExercises)
  }

  const updateExercise = (index: number, field: keyof Exercise, value: string) => {
    const newExercises = [...exercises]
    newExercises[index] = { ...newExercises[index], [field]: value }
    setExercises(newExercises)
  }

  const replaceExercise = (index: number, newExercise: Exercise) => {
    const newExercises = [...exercises]
    newExercises[index] = newExercise
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

  const handleExerciseNameSelect = (index: number, item: ExerciseCatalogItem) => {
    const newExercises = [...exercises]
    // Update name
    newExercises[index] = { ...newExercises[index], name: item.name, catalog_id: item.id }

    // Auto-fill video if available and current is empty
    if (item.video_url && !newExercises[index].video_url) {
      newExercises[index].video_url = item.video_url
    }
    setExercises(newExercises)
  }

  const handleApplyPercentage = async (index: number, pct: number) => {
    const exercise = exercises[index]
    const manualWeight = parseFloat(String(exercise.weight || "").replace(/ ?kg$/i, ""))
    setPrNotFoundIndex(null)

    if (!isNaN(manualWeight) && manualWeight > 0) {
      // Use manually entered weight
      const result = Math.round((manualWeight * pct / 100) * 2) / 2 // round to nearest 0.5
      const updated = { ...exercise, weight: String(result) }
      if (updated.sets_detailed && updated.sets_detail) {
        updated.sets_detail = updated.sets_detail.map(s => ({ ...s, weight: String(result) }))
      }
      replaceExercise(index, updated)
    } else if (selectedUserIds.find(Boolean) && exercise.catalog_id) {
      // Fetch from DB
      setLoadingPRIndex(index)
      const res = await getLatestPRForUserAndExercise(selectedUserIds.find(Boolean) || "", exercise.catalog_id)
      setLoadingPRIndex(null)
      if (res.data) {
        const result = Math.round((res.data * pct / 100) * 2) / 2 // round to nearest 0.5
        const updated = { ...exercise, weight: String(result) }
        if (updated.sets_detailed && updated.sets_detail) {
          updated.sets_detail = updated.sets_detail.map(s => ({ ...s, weight: String(result) }))
        }
        replaceExercise(index, updated)
      } else {
        setPrNotFoundIndex(index)
        setTimeout(() => setPrNotFoundIndex(null), 2500)
      }
    }
  }

  const handleImportExercises = (importedExercises: Exercise[]) => {
    const currentEmpty = exercises.filter((ex) => ex.name.trim() === "")
    if (currentEmpty.length === exercises.length) {
      setExercises(importedExercises)
    } else {
      setExercises([...exercises, ...importedExercises])
    }
  }

  const handleApplyTemplate = (template: { description?: string; exercises: Exercise[] }) => {
    setDescription(template.description || "")
    const newExercises = template.exercises.map((ex) => ({
      ...ex,
      id: generateId(),
    }))
    setExercises(newExercises)
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

    try {
      const validExercises = exercises.filter((ex) => ex.name.trim() !== "")

      console.log("Calling importRoutine with:", {
        title,
        description,
        start_date: startDate ? new Date(startDate).toISOString() : "",
        end_date: endDate ? new Date(endDate).toISOString() : "",
        exercises: validExercises,
        userIds: validUserIds,
        trainerId: selectedTrainerId,
      })

      const result = await importRoutine({
        title,
        description,
        start_date: startDate ? new Date(startDate).toISOString() : "",
        end_date: endDate ? new Date(endDate).toISOString() : "",
        exercises: validExercises,
        userIds: validUserIds,
        trainerId: selectedTrainerId,
      })

      console.log("importRoutine result:", result)

      if (!result) {
        throw new Error("El servidor no devolvió respuesta (result is undefined)")
      }

      if (result.error) throw new Error(result.error)

      router.push(isAdmin ? "/admin" : "/entrenador")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la rutina")
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
              <Button type="button" variant="outline" onClick={() => setShowTemplateDialog(true)}>
                Usar Plantilla
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowImportDialog(true)}>
                Importar Ejercicios
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {exercises.length === 0 && (
            <Button type="button" variant="outline" onClick={addMarker} className="w-full border-dashed mb-4">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Marca de Día
            </Button>
          )}
          <Reorder.Group axis="y" values={exercises} onReorder={setExercises} className="space-y-4">
            {exercises.map((exercise, index) => (
              <ReorderableCard
                key={exercise.id}
                value={exercise}
                index={index}
                total={exercises.length}
                onMoveUp={moveExerciseUp}
                onMoveDown={moveExerciseDown}
                onRemove={removeExercise}
                title={exercise.type === "marker" ? "Marca / División" : `Ejercicio ${exercises.filter((ex, i) => i < index && ex.type !== "marker").length + 1}`}
                isMarker={exercise.type === "marker"}
                markerColor={exercise.marker_color}
              >
                {exercise.type === "marker" ? (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor={`marker-name-${index}`} className="text-white">Nombre de la división (ej: &ldquo;Día 1 - Piernas 🔥&rdquo;)</Label>
                      <Input
                        id={`marker-name-${index}`}
                        placeholder="Ej: Día 1 - Piernas"
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
                  </>
                ) : (
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

                    <ExerciseSetEditor
                      exercise={exercise}
                      index={index}
                      onChange={(updated) => replaceExercise(index, updated)}
                      onApplyPercentage={handleApplyPercentage}
                      loadingPR={loadingPRIndex === index}
                      prNotFound={prNotFoundIndex === index}
                    />

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
                )}
              </ReorderableCard>
            ))}
          </Reorder.Group>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={addExercise} className="flex-1 border-dashed">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Ejercicio
            </Button>
            <Button type="button" variant="outline" onClick={addMarker} className="flex-1 border-dashed">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Marca
            </Button>
          </div>
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

      <TemplateSelectorDialog
        isOpen={showTemplateDialog}
        onOpenChange={setShowTemplateDialog}
        onSelect={(template) => handleApplyTemplate(template)}
      />
    </form>
  )
}
