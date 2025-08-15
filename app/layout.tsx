import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { Navigation } from "@/components/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { PlayerDataProvider } from "@/contexts/player-data-context"

export const metadata: Metadata = {
  title: "Fantasy Football Analytics",
  description: "Advanced fantasy football analytics with Sleeper integration",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <PlayerDataProvider>
            <Navigation />
            <main className="min-h-screen bg-gray-50">{children}</main>
            <Toaster />
          </PlayerDataProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
