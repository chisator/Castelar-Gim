"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SmartNumberInput } from "@/components/smart-number-input"
import { Plus, Trash2, Percent, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SetDetail {
  reps?: string
  time?: string
  weight?: string
  rest?: string
}

interface Exercise {
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

interface ExerciseSetEditorProps {
  exercise: Exercise
  index: number
  onChange: (exercise: Exercise) => void
  onApplyPercentage?: (index: number, percentage: number) => void
  loadingPR?: boolean
  prNotFound?: boolean
}

const PERCENTAGES = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95]

export function ExerciseSetEditor({ exercise, index, onChange, onApplyPercentage, loadingPR, prNotFound }: ExerciseSetEditorProps) {
  const [percentOpen, setPercentOpen] = useState(false)

  const isDetailed = exercise.sets_detailed === true && exercise.sets_detail && exercise.sets_detail.length > 0

  const toggleDetailed = () => {
    if (isDetailed) {
      // Switch to simple mode — sync flat fields from first detailed row
      const detail = exercise.sets_detail
      const firstSet = detail?.[0]
      onChange({
        ...exercise,
        sets_detailed: false,
        sets: detail?.length ? String(detail.length) : exercise.sets,
        reps: exercise.metric_type === "time"
          ? (firstSet?.time || exercise.reps || "")
          : (firstSet?.reps || exercise.reps || ""),
        weight: firstSet?.weight || exercise.weight || "",
        duration: firstSet?.rest || exercise.duration || "",
      })
    } else {
      // Switch to detailed mode — generate rows from flat fields
      const setCount = Math.max(1, parseInt(exercise.sets || "1", 10) || 1)
      const defaultSet: SetDetail = {
        reps: exercise.metric_type === "time" ? undefined : (exercise.reps || ""),
        time: exercise.metric_type === "time" ? (exercise.reps || "") : undefined,
        weight: exercise.weight || "",
        rest: exercise.duration || "",
      }
      const newDetail = Array.from({ length: setCount }, () => ({ ...defaultSet }))
      onChange({
        ...exercise,
        sets_detailed: true,
        sets_detail: newDetail,
      })
    }
  }

  const updateDetail = (setIndex: number, field: keyof SetDetail, value: string) => {
    const detail = [...(exercise.sets_detail || [])]
    detail[setIndex] = { ...detail[setIndex], [field]: value }
    onChange({ ...exercise, sets_detail: detail })
  }

  const addSet = () => {
    const detail = [...(exercise.sets_detail || [])]
    const lastSet = detail[detail.length - 1]
    detail.push({
      reps: lastSet?.reps,
      time: lastSet?.time,
      weight: lastSet?.weight,
      rest: lastSet?.rest,
    })
    onChange({ ...exercise, sets_detail: detail })
  }

  const removeSet = (setIndex: number) => {
    const detail = [...(exercise.sets_detail || [])]
    detail.splice(setIndex, 1)
    if (detail.length === 0) {
      // Auto-switch back to simple if no sets left
      onChange({ ...exercise, sets_detailed: false, sets_detail: [] })
    } else {
      onChange({ ...exercise, sets_detail: detail })
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={toggleDetailed}
          className={cn(
            "text-xs font-medium px-3 py-1 rounded-full border transition-colors",
            isDetailed
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted text-muted-foreground border-transparent hover:text-foreground"
          )}
        >
          {isDetailed ? "✓ Series detalladas" : "⚡ Detallar series"}
        </button>
      </div>

      {isDetailed ? (
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-3 text-center">{exercise.metric_type === "time" ? "Tiempo" : "Reps"}</div>
            <div className="col-span-3 text-center">Peso</div>
            <div className="col-span-3 text-center">Descanso</div>
            <div className="col-span-2"></div>
          </div>

          {/* Rows */}
          {exercise.sets_detail?.map((set, setIndex) => (
            <div key={setIndex} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-1 text-center text-sm font-medium text-muted-foreground">
                {setIndex + 1}
              </div>
              <div className="col-span-3">
                <div className="flex gap-1 items-center">
                  <Input
                    type="number"
                    value={exercise.metric_type === "time" ? (set.time || "") : (set.reps || "")}
                    onChange={(e) => updateDetail(setIndex, exercise.metric_type === "time" ? "time" : "reps", e.target.value)}
                    className="text-center h-8 text-sm"
                    placeholder={exercise.metric_type === "time" ? "40" : "10"}
                  />
                  {exercise.metric_type === "time" && (
                    <span className="text-xs text-muted-foreground">
                      {exercise.time_unit === "minutes" ? "'" : "\""}
                    </span>
                  )}
                </div>
              </div>
              <div className="col-span-3">
                <div className="relative">
                  <Input
                    type="number"
                    step="0.5"
                    value={set.weight || ""}
                    onChange={(e) => updateDetail(setIndex, "weight", e.target.value)}
                    className="text-center h-8 text-sm pr-7"
                    placeholder="20"
                  />
                  <span className="absolute right-2 top-1.5 text-xs text-muted-foreground pointer-events-none">kg</span>
                </div>
              </div>
              <div className="col-span-3">
                <Input
                  type="text"
                  value={set.rest || ""}
                  onChange={(e) => updateDetail(setIndex, "rest", e.target.value)}
                  className="text-center h-8 text-sm"
                  placeholder="60 seg"
                />
              </div>
              <div className="col-span-2 flex justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSet(setIndex)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSet}
            className="w-full text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Agregar serie
          </Button>
        </div>
      ) : (
        /* Simple mode */
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor={`exercise-sets-${index}`}>Series</Label>
            <SmartNumberInput
              value={exercise.sets || ""}
              onChange={(val) => onChange({ ...exercise, sets: val })}
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
                  onClick={() => onChange({ ...exercise, metric_type: exercise.metric_type === "time" ? "reps" : "time" })}
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
                  onClick={() => onChange({ ...exercise, metric_type: exercise.metric_type === "time" ? "reps" : "time" })}
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
                  onChange={(val) => onChange({ ...exercise, reps: val })}
                  placeholder={exercise.metric_type === "time" ? "Ej: 40" : "Ej: 10"}
                  suggestions={exercise.metric_type === "time" ? [30, 40, 60, 90] : [8, 10, 12, 15]}
                />
              </div>
              {exercise.metric_type === "time" && (
                <div className="flex items-center gap-1 bg-muted rounded-full p-0.5 self-start">
                  <button
                    type="button"
                    onClick={() => onChange({ ...exercise, time_unit: exercise.time_unit === "minutes" ? "seconds" : "minutes" })}
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
                    onClick={() => onChange({ ...exercise, time_unit: exercise.time_unit === "minutes" ? "seconds" : "minutes" })}
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
            <div className="flex gap-1">
              <div className="relative flex-1">
                <Input
                  id={`exercise-weight-${index}`}
                  placeholder="Ej: 20"
                  value={exercise.weight?.replace(/ ?kg$/i, "") || ""}
                  onChange={(e) => onChange({ ...exercise, weight: e.target.value })}
                  className="pr-8"
                  type="number"
                  step="0.5"
                />
                <span className="absolute right-3 top-2.5 text-sm text-muted-foreground pointer-events-none">kg</span>
              </div>
              {onApplyPercentage && (
                <Popover open={percentOpen} onOpenChange={setPercentOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0 h-10 w-10 relative"
                      title="Calcular % del 1RM"
                    >
                      {loadingPR ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Percent className="h-4 w-4" />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-28" align="end">
                    <div className="py-1 px-1">
                      <p className="text-xs text-muted-foreground text-center py-1 font-medium border-b mb-1">% del 1RM</p>
                      <div className="overflow-y-auto max-h-48 flex flex-col gap-0.5">
                        {PERCENTAGES.map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => {
                              onApplyPercentage(index, pct)
                              setPercentOpen(false)
                            }}
                            className="w-full text-left text-sm px-2 py-1 rounded hover:bg-muted transition-colors"
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            {prNotFound && (
              <p className="text-xs text-amber-600">No hay PR registrado para este ejercicio.</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`exercise-duration-${index}`}>Descanso / Pausa</Label>
            <Input
              id={`exercise-duration-${index}`}
              placeholder="Ej: 60 seg"
              value={exercise.duration}
              onChange={(e) => onChange({ ...exercise, duration: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  )
}
