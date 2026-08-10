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

interface TrainerCreatorFilterProps {
    trainers: {
        id: string
        full_name: string
    }[]
}

export function TrainerCreatorFilter({ trainers }: TrainerCreatorFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentCreatedBy = searchParams.get("createdBy") || ""

    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState(currentCreatedBy)

    // Sort trainers alphabetically
    const sortedTrainers = React.useMemo(() => {
        return [...trainers].sort((a, b) => a.full_name.localeCompare(b.full_name))
    }, [trainers])

    const onSelect = (currentValue: string) => {
        const newValue = currentValue === value ? "" : currentValue
        setValue(newValue)
        setOpen(false)

        const params = new URLSearchParams(searchParams.toString())
        if (newValue) {
            params.set("createdBy", newValue)
        } else {
            params.delete("createdBy")
        }

        router.push(`/entrenador?${params.toString()}`)
    }

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Creado por:</span>
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
                            ? sortedTrainers.find((trainer) => trainer.id === value)?.full_name
                            : "Todos los entrenadores"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0">
                    <Command>
                        <CommandInput placeholder="Buscar entrenador..." />
                        <CommandList>
                            <CommandEmpty>No se encontró entrenador.</CommandEmpty>
                            <CommandGroup>
                                <CommandItem
                                    value="todos"
                                    onSelect={() => onSelect("")}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === "" ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    Todos los entrenadores
                                </CommandItem>
                                {sortedTrainers.map((trainer) => (
                                    <CommandItem
                                        key={trainer.id}
                                        value={trainer.full_name.toLowerCase()}
                                        onSelect={() => onSelect(trainer.id)}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === trainer.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {trainer.full_name}
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
