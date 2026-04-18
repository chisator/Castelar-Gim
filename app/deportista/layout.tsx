import { WorkoutTimer } from "@/components/workout-timer"

export default function DeportistaLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            {children}
            <WorkoutTimer />
        </>
    )
}
