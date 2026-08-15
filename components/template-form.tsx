"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { Reorder } from "framer-motion"
import { ExerciseAutosuggest, ExerciseCatalogItem } from "@/components/exercise-selector"
import { ExerciseSetEditor } from "@/components/exercise-set-editor"
import { ReorderableCard } from "@/components/reorderable-card"
import { createTemplate, updateTemplate } from "@/app/actions/template-actions"
import { toast } from "sonner"

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

interface Template {
  id: string
  title: string
  description?: string
  exercises: Exercise[]
}

interface TemplateFormProps {
  mode: "create" | "edit"
  initialTemplate?: Template
  exerciseCatalog: ExerciseCatalogItem[]
}

export function TemplateForm({ mode, initialTemplate, exerciseCatalog = [] }: TemplateFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(initialTemplate?.title || "")
  const [description, setDescription] = useState(initialTemplate?.description || "")
  const generateId = () => crypto.randomUUID()

  const [exercises, setExercises] = useState<Exercise[]>(() => {
    const initial = initialTemplate?.exercises || []
    if (initial.length === 0) {
      return [
        { id: generateId(), name: "", type: "marker", marker_color: "#FF6B00" },
        { id: generateId(), name: "", sets: "", reps: "", weight: "", duration: "", notes: "", video_url: "", catalog_id: "", metric_type: "reps", time_unit: "seconds", type: "exercise" }
      ]
    }
    return initial.map((ex) => (ex.id ? ex : { ...ex, id: generateId() }))
  })

  const MARKER_COLORS = [
    "#FF6B00",
    "#60A5FA",
    "#34D399",
    "#F87171",
    "#A78BFA",
    "#9CA3AF",
    "#FCD34D",
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

  const handleExerciseNameSelect = (index: number, item: ExerciseCatalogItem) => {
    const newExercises = [...exercises]
    newExercises[index] = { ...newExercises[index], name: item.name, catalog_id: item.id }
    if (item.video_url && !newExercises[index].video_url) {
      newExercises[index].video_url = item.video_url
    }
    setExercises(newExercises)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const validExercises = exercises.filter((ex) => ex.name.trim() !== "")

    try {
      let result
      if (mode === "edit" && initialTemplate) {
        result = await updateTemplate({
          templateId: initialTemplate.id,
          title,
          description,
          exercises: validExercises,
        })
      } else {
        result = await createTemplate({
          title,
          description,
          exercises: validExercises,
        })
      }

      if (!result) {
        throw new Error("El servidor no devolvió respuesta")
      }

      if (result.error) throw new Error(result.error)

      toast.success(mode === "edit" ? "Plantilla actualizada" : "Plantilla creada")
      router.push("/entrenador/plantillas")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la plantilla")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Información de la Plantilla</CardTitle>
          <CardDescription>Completa los datos básicos de la plantilla</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título de la Plantilla</Label>
            <Input
              id="title"
              placeholder="Ej: Adaptación General - Piernas"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe el objetivo de esta plantilla..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex-1 min-w-fit">
              <CardTitle>Ejercicios</CardTitle>
              <CardDescription>Agrega los ejercicios de la plantilla</CardDescription>
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
                      <Label htmlFor={`marker-name-${index}`} className="text-white">Nombre de la división (ej: &quot;Día 1 - Piernas 🔥&quot;)</Label>
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
          {isLoading ? (mode === "edit" ? "Actualizando..." : "Guardando...") : (mode === "edit" ? "Actualizar Plantilla" : "Guardar Plantilla")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/entrenador/plantillas")} disabled={isLoading}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
