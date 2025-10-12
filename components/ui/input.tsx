import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-text-secondary selection:bg-primary selection:text-primary-foreground bg-input border-border flex h-11 w-full min-w-0 rounded-xl border px-4 py-2 text-ios-body shadow-sm transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 touch-target",
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/50",
        "aria-invalid:ring-2 aria-invalid:ring-destructive/50 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
