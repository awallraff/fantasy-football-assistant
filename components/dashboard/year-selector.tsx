"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface YearSelectorProps {
  selectedYear: string
  availableYears: string[]
  onYearChange: (year: string) => void
}

export function YearSelector({ selectedYear, availableYears, onYearChange }: YearSelectorProps) {
  if (availableYears.length <= 1) {
    return null
  }

  return (
    <div className="flex justify-center mt-4">
      <Select value={selectedYear} onValueChange={onYearChange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableYears.map(year => (
            <SelectItem key={year} value={year}>
              {year} Season
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
