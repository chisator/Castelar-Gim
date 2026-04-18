"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit, Trash2, Plus, Search } from "lucide-react"
import { createExerciseCatalogItem, updateExerciseCatalogItem, deleteExerciseCatalogItem } from "@/app/actions/admin-actions"

interface Exercise {
    id: string
    name: string
    video_url?: string | null
}

interface ExercisesCatalogTableProps {
    exercises: Exercise[]
}

export function ExercisesCatalogTable({ exercises }: ExercisesCatalogTableProps) {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // State for Create/Edit Dialog
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
    const [formData, setFormData] = useState({ name: "", video_url: "" })

    const filteredExercises = exercises.filter(ex =>
        ex.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleOpenCreate = () => {
        setEditingExercise(null)
        setFormData({ name: "", video_url: "" })
        setError(null)
        setIsDialogOpen(true)
    }

    const handleOpenEdit = (exercise: Exercise) => {
        setEditingExercise(exercise)
        setFormData({ name: exercise.name, video_url: exercise.video_url || "" })
        setError(null)
        setIsDialogOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            if (editingExercise) {
                // Update
                const result = await updateExerciseCatalogItem({
                    id: editingExercise.id,
                    name: formData.name,
                    video_url: formData.video_url || undefined
                })
                if (result.error) throw new Error(result.error)
            } else {
                // Create
                const result = await createExerciseCatalogItem({
                    name: formData.name,
                    video_url: formData.video_url || undefined
                })
                if (result.error) throw new Error(result.error)
            }

            setIsDialogOpen(false)
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar el ejercicio "${name}"?`)) return

        try {
            const result = await deleteExerciseCatalogItem(id)
            if (result.error) {
                alert(result.error)
            } else {
                router.refresh()
            }
        } catch (err: any) {
            alert("Error al eliminar")
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar ejercicio..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Button onClick={handleOpenCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Ejercicio
                </Button>
            </div>

            <div className="rounded-md border bg-white dark:bg-gray-900">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Video URL</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredExercises.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    No se encontraron ejercicios.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredExercises.map((exercise) => (
                                <TableRow key={exercise.id}>
                                    <TableCell className="font-medium">{exercise.name}</TableCell>
                                    <TableCell className="max-w-xs truncate text-muted-foreground text-sm">
                                        {exercise.video_url || "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(exercise)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(exercise.id, exercise.name)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingExercise ? "Editar Ejercicio" : "Crear Nuevo Ejercicio"}</DialogTitle>
                        <DialogDescription>
                            Agrega un ejercicio al catálogo para que esté disponible en las rutinas.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej: Sentadillas con barra"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="video_url">URL de Video (YouTube)</Label>
                            <Input
                                id="video_url"
                                value={formData.video_url}
                                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                                placeholder="https://youtube.com/..."
                            />
                        </div>

                        {error && <p className="text-sm text-destructive">{error}</p>}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Guardando..." : "Guardar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
