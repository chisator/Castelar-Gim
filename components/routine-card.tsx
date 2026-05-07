"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

// ... imports remain mostly the same, remove Dialog imports if unused

interface RoutineCardProps {
  routine: any
  attendance?: any
  athleteId: string
  isPast?: boolean
}

// Helper component for individual exercise items with video toggle
function ExerciseItem({ exercise }: { exercise: any }) {
  const [showVideo, setShowVideo] = useState(false)

  const getYouTubeId = (url: string) => {
    if (!url) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  const videoId = getYouTubeId(exercise.video_url)

  return (
    <li className="text-sm bg-muted p-3 rounded-md">
      <p className="font-medium text-base">{exercise.name}</p>
      <div className="grid grid-cols-2 gap-2 mt-2 text-xs sm:text-sm">
        {exercise.sets && <p className="text-muted-foreground">Series: <span className="text-foreground">{exercise.sets}</span></p>}
        {exercise.reps && <p className="text-muted-foreground">Reps: <span className="text-foreground">{exercise.reps}</span></p>}
        {exercise.weight && <p className="text-muted-foreground">Peso: <span className="text-foreground">{exercise.weight}{!exercise.weight.toLowerCase().includes("kg") && " kg"}</span></p>}
        {exercise.duration && <p className="text-muted-foreground">Descanso: <span className="text-foreground">{exercise.duration}</span></p>}
      </div>

      {videoId && (
        <div className="mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVideo(!showVideo)}
            className="w-full text-xs h-8 mb-2"
          >
            {showVideo ? "Ocultar video" : "Ver video tutorial"}
          </Button>

          {showVideo && (
            <div className="aspect-video w-full rounded-md overflow-hidden bg-black/10">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}`}
                title={exercise.name}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          )}
        </div>
      )}

      {exercise.notes && <p className="text-muted-foreground mt-2 text-xs italic">{exercise.notes}</p>}
    </li>
  )
}

interface RoutineCardProps {
  routine: any
  attendance?: any
  athleteId: string
  isPast?: boolean
  index?: number
}

// ... (ExerciseItem remains same)

export function RoutineCard({ routine, attendance, athleteId, isPast = false, index = 0 }: RoutineCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const exercises = Array.isArray(routine.exercises) ? routine.exercises : []

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <Card
      className="flex flex-col border transition-shadow bg-card/50 border-primary ring-[3px] ring-primary/50"
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base sm:text-lg">{routine.title}</CardTitle>
            <CardDescription className="mt-1">
              <Badge variant="outline" className="mr-2">
                {routine.sports?.name}
              </Badge>
              <span className="text-xs">
                {routine.start_date && routine.end_date
                  ? `${formatDate(routine.start_date)} - ${formatDate(routine.end_date)}`
                  : routine.end_date
                    ? formatDate(routine.end_date)
                    : routine.start_date
                      ? formatDate(routine.start_date)
                      : "Sin fecha"}
              </span>
            </CardDescription>
          </div>
          {isPast && attendance?.completed && (
            <Badge variant="default" className="bg-green-600">
              Completada
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        {routine.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{routine.description}</p>
        )}

        <div className="mt-auto">
          {isPast ? (
            <Button variant="outline" size="sm" className="w-full cursor-not-allowed opacity-70" disabled>
              Rutina finalizada - Detalles ocultos
            </Button>
          ) : (
            <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full space-y-2">
              <div className="flex items-center justify-between space-x-4">
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full flex justify-between items-center">
                    <span>Ver detalles y ejercicios</span>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="space-y-4 pt-4 border-t mt-4">
                <div className="space-y-4">
                  {routine.description && (
                    <div>
                      <h4 className="font-semibold mb-1 text-sm">Descripción</h4>
                      <p className="text-sm text-muted-foreground">{routine.description}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Ejercicios</h4>
                    <ul className="space-y-4">
                      {exercises.map((exercise: any, index: number) => (
                        <ExerciseItem key={index} exercise={exercise} />
                      ))}
                    </ul>
                    {exercises.length === 0 && <p className="text-sm text-muted-foreground">No hay ejercicios en esta rutina.</p>}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


