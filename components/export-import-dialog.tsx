"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { exportRoutine } from "@/app/actions/trainer-actions"
import * as XLSX from "xlsx"

interface ExportDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  routineId?: string
}

export function ExportImportDialog({
  isOpen,
  onOpenChange,
  routineId,
}: ExportDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<"json" | "csv" | "xlsx">("json")

  const handleExport = async () => {
    if (!routineId) return
    setIsLoading(true)
    setError(null)
    try {
      if (selectedFormat === "xlsx") {
        // Para Excel, necesito los datos
        const result = await exportRoutine(routineId, "json")
        if (result.error) {
          setError(result.error)
          setIsLoading(false)
          return
        }

        const exercises = JSON.parse(result.data!)
        
        // Crear workbook y agregar datos
        const ws = XLSX.utils.json_to_sheet(exercises)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Ejercicios")
        
        // Ajustar ancho de columnas
        const colWidths = [
          { wch: 30 }, // name
          { wch: 8 },  // sets
          { wch: 8 },  // reps
          { wch: 10 }, // weight
          { wch: 8 },  // rest
          { wch: 30 }, // notes
        ]
        ws["!cols"] = colWidths
        
        XLSX.writeFile(wb, `ejercicios.xlsx`)
      } else {
        const result = await exportRoutine(routineId, selectedFormat)
        if (result.error) {
          setError(result.error)
          setIsLoading(false)
          return
        }

        // Crear blob y descargar
        const blob = new Blob([result.data!], {
          type: selectedFormat === "json" ? "application/json" : "text/csv",
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = result.filename!
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }

      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || "Error al exportar")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Descargar Ejercicios</DialogTitle>
          <DialogDescription>Descarga los ejercicios de la rutina en tu formato preferido</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Formato de descarga</Label>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedFormat === "json" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFormat("json")}
              >
                JSON
              </Button>
              <Button
                variant={selectedFormat === "csv" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFormat("csv")}
              >
                CSV
              </Button>
              <Button
                variant={selectedFormat === "xlsx" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFormat("xlsx")}
              >
                Excel
              </Button>
            </div>
          </div>
          {error && <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">{error}</div>}
          <Button onClick={handleExport} disabled={isLoading || !routineId} className="w-full">
            {isLoading ? "Descargando..." : "Descargar Ejercicios"}
          </Button>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
