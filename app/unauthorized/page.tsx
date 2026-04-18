import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Acceso Denegado</CardTitle>
          <CardDescription>No tienes permisos para acceder a esta página</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Tu rol de usuario no tiene los permisos necesarios para ver este contenido. Por favor, contacta al
              administrador si crees que esto es un error.
            </p>
            <Button asChild>
              <Link href="/">Volver al inicio</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
