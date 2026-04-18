"use client"

import { useState } from "react"
import { ExportImportDialog } from "@/components/export-import-dialog"

export function ExportImportWrapper() {
  const [isOpen, setIsOpen] = useState(false)

  return <ExportImportDialog isOpen={isOpen} onOpenChange={setIsOpen} />
}
