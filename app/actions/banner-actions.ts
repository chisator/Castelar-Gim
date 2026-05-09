"use server"

import { revalidatePath } from "next/cache"
import { createClient as createServerClient } from "@/lib/server"

// Obtener banners activos (público)
export async function getActiveBanners() {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from("informative_images")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (error) {
      console.error("Error fetching active banners:", error)
      return { error: error.message }
    }

    return { success: true, banners: data || [] }
  } catch (error: any) {
    return { error: error.message || "Error al obtener banners" }
  }
}

// Obtener todos los banners (para admin)
export async function getAllBanners() {
  try {
    const supabase = await createServerClient()
    // Verificar si es admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "No autenticado" }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (profile?.role !== "administrador") return { error: "No autorizado" }

    const { data, error } = await supabase
      .from("informative_images")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) {
      console.error("Error fetching all banners:", error)
      return { error: error.message }
    }

    return { success: true, banners: data || [] }
  } catch (error: any) {
    return { error: error.message || "Error al obtener banners" }
  }
}

// Alternar estado activo de un banner
export async function toggleBannerStatus(id: string, currentStatus: boolean) {
  try {
    const supabase = await createServerClient()
    
    // Verificar si es admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "No autenticado" }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (profile?.role !== "administrador") return { error: "No autorizado" }

    const { error } = await supabase
      .from("informative_images")
      .update({ is_active: !currentStatus })
      .eq("id", id)

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/admin/banners")
    revalidatePath("/deportista")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Error al actualizar estado" }
  }
}

// Eliminar banner
export async function deleteBanner(id: string, imageUrl: string, imageMobileUrl?: string | null) {
  try {
    const supabase = await createServerClient()
    
    // Verificar si es admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "No autenticado" }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (profile?.role !== "administrador") return { error: "No autorizado" }

    // Extraer el nombre del archivo de la URL
    // Asume formato: https://[project].supabase.co/storage/v1/object/public/public_images/[filename]
    try {
        const urlObj = new URL(imageUrl)
        const pathSegments = urlObj.pathname.split('/')
        // Buscamos el segmento public_images y tomamos lo que sigue
        const bucketIndex = pathSegments.findIndex(segment => segment === 'public_images')
        if (bucketIndex !== -1 && pathSegments.length > bucketIndex + 1) {
            const fileName = pathSegments.slice(bucketIndex + 1).join('/')
            
            // Eliminar archivo del storage
            const { error: storageError } = await supabase.storage.from("public_images").remove([fileName])
            if (storageError) {
                console.error("Error al eliminar imagen del storage:", storageError)
                // Continuamos para eliminar el registro de base de datos de todos modos
            }
        }
    } catch(e) {
        console.error("No se pudo analizar la URL para eliminar del storage:", e)
    }

    if (imageMobileUrl) {
      try {
          const urlObj = new URL(imageMobileUrl)
          const pathSegments = urlObj.pathname.split('/')
          const bucketIndex = pathSegments.findIndex(segment => segment === 'public_images')
          if (bucketIndex !== -1 && pathSegments.length > bucketIndex + 1) {
              const fileName = pathSegments.slice(bucketIndex + 1).join('/')
              await supabase.storage.from("public_images").remove([fileName])
          }
      } catch(e) {
          console.error("No se pudo analizar la URL mobile para eliminar del storage:", e)
      }
    }

    // Eliminar registro
    const { error } = await supabase
      .from("informative_images")
      .delete()
      .eq("id", id)

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/admin/banners")
    revalidatePath("/deportista")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Error al eliminar banner" }
  }
}

// Reordenar banners
export async function updateBannersOrder(orderedIds: string[]) {
  try {
    const supabase = await createServerClient()
    
    // Verificar si es admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "No autenticado" }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (profile?.role !== "administrador") return { error: "No autorizado" }

    // Actualizar el orden uno por uno (no es lo más eficiente pero es seguro para pocos registros)
    for (let i = 0; i < orderedIds.length; i++) {
        await supabase
            .from("informative_images")
            .update({ display_order: i })
            .eq("id", orderedIds[i])
    }

    revalidatePath("/admin/banners")
    revalidatePath("/deportista")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Error al reordenar banners" }
  }
}

// Obtener una URL prefirmada para subir directo desde el cliente, o subir directo aquí.
// Pero como estamos en un Server Action, recibiremos FormData con el archivo.
export async function uploadBanner(formData: FormData) {
  try {
    const supabase = await createServerClient()
    
    // Verificar si es admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "No autenticado" }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (profile?.role !== "administrador") return { error: "No autorizado" }

    const fileDesktop = formData.get('fileDesktop') as File
    const fileMobile = formData.get('fileMobile') as File | null
    const linkUrl = formData.get('linkUrl') as string || null

    if (!fileDesktop) {
        return { error: "No se proporcionó la imagen de computadora" }
    }

    // Función auxiliar para subir archivos
    const uploadFile = async (file: File) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
            .from('public_images')
            .upload(fileName, file, { cacheControl: '3600', upsert: false })
        if (uploadError) throw new Error(uploadError.message)
        const { data: publicUrlData } = supabase.storage.from('public_images').getPublicUrl(fileName)
        return publicUrlData.publicUrl
    }

    let imageUrl = ''
    let imageMobileUrl = null

    try {
        imageUrl = await uploadFile(fileDesktop)
        if (fileMobile && fileMobile.size > 0) {
            imageMobileUrl = await uploadFile(fileMobile)
        }
    } catch (error: any) {
        return { error: `Error subiendo archivo: ${error.message}` }
    }

    // Obtener el último orden para ponerlo al final
    const { data: maxOrderData } = await supabase
        .from('informative_images')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)

    const nextOrder = maxOrderData && maxOrderData.length > 0 ? (maxOrderData[0].display_order || 0) + 1 : 0

    // Guardar en base de datos
    const { error: dbError } = await supabase
        .from('informative_images')
        .insert({
            image_url: imageUrl,
            image_url_mobile: imageMobileUrl,
            link_url: linkUrl,
            display_order: nextOrder,
            is_active: true
        })

    if (dbError) {
        return { error: `Error guardando en base de datos: ${dbError.message}` }
    }

    revalidatePath("/admin/banners")
    revalidatePath("/deportista")
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Error al crear banner" }
  }
}
