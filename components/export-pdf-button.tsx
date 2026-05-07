"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { useReactToPrint } from "react-to-print"

interface ExportPdfButtonProps {
  athlete: { full_name: string } | null
  routines: any[]
}

export function ExportPdfButton({ athlete, routines }: ExportPdfButtonProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Rutinas_${athlete?.full_name?.replace(/\s+/g, '_') || 'Deportista'}`,
  })

  const formatDate = (dateString: string) => {
    if (!dateString) return "Sin fecha"
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  if (!athlete || routines.length === 0) return null

  return (
    <>
      <Button 
        onClick={() => handlePrint()} 
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        <Printer className="mr-2 h-4 w-4" />
        Imprimir / Guardar PDF
      </Button>

      {/* Visually hidden but mounted for react-to-print to clone */}
      <div className="hidden">
        <div 
          ref={printRef} 
          className="p-8 bg-white text-black w-[800px] mx-auto"
          style={{ 
            fontFamily: "sans-serif",
            WebkitPrintColorAdjust: "exact", 
            printColorAdjust: "exact" 
          }}
        >
          <style type="text/css">
            {`@page { size: A4 portrait; margin: 10mm; }`}
          </style>

          {/* Header */}
          <div className="flex justify-between items-center border-b-2 border-[#FF6B00] pb-4 mb-6">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-[#0ea5e9]">Castelar Gimnasio</h1>
                <p className="text-lg text-gray-700 mt-1">Plan de Entrenamiento</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold">{athlete.full_name}</p>
              <p className="text-sm text-gray-600">Generado el: {new Date().toLocaleDateString("es-ES")}</p>
            </div>
          </div>

          {/* Routines List */}
          <div className="space-y-8">
            {routines.map((routine, idx) => {
              const exercises = Array.isArray(routine.exercises) ? routine.exercises : []
              return (
                <div key={routine.id || idx} className="mb-8" style={{ pageBreakInside: 'avoid' }}>
                  <div className="border-b-2 border-[#FF6B00] pb-2 mb-4">
                    <h2 className="text-2xl font-bold">{routine.title}</h2>
                    <p className="text-sm text-gray-600">
                      {routine.start_date && routine.end_date
                        ? `${formatDate(routine.start_date)} - ${formatDate(routine.end_date)}`
                        : routine.end_date
                          ? formatDate(routine.end_date)
                          : routine.start_date
                            ? formatDate(routine.start_date)
                            : "Sin fecha"}
                    </p>
                    {routine.description && (
                      <p className="text-sm mt-2 italic text-gray-700">{routine.description}</p>
                    )}
                  </div>

                  {exercises.length > 0 ? (
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-[#FF6B00] text-white">
                          <th className="p-2 border border-gray-300 w-1/4">Ejercicio</th>
                          <th className="p-2 border border-gray-300 w-1/12">Series</th>
                          <th className="p-2 border border-gray-300 w-1/12">Reps</th>
                          <th className="p-2 border border-gray-300 w-1/6">Peso</th>
                          <th className="p-2 border border-gray-300 w-1/6">Descanso</th>
                          <th className="p-2 border border-gray-300 w-1/4">Notas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exercises.map((ex: any, eIdx: number) => (
                          <tr key={eIdx} className="border-b border-gray-200 bg-white">
                            <td className="p-2 border border-gray-300 font-medium text-black">{ex.name}</td>
                            <td className="p-2 border border-gray-300 text-black">{ex.sets || "-"}</td>
                            <td className="p-2 border border-gray-300 text-black">{ex.reps || "-"}</td>
                            <td className="p-2 border border-gray-300 text-black">{ex.weight ? `${ex.weight}${!ex.weight.toLowerCase().includes('kg') ? ' kg' : ''}` : "-"}</td>
                            <td className="p-2 border border-gray-300 text-black">{ex.duration || "-"}</td>
                            <td className="p-2 border border-gray-300 text-xs italic text-black">{ex.notes || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-sm text-gray-500">No hay ejercicios detallados en esta rutina.</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
