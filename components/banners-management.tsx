"use client"

import { useState } from "react"
import { uploadBanner, deleteBanner, toggleBannerStatus, updateBannersOrder } from "@/app/actions/banner-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Plus, GripVertical } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

export function BannersManagement({ initialBanners }: { initialBanners: any[] }) {
    const [banners, setBanners] = useState(initialBanners)
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [fileDesktop, setFileDesktop] = useState<File | null>(null)
    const [fileMobile, setFileMobile] = useState<File | null>(null)
    const [linkUrl, setLinkUrl] = useState("")

    const handleFileDesktopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFileDesktop(e.target.files[0])
        }
    }

    const handleFileMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFileMobile(e.target.files[0])
        }
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!fileDesktop) {
            toast.error("Por favor selecciona una imagen de escritorio")
            return
        }

        setIsLoading(true)
        const formData = new FormData()
        formData.append("fileDesktop", fileDesktop)
        if (fileMobile) formData.append("fileMobile", fileMobile)
        if (linkUrl) formData.append("linkUrl", linkUrl)

        const result = await uploadBanner(formData)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Banner subido correctamente")
            setIsOpen(false)
            setFileDesktop(null)
            setFileMobile(null)
            setLinkUrl("")
            // Para una actualización instantánea se podría recargar la lista o dejar que NextJS revalide
            window.location.reload()
        }
        setIsLoading(false)
    }

    const handleDelete = async (id: string, url: string, urlMobile: string | null) => {
        if (!confirm("¿Estás seguro de que deseas eliminar este banner?")) return
        
        setIsLoading(true)
        const result = await deleteBanner(id, url, urlMobile)
        
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Banner eliminado")
            setBanners(banners.filter(b => b.id !== id))
        }
        setIsLoading(false)
    }

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        setIsLoading(true)
        const result = await toggleBannerStatus(id, currentStatus)
        
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Estado actualizado")
            setBanners(banners.map(b => b.id === id ? { ...b, is_active: !currentStatus } : b))
        }
        setIsLoading(false)
    }

    const moveBanner = async (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) || 
            (direction === 'down' && index === banners.length - 1)
        ) return

        const newBanners = [...banners]
        const swapIndex = direction === 'up' ? index - 1 : index + 1
        
        // Swap
        const temp = newBanners[index]
        newBanners[index] = newBanners[swapIndex]
        newBanners[swapIndex] = temp

        setBanners(newBanners)

        // Actualizar en el servidor
        const orderedIds = newBanners.map(b => b.id)
        await updateBannersOrder(orderedIds)
    }

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Gestión de Banners</CardTitle>
                    <CardDescription>
                        Sube imágenes informativas que se mostrarán como un carrusel a los deportistas.
                        Se recomienda usar imágenes horizontales.
                    </CardDescription>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" /> Nuevo Banner
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Subir Nuevo Banner</DialogTitle>
                            <DialogDescription>
                                Selecciona una imagen desde tu dispositivo.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="imageDesktop">Imagen Escritorio (Obligatorio)</Label>
                                <Input
                                    id="imageDesktop"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileDesktopChange}
                                    required
                                />
                                <span className="text-xs text-muted-foreground">Recomendado: 1920x600 o similar.</span>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="imageMobile">Imagen Celular (Opcional)</Label>
                                <Input
                                    id="imageMobile"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileMobileChange}
                                />
                                <span className="text-xs text-muted-foreground">Recomendado: 1080x1080 (cuadrada). Si no se provee, se usará la de escritorio.</span>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="linkUrl">Enlace al hacer click (Opcional)</Label>
                                <Input
                                    id="linkUrl"
                                    type="url"
                                    placeholder="https://ejemplo.com"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                />
                            </div>
                            <Button type="submit" disabled={isLoading || !fileDesktop} className="w-full">
                                {isLoading ? "Subiendo..." : "Subir Banner"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {banners.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        No hay banners subidos actualmente.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {banners.map((banner, index) => (
                            <div key={banner.id} className="flex flex-col sm:flex-row items-center gap-4 p-4 border rounded-lg bg-card">
                                <div className="flex flex-col items-center gap-1">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => moveBanner(index, 'up')}
                                        disabled={index === 0 || isLoading}
                                        className="h-6 w-6"
                                    >
                                        <ArrowUp className="h-4 w-4" />
                                    </Button>
                                    <Badge variant="outline" className="w-6 justify-center">{index + 1}</Badge>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => moveBanner(index, 'down')}
                                        disabled={index === banners.length - 1 || isLoading}
                                        className="h-6 w-6"
                                    >
                                        <ArrowDown className="h-4 w-4" />
                                    </Button>
                                </div>
                                
                                <div className="relative w-full sm:w-64 h-32 flex-shrink-0 bg-muted rounded overflow-hidden">
                                    <Image 
                                        src={banner.image_url} 
                                        alt="Banner" 
                                        fill 
                                        className="object-cover"
                                        unoptimized
                                    />
                                </div>

                                <div className="flex-1 flex flex-col justify-center min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant={banner.is_active ? "default" : "secondary"}>
                                            {banner.is_active ? "Activo" : "Inactivo"}
                                        </Badge>
                                        {banner.image_url_mobile ? (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Responsive</Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Solo Escritorio</Badge>
                                        )}
                                    </div>
                                    {banner.link_url && (
                                        <p className="text-sm text-muted-foreground truncate">
                                            Link: <a href={banner.link_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{banner.link_url}</a>
                                        </p>
                                    )}
                                </div>

                                <div className="flex sm:flex-col gap-2 mt-4 sm:mt-0">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleToggleStatus(banner.id, banner.is_active)}
                                        disabled={isLoading}
                                    >
                                        {banner.is_active ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                                        {banner.is_active ? "Ocultar" : "Mostrar"}
                                    </Button>
                                    <Button 
                                        variant="destructive" 
                                        size="sm"
                                        onClick={() => handleDelete(banner.id, banner.image_url, banner.image_url_mobile)}
                                        disabled={isLoading}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Eliminar
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
