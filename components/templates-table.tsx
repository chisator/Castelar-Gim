"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dumbbell, FileText } from "lucide-react"

interface SetDetail {
  reps?: string
  time?: string
  weight?: string
  rest?: string
}

interface Exercise {
  name: string
  type?: "exercise" | "marker"
  sets?: string
  reps?: string
  weight?: string
  duration?: string
  notes?: string
  video_url?: string
  metric_type?: "reps" | "time"
  time_unit?: "seconds" | "minutes"
  sets_detailed?: boolean
  sets_detail?: SetDetail[]
}

interface Template {
  id: string
  title: string
  description?: string
  exercises: Exercise[]
  trainer_id: string
  created_at: string
  profiles?: { full_name?: string }
}

interface TemplatesTableProps {
  templates: Template[]
}

export function TemplatesTable({ templates }: TemplatesTableProps) {
  const exerciseCount = (exercises: Exercise[]) => {
    return exercises?.filter((ex) => ex.type !== "marker").length || 0
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plantillas de Rutinas</CardTitle>
        <CardDescription>Visualización de todas las plantillas creadas por los entrenadores</CardDescription>
      </CardHeader>
      <CardContent>
        {templates.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay plantillas registradas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Entrenador</TableHead>
                  <TableHead className="text-center">Ejercicios</TableHead>
                  <TableHead className="text-right">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{template.title}</p>
                        {template.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{template.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {template.profiles?.full_name || "Sin nombre"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <Dumbbell className="h-3 w-3" />
                        <span>{exerciseCount(template.exercises)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {formatDate(template.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
