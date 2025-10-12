"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Settings,
  User,
  Bell,
  Moon,
  Info,
  HelpCircle,
  LogOut,
  ChevronRight,
  Database,
  ArrowLeftRight,
  ThumbsUp,
} from "lucide-react"
import Link from "next/link"

export default function MorePage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-ios-title-1 font-bold">More</h1>
          <p className="text-ios-body text-text-secondary">
            Settings and account management
          </p>
        </div>

        {/* Account Section */}
        <Card className="bg-background-elevated border-border">
          <div className="p-4 space-y-1">
            <button className="w-full flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted active:scale-95 transition-all touch-target">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-ios-body font-semibold">Account</p>
                  <p className="text-ios-caption text-text-secondary">Manage your profile</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        </Card>

        {/* Tools & Features Section */}
        <Card className="bg-background-elevated border-border">
          <div className="divide-y divide-border">
            {/* NFL Data */}
            <div className="p-4">
              <Link href="/nfl-data" className="w-full flex items-center justify-between py-2 rounded-lg hover:bg-muted active:scale-95 transition-all touch-target">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Database className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-ios-body font-medium">NFL Data</p>
                    <p className="text-ios-caption text-text-secondary">Player stats & analytics</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-text-secondary" />
              </Link>
            </div>

            {/* Trade Analysis */}
            <div className="p-4">
              <Link href="/trades" className="w-full flex items-center justify-between py-2 rounded-lg hover:bg-muted active:scale-95 transition-all touch-target">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <ArrowLeftRight className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-ios-body font-medium">Trade Analysis</p>
                    <p className="text-ios-caption text-text-secondary">League trade history</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-text-secondary" />
              </Link>
            </div>

            {/* Recommendations */}
            <div className="p-4">
              <Link href="/recommendations" className="w-full flex items-center justify-between py-2 rounded-lg hover:bg-muted active:scale-95 transition-all touch-target">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <ThumbsUp className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-ios-body font-medium">Recommendations</p>
                    <p className="text-ios-caption text-text-secondary">Trade suggestions</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-text-secondary" />
              </Link>
            </div>
          </div>
        </Card>

        {/* Settings Section */}
        <Card className="bg-background-elevated border-border">
          <div className="divide-y divide-border">
            {/* Notifications */}
            <div className="p-4">
              <div className="flex items-center justify-between py-2 touch-target">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-warning" />
                  </div>
                  <div>
                    <p className="text-ios-body font-medium">Notifications</p>
                    <p className="text-ios-caption text-text-secondary">Trade alerts & updates</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </div>

            {/* Dark Mode */}
            <div className="p-4">
              <div className="flex items-center justify-between py-2 touch-target">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Moon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-ios-body font-medium">Dark Mode</p>
                    <p className="text-ios-caption text-text-secondary">iOS dark theme enabled</p>
                  </div>
                </div>
                <Switch defaultChecked disabled />
              </div>
            </div>

            {/* Settings */}
            <div className="p-4">
              <button className="w-full flex items-center justify-between py-2 rounded-lg hover:bg-muted active:scale-95 transition-all touch-target">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Settings className="w-4 h-4 text-secondary" />
                  </div>
                  <p className="text-ios-body font-medium">General Settings</p>
                </div>
                <ChevronRight className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
          </div>
        </Card>

        {/* Information Section */}
        <Card className="bg-background-elevated border-border">
          <div className="divide-y divide-border">
            <div className="p-4">
              <button className="w-full flex items-center justify-between py-2 rounded-lg hover:bg-muted active:scale-95 transition-all touch-target">
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-text-secondary" />
                  <p className="text-ios-body font-medium">About</p>
                </div>
                <ChevronRight className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <div className="p-4">
              <button className="w-full flex items-center justify-between py-2 rounded-lg hover:bg-muted active:scale-95 transition-all touch-target">
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-text-secondary" />
                  <p className="text-ios-body font-medium">Help & Support</p>
                </div>
                <ChevronRight className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
          </div>
        </Card>

        {/* Logout Button */}
        <Button
          variant="outline"
          className="w-full justify-center gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 touch-target"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </Button>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-ios-caption text-text-tertiary">
            Fantasy Football Analytics v1.0.0
          </p>
          <p className="text-ios-caption text-text-tertiary mt-1">
            iOS Dark Theme • Sprint 3
          </p>
        </div>
      </div>
    </div>
  )
}
