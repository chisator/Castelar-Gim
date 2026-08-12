"use client"

import { Reorder, useDragControls } from "framer-motion"
import { GripVertical, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ReorderableCardProps {
  value: unknown
  index: number
  total: number
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
  onRemove: (index: number) => void
  title: React.ReactNode
  isMarker?: boolean
  markerColor?: string
  children: React.ReactNode
}

export function ReorderableCard({
  value,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
  title,
  isMarker,
  markerColor,
  children,
}: ReorderableCardProps) {
  const controls = useDragControls()

  return (
    <Reorder.Item
      value={value}
      dragListener={false}
      dragControls={controls}
      className={cn(
        "relative rounded-lg list-none",
        isMarker ? "p-4 space-y-3 border-2" : "border rounded-lg p-4 space-y-4"
      )}
      style={isMarker ? { backgroundColor: markerColor, borderColor: markerColor, opacity: 0.9 } : undefined}
    >
      <div className="flex items-center gap-1">
        <div
          onPointerDown={(e) => controls.start(e)}
          className={cn(
            "cursor-grab active:cursor-grabbing touch-none p-1.5 rounded transition-colors shrink-0",
            isMarker ? "hover:bg-white/20" : "hover:bg-muted/50"
          )}
          title="Arrastrar para reordenar"
        >
          <GripVertical className={cn("h-4 w-4 sm:h-5 sm:w-5", isMarker ? "text-white/70" : "text-muted-foreground")} />
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn("h-7 w-7 p-0 shrink-0", isMarker && "text-white hover:text-white hover:bg-white/20")}
          onClick={() => onMoveUp(index)}
          disabled={index === 0}
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn("h-7 w-7 p-0 shrink-0", isMarker && "text-white hover:text-white hover:bg-white/20")}
          onClick={() => onMoveDown(index)}
          disabled={index === total - 1}
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </Button>

        <div className="flex-1 min-w-0" />

        <h4 className={cn("font-semibold truncate", isMarker && "text-white")}>{title}</h4>

        <div className="flex-1 min-w-0" />

        {total > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            className={cn(isMarker && "text-white hover:text-white hover:bg-white/20")}
          >
            Eliminar
          </Button>
        )}
      </div>

      {children}
    </Reorder.Item>
  )
}
