"use client"

import * as React from "react"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"

interface ConfirmationOptions {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "destructive"
}

interface ConfirmationContextValue {
  confirm: (options: ConfirmationOptions) => Promise<boolean>
}

const ConfirmationContext = React.createContext<ConfirmationContextValue | null>(null)

export function ConfirmationProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [options, setOptions] = React.useState<ConfirmationOptions | null>(null)
  const resolveRef = React.useRef<((value: boolean) => void) | null>(null)

  const confirm = React.useCallback((confirmOptions: ConfirmationOptions): Promise<boolean> => {
    setOptions(confirmOptions)
    setIsOpen(true)

    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  const handleConfirm = React.useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current(true)
      resolveRef.current = null
    }
    setIsOpen(false)
  }, [])

  const handleCancel = React.useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current(false)
      resolveRef.current = null
    }
    setIsOpen(false)
  }, [])

  const handleOpenChange = React.useCallback((open: boolean) => {
    if (!open) {
      handleCancel()
    }
  }, [handleCancel])

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      {options && (
        <ConfirmationDialog
          open={isOpen}
          onOpenChange={handleOpenChange}
          title={options.title}
          description={options.description}
          confirmLabel={options.confirmLabel}
          cancelLabel={options.cancelLabel}
          variant={options.variant}
          onConfirm={handleConfirm}
        />
      )}
    </ConfirmationContext.Provider>
  )
}

export function useConfirmation() {
  const context = React.useContext(ConfirmationContext)

  if (!context) {
    throw new Error("useConfirmation must be used within a ConfirmationProvider")
  }

  return context
}
