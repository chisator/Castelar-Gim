"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format, startOfWeek, endOfWeek, addDays, isPast } from "date-fns"
import { es } from "date-fns/locale"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    CarouselDots,
} from "@/components/ui/carousel"
import { Badge } from "@/components/ui/badge"
import { Clock, Users } from "lucide-react"
import { toast } from "sonner"

type WeeklySchedule = {
    day: string
    time: string
    instructor: string
    isCancelled?: boolean
    id: string
    isReserved?: boolean
    start_time: string
}

type ActivityType = {
    title: string
    schedules: WeeklySchedule[]
}

const DAYS_ORDER = {
    "lunes": 1,
    "martes": 2,
    "miércoles": 3,
    "jueves": 4,
    "viernes": 5,
    "sábado": 6,
    "domingo": 7
}

export function ActivitiesCarousel() {
    const [activities, setActivities] = useState<ActivityType[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [weekRange, setWeekRange] = useState("")
    const [userReservations, setUserReservations] = useState<string[]>([])
    const [reservationCounts, setReservationCounts] = useState<Record<string, number>>({})
    const [activityCredits, setActivityCredits] = useState<Record<string, number>>({})
    const [expiringCredits, setExpiringCredits] = useState<Record<string, number>>({})
    const [userId, setUserId] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchEvents()
    }, [])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('syncTickets', { 
                detail: { activityCredits, expiringCredits } 
            }))
        }
    }, [activityCredits, expiringCredits])

    const fetchEvents = async () => {
        setIsLoading(true)
        try {
            const now = new Date()
            let targetDate = now
            if (now.getDay() === 0) {
                targetDate = addDays(now, 1)
            }

            const start = startOfWeek(targetDate, { weekStartsOn: 1 })
            const end = endOfWeek(targetDate, { weekStartsOn: 1 })

            setWeekRange(`Semana del ${format(start, "d 'de' MMMM", { locale: es })} `)

            const { data, error } = await supabase
                .from('gym_classes')
                .select('*, profiles(full_name)')
                .gte('start_time', start.toISOString())
                .lte('start_time', end.toISOString())
                .order('start_time', { ascending: true })

            if (error) throw error

            const rawEvents = data || []
            const activitiesMap = new Map<string, ActivityType>()
            const classIds: string[] = []

            rawEvents.forEach(event => {
                classIds.push(event.id)
                const title = event.title
                const dateObj = new Date(event.start_time)
                const dayName = format(dateObj, "EEEE", { locale: es }).toLowerCase()
                const timeStr = format(dateObj, "HH:mm")
                const instructor = event.profiles?.full_name || 'Sin asignar'

                if (!activitiesMap.has(title)) {
                    activitiesMap.set(title, { title, schedules: [] })
                }

                const activity = activitiesMap.get(title)!

                const exists = activity.schedules.some(s => s.day === dayName && s.time === timeStr)
                if (!exists) {
                    activity.schedules.push({
                        day: dayName,
                        time: timeStr,
                        instructor,
                        isCancelled: event.is_cancelled,
                        id: event.id,
                        start_time: event.start_time
                    })
                }
            })

            const sortedActivities = Array.from(activitiesMap.values()).map(act => {
                act.schedules.sort((a, b) => {
                    const dayA = DAYS_ORDER[a.day as keyof typeof DAYS_ORDER] || 0
                    const dayB = DAYS_ORDER[b.day as keyof typeof DAYS_ORDER] || 0
                    if (dayA !== dayB) return dayA - dayB
                    return a.time.localeCompare(b.time)
                })
                return act
            })

            sortedActivities.sort((a, b) => a.title.localeCompare(b.title))
            setActivities(sortedActivities)

            // Fetch reservation counts
            if (classIds.length > 0) {
                const { data: allReservations } = await supabase
                    .from('reservations')
                    .select('class_id')
                    .in('class_id', classIds)

                if (allReservations) {
                    const counts: Record<string, number> = {}
                    allReservations.forEach(r => {
                        counts[r.class_id] = (counts[r.class_id] || 0) + 1
                    })
                    setReservationCounts(counts)
                }
            }

            // Fetch user data for reservation status
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserId(user.id)
                const { data: profile } = await supabase.from('profiles').select('activity_credits, expiring_activity_credits').eq('id', user.id).single()
                if (profile) {
                    setActivityCredits(profile.activity_credits || {})
                    setExpiringCredits(profile.expiring_activity_credits || {})
                }

                const { data: reservations } = await supabase.from('reservations').select('class_id').eq('user_id', user.id)
                if (reservations) setUserReservations(reservations.map(r => r.class_id))
            }

        } catch (error) {
            console.error('Error fetching events:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleReserve = async (classId: string, activityTitle: string, classTime: string) => {
        if (!userId) return

        const currentCredits = activityCredits[activityTitle] || 0
        const expiring = expiringCredits[activityTitle] || 0
        const totalCredits = currentCredits + expiring

        if (totalCredits <= 0) {
            toast.error(`No tienes tickets para ${activityTitle}`, {
                description: "Por favor, solicita tickets en administración.",
            })
            return
        }

        // Optimistic update
        setUserReservations(prev => [...prev, classId])
        if (expiring > 0) {
            setExpiringCredits(prev => ({ ...prev, [activityTitle]: expiring - 1 }))
        } else {
            setActivityCredits(prev => ({ ...prev, [activityTitle]: currentCredits - 1 }))
        }
        setReservationCounts(prev => ({ ...prev, [classId]: (prev[classId] || 0) + 1 }))

        toast.success(`Clase de ${activityTitle} reservada`, {
            description: `Te esperamos a las ${classTime} hs.`,
        })

        const { reserveClass } = await import('@/app/actions/reservation-actions')
        const result = await reserveClass(classId, userId)

        if (result?.error) {
            // Rollback
            setUserReservations(prev => prev.filter(id => id !== classId))
            if (expiring > 0) {
                setExpiringCredits(prev => ({ ...prev, [activityTitle]: expiring }))
            } else {
                setActivityCredits(prev => ({ ...prev, [activityTitle]: currentCredits }))
            }
            setReservationCounts(prev => ({ ...prev, [classId]: (prev[classId] || 0) - 1 }))
            toast.error("Error al reservar", {
                description: result.error,
            })
        }
    }

    const handleCancelReservation = async (classId: string, activityTitle: string, classTime: string) => {
        if (!userId) return

        if (!confirm("¿Deseas cancelar esta reserva?")) return

        const currentCredits = activityCredits[activityTitle] || 0

        // Optimistic update
        setUserReservations(prev => prev.filter(id => id !== classId))
        setActivityCredits(prev => ({ ...prev, [activityTitle]: currentCredits + 1 }))
        setReservationCounts(prev => ({ ...prev, [classId]: Math.max((prev[classId] || 0) - 1, 0) }))

        toast.info("Reserva cancelada", {
            description: `Has cancelado tu lugar en ${activityTitle} a las ${classTime}.`
        })

        const { cancelReservation } = await import('@/app/actions/reservation-actions')
        const result = await cancelReservation(classId, userId)

        if (result?.error) {
            // Rollback
            setUserReservations(prev => [...prev, classId])
            setActivityCredits(prev => ({ ...prev, [activityTitle]: currentCredits }))
            setReservationCounts(prev => ({ ...prev, [classId]: (prev[classId] || 0) + 1 }))
            toast.error("Error al cancelar", { description: result.error })
        }
    }

    if (isLoading) {
        return <div className="text-center py-10 text-muted-foreground w-full">Cargando actividades...</div>
    }

    if (activities.length === 0) {
        return <div className="text-center py-8 text-muted-foreground w-full">No hay actividades programadas para esta semana.</div>
    }

    return (
        <div className="w-full py-4">
            <h3 className="hidden md:block text-center text-muted-foreground text-sm mb-4 uppercase tracking-widest">Mis Tickets de Clase</h3>
            <div className="hidden md:flex flex-wrap justify-center gap-4 mb-8 max-w-[1400px] mx-auto">
                {Object.keys(activityCredits).length > 0 ? Object.keys(activityCredits).map((activity) => {
                    const current = activityCredits[activity] || 0;
                    const expiring = expiringCredits[activity] || 0;
                    const total = current + expiring;
                    return (
                        <Card key={activity} className="min-w-[140px] bg-background/50 border shadow-sm">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <span className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">{activity}</span>
                                <span className="text-3xl font-black">{total}</span>
                                {expiring > 0 && <span className="text-[10px] text-orange-500 font-bold mt-1 px-2 py-0.5 bg-orange-500/10 rounded-full">{expiring} por vencer</span>}
                            </CardContent>
                        </Card>
                    )
                }) : (
                    <div className="text-sm text-muted-foreground">No tienes tickets asignados.</div>
                )}
            </div>

            <h3 className="text-center text-muted-foreground text-sm mb-4 uppercase tracking-widest">{weekRange}</h3>
            <Carousel
                className="w-full max-w-[1400px] mx-auto"
                opts={{
                    align: "center",
                    loop: true,
                }}
            >
                <CarouselContent className="-ml-4">
                    {activities.map((activity, index) => (
                        <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                            <div className="p-1 h-full">
                                <Card className={`h-[280px] flex flex-col border-0 shadow-lg overflow-hidden relative group cursor-pointer transition-all hover:scale-[1.01]
                                    ${index % 6 === 0 ? "bg-gradient-to-br from-blue-600 to-violet-600" :
                                        index % 6 === 1 ? "bg-gradient-to-br from-emerald-500 to-teal-600" :
                                            index % 6 === 2 ? "bg-gradient-to-br from-orange-500 to-red-600" :
                                                index % 6 === 3 ? "bg-gradient-to-br from-pink-500 to-rose-600" :
                                                    index % 6 === 4 ? "bg-gradient-to-br from-indigo-500 to-purple-600" :
                                                        "bg-gradient-to-br from-cyan-500 to-blue-600"
                                    } text-white`
                                }>
                                    <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/2 -translate-y-1/2">
                                        <Clock className="w-48 h-48" />
                                    </div>

                                    <CardHeader className="relative z-10 pb-2">
                                        <CardTitle className="text-2xl font-bold tracking-tight text-white/95 truncate" title={activity.title}>
                                            {activity.title}
                                        </CardTitle>
                                        {activity.schedules.some(s => s.isCancelled) && (
                                            <div className="flex flex-col gap-1 mt-1">
                                                {activity.schedules.filter(s => s.isCancelled).map((s, i) => (
                                                    <p key={i} className="text-[10px] leading-tight font-bold text-red-200 bg-red-900/40 px-1.5 py-0.5 rounded w-fit border border-red-500/30">
                                                        ⚠️ Clase de las {s.time} ({s.day}) suspendida
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </CardHeader>

                                    <CardContent className="relative z-10 flex-1 overflow-auto pt-2 scrollbar-none">
                                        <div className="space-y-3">
                                            {(() => {
                                                const groupedByDay = activity.schedules.reduce((acc, curr) => {
                                                    if (!acc[curr.day]) {
                                                        acc[curr.day] = []
                                                    }
                                                    acc[curr.day].push(curr)
                                                    return acc
                                                }, {} as Record<string, typeof activity.schedules>)

                                                const sortedDays = Object.keys(groupedByDay).sort((a, b) => {
                                                    return (DAYS_ORDER[a as keyof typeof DAYS_ORDER] || 0) - (DAYS_ORDER[b as keyof typeof DAYS_ORDER] || 0)
                                                })

                                                return sortedDays.map((day) => (
                                                    <div key={day} className="flex items-start justify-between border-b border-white/20 pb-2 last:border-0 last:pb-0 text-sm font-medium">
                                                        <div className="flex flex-col gap-1 w-full">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Badge variant="secondary" className="bg-white/20 text-white border-0 capitalize w-24 justify-center backdrop-blur-sm shadow-sm">
                                                                    {day}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2 pl-1">
                                                                {groupedByDay[day].sort((a, b) => a.time.localeCompare(b.time)).map((slot, sIdx) => {
                                                                    const isSlotPast = isPast(new Date(slot.start_time));
                                                                    const count = reservationCounts[slot.id] || 0;

                                                                    return (
                                                                        <div
                                                                            key={sIdx}
                                                                            className={`flex items-center rounded px-2 py-0.5 text-xs transition-colors cursor-pointer relative group/slot
                                                                            ${slot.isCancelled
                                                                                    ? "bg-red-500/20 text-white/50 line-through decoration-white/40 cursor-not-allowed"
                                                                                    : isSlotPast
                                                                                        ? "bg-gray-500/40 text-white/60 cursor-not-allowed"
                                                                                        : userReservations.includes(slot.id)
                                                                                            ? "bg-green-500 text-white hover:bg-green-600"
                                                                                            : "bg-white/10 text-white/90 hover:bg-white/20"
                                                                                }`}
                                                                            title={slot.isCancelled ? "Clase suspendida" : isSlotPast ? "Clase finalizada" : userReservations.includes(slot.id) ? "Reservado (Click para cancelar)" : `Instructor: ${slot.instructor} - Click para reservar`}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                if (slot.isCancelled || isSlotPast) return
                                                                                if (userReservations.includes(slot.id)) {
                                                                                    handleCancelReservation(slot.id, activity.title, slot.time)
                                                                                } else {
                                                                                    handleReserve(slot.id, activity.title, slot.time)
                                                                                }
                                                                            }}
                                                                        >
                                                                            <Clock className={`w-3 h-3 mr-1 ${slot.isCancelled || isSlotPast ? "opacity-40" : "opacity-70"}`} />
                                                                            {slot.time}
                                                                            {slot.isCancelled && <span className="no-underline ml-1 text-[10px] opacity-70">(Susp.)</span>}
                                                                            {userReservations.includes(slot.id) && <span className="ml-1 text-[10px]">✓</span>}
                                                                            {!slot.isCancelled && !isSlotPast && (
                                                                                <span className="flex items-center ml-1.5 pl-1.5 border-l border-white/20 text-[10px] opacity-70">
                                                                                    <Users className="w-2.5 h-2.5 mr-0.5" />
                                                                                    {count}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            })()}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <div className="hidden md:block">
                    <CarouselPrevious className="left-4 bg-white/20 border-0 text-white hover:bg-white/40" />
                    <CarouselNext className="right-4 bg-white/20 border-0 text-white hover:bg-white/40" />
                </div>
                <CarouselDots className="mt-6" />
            </Carousel>
        </div>
    )
}
