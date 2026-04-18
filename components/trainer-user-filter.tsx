"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface TrainerUserFilterProps {
    athletes: {
        id: string
        full_name: string
    }[]
}

export function TrainerUserFilter({ athletes }: TrainerUserFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentUserId = searchParams.get("userId") || ""

    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState(currentUserId)

    // Sort athletes alphabetically
    const sortedAthletes = React.useMemo(() => {
        return [...athletes].sort((a, b) => a.full_name.localeCompare(b.full_name))
    }, [athletes])

    const onSelect = (currentValue: string) => {
        // If clicking the same value, clear it (toggle off)
        // But for a filter, usually we want to switch. 
        // Let's say if we click "Todos" (which we might need to add manually or handle via empty string)

        const newValue = currentValue === value ? "" : currentValue
        setValue(newValue)
        setOpen(false)

        const params = new URLSearchParams(searchParams.toString())
        if (newValue) {
            params.set("userId", newValue)
        } else {
            params.delete("userId")
        }

        router.push(`/entrenador?${params.toString()}`)
    }

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Filtrar por usuario:</span>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-[250px] justify-between"
                        type="button"
                    >
                        {value
                            ? sortedAthletes.find((athlete) => athlete.id === value)?.full_name
                            : "Todos los usuarios"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0">
                    <Command>
                        <CommandInput placeholder="Buscar usuario..." />
                        <CommandList>
                            <CommandEmpty>No se encontró usuario.</CommandEmpty>
                            <CommandGroup>
                                <CommandItem
                                    value="todos" // Special value for "All"
                                    onSelect={() => onSelect("")}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === "" ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    Todos los usuarios
                                </CommandItem>
                                {sortedAthletes.map((athlete) => (
                                    <CommandItem
                                        key={athlete.id}
                                        value={athlete.full_name.toLowerCase()} // Ensure lowercase for cmdk
                                        onSelect={() => onSelect(athlete.id)}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === athlete.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {athlete.full_name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}
