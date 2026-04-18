"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import * as XLSX from "xlsx"

interface Exercise {
  name: string
  sets: string
  reps: string
  weight?: string
  rest?: number
  notes?: string
}

interface ImportExercisesDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onImport: (exercises: Exercise[]) => void
}

export function ImportExercisesDialog({ isOpen, onOpenChange, onImport }: ImportExercisesDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parseExcelFile = (arrayBuffer: ArrayBuffer): Exercise[] => {
    const workbook = XLSX.read(arrayBuffer, { type: "array" })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][]

    if (data.length < 2) {
      throw new Error("El archivo Excel debe contener al menos un ejercicio")
    }

    const headers = (data[0] || []).map((h) => String(h).toLowerCase().trim())
    const nameIdx = headers.indexOf("name") >= 0 ? headers.indexOf("name") : 0
    const setsIdx = headers.indexOf("sets") >= 0 ? headers.indexOf("sets") : 1
    const repsIdx = headers.indexOf("reps") >= 0 ? headers.indexOf("reps") : 2
    const weightIdx = headers.indexOf("weight")
    const restIdx = headers.indexOf("rest")
    const notesIdx = headers.indexOf("notes")

    const exercises: Exercise[] = []
    for (let i = 1; i < data.length; i++) {
      const row = data[i] || []
      if (row[nameIdx]) {
        exercises.push({
          name: String(row[nameIdx]).trim(),
          sets: String(row[setsIdx] || "3").trim(),
          reps: String(row[repsIdx] || "10").trim(),
          weight: weightIdx >= 0 && row[weightIdx] ? String(row[weightIdx]) : undefined,
          rest: restIdx >= 0 && row[restIdx] ? parseInt(String(row[restIdx])) : undefined,
          notes: notesIdx >= 0 && row[notesIdx] ? String(row[notesIdx]).trim() : undefined,
        })
      }
    }

    return exercises
  }

  const handleImport = async () => {
    if (!file) {
      setError("Selecciona un archivo")
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      let exercises: Exercise[] = []

      if (file.name.endsWith(".json")) {
        const fileContent = await file.text()
        const data = JSON.parse(fileContent)
        exercises = Array.isArray(data) ? data : data.routine?.exercises || data.exercises || []
      } else if (file.name.endsWith(".csv")) {
        // Parse CSV: Headers must be: name,sets,reps,weight,rest,notes
        const fileContent = await file.text()
        const lines = fileContent.split("\n").filter((line) => line.trim())
        if (lines.length < 2) {
          setError("El archivo CSV debe contener al menos un ejercicio")
          setIsLoading(false)
          return
        }

        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
        const nameIdx = headers.indexOf("name") >= 0 ? headers.indexOf("name") : 0
        const setsIdx = headers.indexOf("sets") >= 0 ? headers.indexOf("sets") : 1
        const repsIdx = headers.indexOf("reps") >= 0 ? headers.indexOf("reps") : 2
        const weightIdx = headers.indexOf("weight")
        const restIdx = headers.indexOf("rest")
        const notesIdx = headers.indexOf("notes")

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""))
          if (cols[nameIdx]) {
            exercises.push({
              name: cols[nameIdx],
              sets: cols[setsIdx] || "3",
              reps: cols[repsIdx] || "10",
              weight: weightIdx >= 0 && cols[weightIdx] ? cols[weightIdx] : undefined,
              rest: restIdx >= 0 && cols[restIdx] ? parseInt(cols[restIdx]) : undefined,
              notes: notesIdx >= 0 ? cols[notesIdx] : undefined,
            })
          }
        }
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        const arrayBuffer = await file.arrayBuffer()
        exercises = parseExcelFile(arrayBuffer)
      } else {
        setError("Formato no soportado (JSON, CSV o Excel)")
        setIsLoading(false)
        return
      }

      if (exercises.length === 0) {
        setError("No se encontraron ejercicios en el archivo")
        setIsLoading(false)
        return
      }

      onImport(exercises)
      setFile(null)
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || "Error al procesar el archivo")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Ejercicios</DialogTitle>
          <DialogDescription>Carga ejercicios desde un archivo JSON, CSV o Excel existente</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exerciseFile">Archivo (JSON, CSV o Excel)</Label>
            <Input
              id="exerciseFile"
              type="file"
              accept=".json,.csv,.xlsx,.xls"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null)
                setError(null)
              }}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              JSON: Array de ejercicios o {"{ routine: { exercises: [...] } }"}
              <br />
              CSV: name, sets, reps, weight (opt), rest (opt), notes (opt)
              <br />
              Excel: Primeras columnas: name, sets, reps (opcionales: weight, rest, notes)
            </p>
          </div>

          {error && <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">{error}</div>}

          <Button onClick={handleImport} disabled={isLoading || !file} className="w-full">
            {isLoading ? "Cargando..." : "Importar Ejercicios"}
          </Button>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="flex-1">
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
