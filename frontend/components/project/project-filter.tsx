"use client"

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface ProjectFilterProps {
  onSelect?: (tech: string) => void
  availableTechs: string[]
}

export function ProjectFilter({ onSelect, availableTechs }: ProjectFilterProps) {
  const technologies = ["전체", ...availableTechs]
  const [selectedTech, setSelectedTech] = useState("전체")

  const handleSelect = (tech: string) => {
    setSelectedTech(tech)
    onSelect?.(tech === "전체" ? "" : tech)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {technologies.map((tech) => (
        <Button
          key={tech}
          variant={selectedTech === tech ? "default" : "outline"}
          size="sm"
          onClick={() => handleSelect(tech)}
          className={
            selectedTech === tech ? "bg-brand-blue-500 hover:bg-brand-blue-600" : "border-brand-blue-200 text-brand-blue-600 hover:bg-brand-blue-50"
          }
        >
          {tech}
        </Button>
      ))}
    </div>
  )
}
