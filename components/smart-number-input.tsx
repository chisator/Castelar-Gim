"use client"

import * as React from "react"
import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SmartNumberInputProps {
    value: string | number
    onChange: (value: string) => void
    min?: number
    max?: number
    step?: number
    suggestions?: number[]
    placeholder?: string
    label?: string // Optional label for suggestions like "Recomendados:"
    className?: string
}

export function SmartNumberInput({
    value,
    onChange,
    min = 0,
    max = 999,
    step = 1,
    suggestions = [],
    placeholder = "0",
    label,
    className,
}: SmartNumberInputProps) {

    const handleIncrement = () => {
        const currentVal = value === "" ? 0 : Number(value)
        if (isNaN(currentVal)) {
            onChange(String(min + step))
            return
        }
        const newVal = currentVal + step
        if (newVal <= max) {
            onChange(String(newVal))
        }
    }

    const handleDecrement = () => {
        const currentVal = value === "" ? 0 : Number(value)
        if (isNaN(currentVal)) {
            onChange(String(min))
            return
        }
        const newVal = currentVal - step
        if (newVal >= min) {
            onChange(String(newVal))
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Solo permitir números en el input directo
        const val = e.target.value
        if (val === "" || /^\d+$/.test(val)) {
            onChange(val)
        }
    }

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <div className="flex items-center">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-r-none"
                    onClick={handleDecrement}
                    tabIndex={-1} // Evitar foco al navegar con tab
                >
                    <Minus className="h-4 w-4" />
                </Button>
                <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={value}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    className="h-10 flex-1 rounded-none text-center focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-l-none"
                    onClick={handleIncrement}
                    tabIndex={-1}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1 items-center">
                    {label && <span className="text-xs text-muted-foreground mr-1">{label}</span>}
                    {suggestions.map((sug) => (
                        <Button
                            key={sug}
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => onChange(String(sug))}
                        >
                            {sug}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    )
}
