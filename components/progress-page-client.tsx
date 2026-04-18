"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProgressChart } from "@/components/progress-chart"
import { getExerciseProgress } from "@/app/actions/progress-actions"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface ProgressPageClientProps {
    exercises: string[]
}

export function ProgressPageClient({ exercises }: ProgressPageClientProps) {
    const [selectedExercise, setSelectedExercise] = useState<string>("")
    const [chartData, setChartData] = useState<{ date: string; weight: number; oneRM: number; volume: number }[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (selectedExercise) {
            setLoading(true)
            getExerciseProgress(selectedExercise)
                .then((result) => {
                    if (result.data) {
                        setChartData(result.data)
                    } else {
                        setChartData([])
                    }
                })
                .finally(() => setLoading(false))
        }
    }, [selectedExercise])

    return (
        <div className="space-y-6">
            <Card className="p-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Selecciona un ejercicio
                    </label>
                    <Select onValueChange={setSelectedExercise} value={selectedExercise}>
                        <SelectTrigger className="w-full sm:w-[300px]">
                            <SelectValue placeholder="Buscar ejercicio..." />
                        </SelectTrigger>
                        <SelectContent>
                            {exercises.length > 0 ? (
                                exercises.map((ex) => (
                                    <SelectItem key={ex} value={ex}>
                                        {ex}
                                    </SelectItem>
                                ))
                            ) : (
                                <div className="p-2 text-sm text-muted-foreground text-center">
                                    No hay ejercicios registrados aún.
                                </div>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            </Card>

            {selectedExercise && (
                <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                    {loading ? (
                        <div className="flex h-[300px] items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <ProgressChart data={chartData} exerciseName={selectedExercise} />
                    )}
                </div>
            )}
        </div>
    )
}
