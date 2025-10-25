import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "@/app/globals.css"
import { IOSBottomTabBar } from "@/components/ios-bottom-tab-bar"
import { IOSDesktopNav } from "@/components/ios-desktop-nav"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { PlayerDataProvider } from "@/contexts/player-data-context"
import { ProjectionsProvider } from "@/contexts/projections-context"
import { ConfirmationProvider } from "@/hooks/use-confirmation"
import { ErrorBoundary } from "@/components/error-boundary"

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
  console.log("[v0] Layout rendering...")

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload critical fonts to prevent FOUT/layout shifts */}
        <link
          rel="preload"
          href="/_next/static/media/028c0d39d2e8f589-s.p.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/_next/static/media/5b01f339abf2f1a5.p.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-geist-sans: ${GeistSans.variable};
  --font-geist-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body className="bg-background">
        <ErrorBoundary level="root">
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <ConfirmationProvider>
              <PlayerDataProvider>
                <ProjectionsProvider>
                  {/* Desktop Sidebar Navigation */}
                  <IOSDesktopNav />

                  {/* Main Content Area */}
                  <main className="md:ml-64 pb-20 md:pb-6">
                    <div className="min-h-screen">
                      {children}
                    </div>
                  </main>

                  {/* Mobile Bottom Tab Bar */}
                  <IOSBottomTabBar />

                  <Toaster />
                </ProjectionsProvider>
              </PlayerDataProvider>
            </ConfirmationProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
