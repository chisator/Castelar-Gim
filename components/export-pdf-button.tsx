"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface ExportPdfButtonProps {
  athlete: { full_name: string } | null
  routines: any[]
}

export function ExportPdfButton({ athlete, routines }: ExportPdfButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const handleExport = async () => {
    if (!printRef.current) return
    setIsExporting(true)

    try {
      // Import html2pdf dynamically to avoid SSR issues
      const html2pdf = (await import("html2pdf.js")).default
      
      const element = printRef.current
      const opt = {
        margin:       10,
        filename:     `Rutinas_${athlete?.full_name?.replace(/\s+/g, '_') || 'Deportista'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }

      await html2pdf().set(opt).from(element).save()
    } catch (error) {
      console.error("Error generating PDF", error)
    } finally {
      setIsExporting(false)
    }
  }

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
        onClick={handleExport} 
        disabled={isExporting}
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        <Download className="mr-2 h-4 w-4" />
        {isExporting ? "Generando PDF..." : "Exportar PDF"}
      </Button>

      {/* Hidden container for PDF rendering */}
      <div className="absolute left-[-9999px] top-0 overflow-hidden">
        <div 
          ref={printRef} 
          className="bg-[#FFF3C4] text-black w-[800px] p-8"
          style={{ fontFamily: "sans-serif" }}
        >
          {/* Header */}
          <div className="flex justify-between items-center border-b-2 border-[#FF6B00] pb-4 mb-6">
            <div className="flex items-center gap-4">
              {/* Fallback to simple text if logo doesn't load well in canvas */}
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
                <div key={routine.id || idx} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200" style={{ pageBreakInside: 'avoid' }}>
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
                          <tr key={eIdx} className="border-b border-gray-200">
                            <td className="p-2 border border-gray-300 font-medium">{ex.name}</td>
                            <td className="p-2 border border-gray-300">{ex.sets || "-"}</td>
                            <td className="p-2 border border-gray-300">{ex.reps || "-"}</td>
                            <td className="p-2 border border-gray-300">{ex.weight ? `${ex.weight}${!ex.weight.toLowerCase().includes('kg') ? ' kg' : ''}` : "-"}</td>
                            <td className="p-2 border border-gray-300">{ex.duration || "-"}</td>
                            <td className="p-2 border border-gray-300 text-xs italic">{ex.notes || "-"}</td>
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
