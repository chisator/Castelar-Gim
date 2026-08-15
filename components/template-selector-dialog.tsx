"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText, Dumbbell, Loader2 } from "lucide-react"
import { getMyTemplates } from "@/app/actions/template-actions"
import { toast } from "sonner"

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

interface Template {
  id: string
  title: string
  description?: string
  exercises: Exercise[]
  created_at: string
}

interface TemplateSelectorDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (template: Template) => void
}

export function TemplateSelectorDialog({ isOpen, onOpenChange, onSelect }: TemplateSelectorDialogProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      getMyTemplates()
        .then((result) => {
          if (result.error) {
            toast.error(result.error)
          } else if (result.data) {
            setTemplates(result.data as Template[])
          }
        })
        .catch(() => toast.error("Error al cargar plantillas"))
        .finally(() => setLoading(false))
    }
  }, [isOpen])

  const handleSelect = (template: Template) => {
    onSelect(template)
    onOpenChange(false)
  }

  const exerciseCount = (template: Template) => {
    return template.exercises?.filter((ex) => ex.type !== "marker").length || 0
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Usar Plantilla</DialogTitle>
          <DialogDescription>Selecciona una plantilla para precargar los ejercicios</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Cargando plantillas...</span>
          </div>
        ) : templates.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tenés plantillas guardadas.</p>
            <p className="text-xs mt-1">Creá una desde el panel de Plantillas.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleSelect(template)}
                  className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{template.title}</p>
                      {template.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{template.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Dumbbell className="h-3 w-3" />
                      <span>{exerciseCount(template)} ej.</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-2 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
