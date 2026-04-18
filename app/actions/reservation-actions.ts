'use server'

import { createClient } from "@/lib/server"
import { revalidatePath } from "next/cache"

// Helper to check and renew credits
async function checkAndRenewCredits(userId: string, supabase: any) {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('activity_credits, expiring_activity_credits, last_renewal_date, last_expiration_date')
            .eq('id', userId)
            .single()

        if (error || !profile) return

        const now = new Date()
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const currentMonthSixth = new Date(now.getFullYear(), now.getMonth(), 6)

        let updates: any = {}
        let currentCredits = profile.activity_credits || {}
        let expiringCredits = profile.expiring_activity_credits || {}

        // 1. Renewal Logic (1st of Month) -> Move tickets to Expiring
        const lastRenewal = new Date(profile.last_renewal_date || '2000-01-01')
        if (lastRenewal < currentMonthStart) {
            // El día 1, todo pasa al bolsillo de "por vencer" y el principal queda en 0.
            expiringCredits = { ...currentCredits }
            currentCredits = {}

            updates.last_renewal_date = now.toISOString()
            updates.activity_credits = currentCredits
            updates.expiring_activity_credits = expiringCredits
        }

        // 2. Expiration Logic (6th of Month) -> Wipe out Expiring
        const lastExpiration = new Date(profile.last_expiration_date || '2000-01-01')
        // Si ya pasamos el 6, y la última expiración fue ANTES del inicio de mes...
        if (now >= currentMonthSixth && lastExpiration < currentMonthStart && updates.expiring_activity_credits === undefined) {
            
            expiringCredits = {}
            updates.last_expiration_date = now.toISOString()
            updates.expiring_activity_credits = expiringCredits
        }

        if (Object.keys(updates).length > 0) {
            await supabase.from('profiles').update(updates).eq('id', userId)
        }

    } catch (e) {
        console.error("Error in auto-renewal:", e)
    }
}

export async function reserveClass(classId: string, userId: string) {
    const supabase = await createClient()

    try {
        // Run auto-renewal/expiration check first
        await checkAndRenewCredits(userId, supabase)

        // 1. Get user profile and check credits
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('activity_credits, expiring_activity_credits')
            .eq('id', userId)
            .single()

        if (profileError || !profile) {
            return { error: "Usuario no encontrado" }
        }

        // 2. Get class details to check title, date and past status
        const { data: classData, error: classError } = await supabase
            .from('gym_classes')
            .select('title, start_time, capacity')
            .eq('id', classId)
            .single()

        if (classError || !classData) {
            return { error: "Clase no encontrada" }
        }

        // Validate tickets for this specific class BEFORE moving forward
        const activityTitle = classData.title;
        let currentCredits = profile.activity_credits || {};
        let expiringCredits = profile.expiring_activity_credits || {};
        
        let c = currentCredits[activityTitle] || 0;
        let e = expiringCredits[activityTitle] || 0;

        if (c <= 0 && e <= 0) {
            return { error: `No tienes tickets suficientes para ${activityTitle}` }
        }

        const classDate = new Date(classData.start_time)
        const now = new Date()

        if (classDate < now) {
            return { error: "No puedes reservar una clase que ya ha pasado" }
        }

        // 3. Check Capacity
        const capacity = classData.capacity || 20 // Default fallback

        const { count: enrolledCount, error: enrollError } = await supabase
            .from('reservations')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', classId)

        if (enrollError) {
            return { error: "Error al verificar cupos de la clase" }
        }

        if (enrolledCount !== null && enrolledCount >= capacity) {
            return { error: "La clase ya está llena. No quedan cupos disponibles." }
        }

        // 4. Check existing reservation
        const { data: existing } = await supabase
            .from('reservations')
            .select('id')
            .eq('user_id', userId)
            .eq('class_id', classId)
            .single()

        if (existing) {
            return { error: "Ya estás registrado en esta clase" }
        }

        // 4. Check daily limit (Max 2 per day)
        // We need to count reservations for this user on the same day as the target class
        const startOfDay = new Date(classDate)
        startOfDay.setHours(0, 0, 0, 0)

        const endOfDay = new Date(classDate)
        endOfDay.setHours(23, 59, 59, 999)

        const { count, error: countError } = await supabase
            .from('reservations')
            .select('gym_classes!inner(start_time)', { count: 'exact', head: true }) // head: true returns count only
            .eq('user_id', userId)
            .gte('gym_classes.start_time', startOfDay.toISOString())
            .lte('gym_classes.start_time', endOfDay.toISOString())

        if (countError) {
            console.error("Error checking limits:", countError)
            return { error: "Error al verificar límites de reserva" }
        }

        if (count !== null && count >= 2) {
            return { error: "No puedes reservar más de 2 clases por día" }
        }

        // 5. Create reservation and deduct credit
        const { error: insertError } = await supabase
            .from('reservations')
            .insert({
                user_id: userId,
                class_id: classId
            })

        if (insertError) {
            console.error("Error creating reservation:", insertError)
            return { error: "Error al crear la reserva" }
        }

        // Credit Deduction Logic: Use expiring first
        if (e > 0) {
            expiringCredits[activityTitle] = e - 1;
        } else {
            currentCredits[activityTitle] = c - 1;
        }

        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                activity_credits: currentCredits,
                expiring_activity_credits: expiringCredits
            })
            .eq('id', userId)

        if (updateError) {
            // Rollback reservation if credit update fails
            await supabase.from('reservations').delete().eq('user_id', userId).eq('class_id', classId)
            return { error: "Error al descontar el ticket del perfil" }
        }

        revalidatePath('/deportista')
        return { success: true }

    } catch (error) {
        console.error("Unexpected error in reserveClass:", error)
        return { error: "Ocurrió un error inesperado" }
    }
}

export async function cancelReservation(classId: string, userId: string) {
    const supabase = await createClient()

    try {
        // Run auto-renewal check
        await checkAndRenewCredits(userId, supabase)

        // 1. Check if reservation exists
        const { data: existing, error: reservationError } = await supabase
            .from('reservations')
            .select('id')
            .eq('user_id', userId)
            .eq('class_id', classId)
            .single()

        if (!existing) {
            return { error: "No tienes una reserva para esta clase" }
        }

        // 2. Delete reservation and refund credit
        const { error: deleteError } = await supabase
            .from('reservations')
            .delete()
            .eq('user_id', userId)
            .eq('class_id', classId)

        if (deleteError) {
            return { error: "Error al cancelar la reserva" }
        }

        // Refund logic: Add back to current activity_credits
        const { data: profile } = await supabase
            .from('profiles')
            .select('activity_credits')
            .eq('id', userId)
            .single()
            
        const { data: classData } = await supabase
            .from('gym_classes')
            .select('title')
            .eq('id', classId)
            .single()

        if (profile && classData) {
            const currentCredits = profile.activity_credits || {};
            const title = classData.title;
            currentCredits[title] = (currentCredits[title] || 0) + 1;

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ activity_credits: currentCredits })
                .eq('id', userId)
        }

        revalidatePath('/deportista')
        return { success: true }

    } catch (error) {
        console.error("Unexpected error in cancelReservation:", error)
        return { error: "Ocurrió un error inesperado" }
    }
}


export async function getUserReservations(userId: string) {
    const supabase = await createClient()

    // Check renewal on read too, so UI is accurate
    await checkAndRenewCredits(userId, supabase)

    const { data, error } = await supabase
        .from('reservations')
        .select('class_id')
        .eq('user_id', userId)

    if (error) return []
    return data.map(r => r.class_id)
}
