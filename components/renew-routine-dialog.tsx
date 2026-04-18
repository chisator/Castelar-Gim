"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { renewRoutine } from "@/app/actions/trainer-actions"

interface RenewRoutineDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  routineId: string
  currentEndDate?: string
}

export function RenewRoutineDialog({ isOpen, onOpenChange, routineId, currentEndDate }: RenewRoutineDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customDate, setCustomDate] = useState("")

  const handleRenew = async (months: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await renewRoutine({ routineId, months })
      if (result.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }
      onOpenChange(false)
      window.location.reload()
    } catch (err: any) {
      setError(err.message || "Error al renovar la rutina")
      setIsLoading(false)
    }
  }

  const handleCustomDate = async () => {
    if (!customDate) {
      setError("Ingresa una fecha válida (YYYY-MM-DD)")
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const result = await renewRoutine({ routineId, newEndDate: customDate })
      if (result.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }
      onOpenChange(false)
      window.location.reload()
    } catch (err: any) {
      setError(err.message || "Error al renovar la rutina")
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renovar Rutina</DialogTitle>
          <DialogDescription>
            {currentEndDate ? `Fecha actual de fin: ${new Date(currentEndDate).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })}` : "Extiende el período de esta rutina"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Extender por:</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => handleRenew(1)}
                disabled={isLoading}
                className="text-sm"
              >
                +1 mes
              </Button>
              <Button
                variant="outline"
                onClick={() => handleRenew(3)}
                disabled={isLoading}
                className="text-sm"
              >
                +3 meses
              </Button>
              <Button
                variant="outline"
                onClick={() => handleRenew(6)}
                disabled={isLoading}
                className="text-sm"
              >
                +6 meses
              </Button>
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="customDate">O ingresa una fecha personalizada</Label>
            <div className="flex gap-2">
              <Input
                id="customDate"
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value)
                  setError(null)
                }}
                disabled={isLoading}
              />
              <Button
                onClick={handleCustomDate}
                disabled={isLoading || !customDate}
                className="min-w-fit"
              >
                {isLoading ? "..." : "Aplicar"}
              </Button>
            </div>
          </div>

          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
