"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { savePersonalRecord, getExerciseCatalog } from "@/app/actions/pr-actions"
import Link from "next/link"
import { ChevronLeft, Save, Loader2, Trophy } from "lucide-react"

export default function NuevoPRPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<{oneRM: number} | null>(null)
    const [catalog, setCatalog] = useState<{id: string, name: string}[]>([])
    const [loadingCatalog, setLoadingCatalog] = useState(true)

    useEffect(() => {
        async function loadCatalog() {
            const result = await getExerciseCatalog()
            if (result.data) {
                setCatalog(result.data)
            }
            setLoadingCatalog(false)
        }
        loadCatalog()
    }, [])


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(null)

        const formData = new FormData(e.currentTarget)
        const exerciseId = formData.get("exercise_id") as string
        const weight = parseFloat(formData.get("weight") as string)
        const reps = parseInt(formData.get("reps") as string, 10)
        const date = formData.get("date") as string

        if (!exerciseId || isNaN(weight) || isNaN(reps) || !date) {
            setError("Por favor, completa todos los campos correctamente.")
            setLoading(false)
            return
        }

        const result = await savePersonalRecord(exerciseId, weight, reps, date)

        if (result.error) {
            setError(result.error)
        } else if (result.success && result.oneRM) {
            setSuccess({ oneRM: result.oneRM })
            setTimeout(() => {
                router.push("/deportista/registros")
            }, 3000)
        }

        setLoading(false)
    }

    const today = new Date().toISOString().split("T")[0]

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="mb-6 flex items-center justify-between">
                <Button variant="ghost" asChild className="p-0 hover:bg-transparent">
                    <Link href="/deportista/registros" className="flex items-center gap-2">
                        <ChevronLeft className="h-5 w-5" />
                        <span>Volver a Registros</span>
                    </Link>
                </Button>
            </div>

            <Card className="border-indigo-100 shadow-md">
                <CardHeader className="bg-indigo-50/50 pb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-3 rounded-full">
                            <Trophy className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl text-indigo-950">Registrar Nuevo PR</CardTitle>
                            <CardDescription className="text-indigo-700/70">Calcula tu 1RM y guarda tu récord</CardDescription>
                        </div>
                    </div>
                </CardHeader>

                {success ? (
                    <CardContent className="pt-8 pb-8 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                            <Trophy className="h-8 w-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-green-700">¡PR Registrado!</h3>
                        <p className="text-muted-foreground text-lg">
                            Tu 1RM estimado (Fórmula Brzycki) es:
                        </p>
                        <div className="text-5xl font-black text-indigo-600 my-4">
                            {success.oneRM} <span className="text-2xl text-indigo-400">kg</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-4">
                            Redirigiendo a tus registros...
                        </p>
                    </CardContent>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6 pt-6">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="exercise_id">Ejercicio del Catálogo</Label>
                                <select 
                                    id="exercise_id" 
                                    name="exercise_id" 
                                    required 
                                    disabled={loadingCatalog}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">{loadingCatalog ? "Cargando ejercicios..." : "Selecciona un ejercicio"}</option>
                                    {catalog.map((exercise) => (
                                        <option key={exercise.id} value={exercise.id}>
                                            {exercise.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="weight">Peso (kg)</Label>
                                    <Input 
                                        id="weight" 
                                        name="weight" 
                                        type="number" 
                                        step="0.5" 
                                        min="0"
                                        placeholder="0.0" 
                                        required 
                                        className="focus-visible:ring-indigo-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reps">Repeticiones</Label>
                                    <Input 
                                        id="reps" 
                                        name="reps" 
                                        type="number" 
                                        min="1" 
                                        max="36"
                                        placeholder="0" 
                                        required 
                                        className="focus-visible:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date">Fecha</Label>
                                <Input 
                                    id="date" 
                                    name="date" 
                                    type="date" 
                                    defaultValue={today} 
                                    required 
                                    className="focus-visible:ring-indigo-500"
                                />
                            </div>

                            <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                                <p><strong>Fórmula de Brzycki:</strong></p>
                                <p className="font-mono mt-1 text-xs bg-background p-2 rounded border">1RM = Peso × (36 / (37 - Repeticiones))</p>
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-4" 
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Calcular y Guardar PR
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </form>
                )}
            </Card>
        </div>
    )
}
