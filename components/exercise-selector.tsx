"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

export interface ExerciseCatalogItem {
    id: string
    name: string
    video_url?: string | null
}

interface ExerciseSelectorProps {
    value: string
    onChange: (value: string) => void
    onSelectCatalogItem?: (item: ExerciseCatalogItem) => void
    catalog: ExerciseCatalogItem[]
}

export function ExerciseSelector({ value, onChange, onSelectCatalogItem, catalog }: ExerciseSelectorProps) {
    const [open, setOpen] = React.useState(false)

    // Normalizar el valor actual para comparación
    const normalizedValue = value.trim().toLowerCase()

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal text-left"
                >
                    {value ? value : "Seleccionar o escribir ejercicio..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Buscar ejercicio..." />
                    <CommandList>
                        <CommandEmpty>
                            <div className="p-2 text-sm text-center">
                                <p className="text-muted-foreground mb-2">No encontrado en el catálogo.</p>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => {
                                        // Since CommandInput takes focus, we can't easily get the typed value here directly without controlled input in Command.
                                        // But usually shadcn Command keeps internal state.
                                        // WORKAROUND: Ask user to type in the main input if they want custom.
                                        // OR, improved approach:
                                        // We can detect if the input value matches nothing, we are here.

                                        // To keep it simple and robust for "Creatable":
                                        // The Command component is tricky for "Create" without controlled state on search.
                                        // We will simply instruct the user or allow selection of "Use current search" if we can access it.
                                        // Given constraints, better UX might be: Just type in the input box to filter. 
                                        // If you click outside or press enter on a non-match, we might not capture it easily with standard shadcn.

                                        // Let's rely on the parent input for "custom" typing if this is complex? 
                                        // No, the user wants autocomplete.

                                        // Alternative: If I type "New Ex", and it's not in list, I want "New Ex".
                                        // Standard shadcn combobox forces selection.
                                        // Let's modify:
                                        // We will use a custom approach: Input + List below.
                                        // But for now, let's try to stick to Popover.
                                    }}
                                >
                                    Escribe arriba para crear
                                </Button>
                            </div>
                        </CommandEmpty>
                        <CommandGroup>
                            {catalog.map((item) => (
                                <CommandItem
                                    key={item.id}
                                    value={item.name}
                                    onSelect={(currentValue) => {
                                        // currentValue is the value prop of CommandItem (lowercased by cmkd)
                                        // We want the original name or the item name
                                        onChange(item.name)
                                        if (onSelectCatalogItem) {
                                            onSelectCatalogItem(item)
                                        }
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            normalizedValue === item.name.toLowerCase() ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {item.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>

                        {/* 
              Allow picking what user typed if not in list? 
              Actually, the CommandInput value is hard to retrieve here without controlling search.
              
              BETTER SOLUTION:
              Use a standard Input that opens a suggestion list on focus/change.
              Like a datalist, but styled.
            */}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

// Improved version: Input with Suggestions (Autosuggest)
// This is better for "Creatable" scenarios than a strict Select/Combobox
export function ExerciseAutosuggest({ value, onChange, onSelectCatalogItem, catalog }: ExerciseSelectorProps) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState(value)

    // Update local input if parent updates value
    React.useEffect(() => {
        setInputValue(value)
    }, [value])

    const filtered = catalog.filter(item =>
        item.name.toLowerCase().includes(inputValue.toLowerCase()) &&
        item.name.toLowerCase() !== inputValue.toLowerCase() // Don't show if exact match already typed? Or show for confirmation?
    ).slice(0, 10) // Limit to 10 suggestions

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        setInputValue(newValue)
        onChange(newValue)
        setOpen(true)
    }

    const handleSelect = (item: ExerciseCatalogItem) => {
        setInputValue(item.name)
        onChange(item.name)
        if (onSelectCatalogItem) {
            onSelectCatalogItem(item)
        }
        setOpen(false)
    }

    return (
        <div className="relative w-full">
            <div className="relative">
                <Input
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => setOpen(true)}
                    onBlur={() => {
                        // Delay closing to allow click
                        setTimeout(() => setOpen(false), 200)
                    }}
                    placeholder="Escribe para buscar o crear..."
                    className="w-full"
                    autoComplete="off"
                />
                {/* Visual indicator that it's a searchable field */}
                {inputValue && filtered.length > 0 && <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">{filtered.length} sugerencias</span>}
            </div>

            {open && filtered.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-popover text-popover-foreground rounded-md border shadow-md">
                    <ul className="py-1">
                        {filtered.map((item) => (
                            <li
                                key={item.id}
                                className="px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground flex items-center justify-between"
                                onMouseDown={(e) => {
                                    e.preventDefault() // Prevent blur
                                    handleSelect(item)
                                }}
                            >
                                <span>{item.name}</span>
                                {item.video_url && <span className="text-xs text-muted-foreground ml-2">(Video)</span>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
