'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import * as LucideIcons from 'lucide-react'

interface TemplateCardProps {
  name: string
  description: string
  icon: string
  isSelected?: boolean
  onClick?: () => void
}

export default function TemplateCard({
  name,
  description,
  icon,
  isSelected = false,
  onClick,
}: TemplateCardProps) {
  // Get the icon component from lucide-react
  const IconComponent = (LucideIcons as any)[icon] || LucideIcons.FileText

  return (
    <Card
      className={`p-4 cursor-pointer transition-all ${
        isSelected
          ? 'bg-primary/10 border-primary shadow-lg'
          : 'bg-card border-border hover:border-primary hover:shadow-md'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/20' : 'bg-border'}`}>
          <IconComponent
            className={`w-6 h-6 ${
              isSelected ? 'text-primary' : 'text-muted-foreground'
            }`}
          />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground text-sm">{name}</h3>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
      {isSelected && (
        <div className="mt-3 flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-primary"></div>
          <span className="text-xs text-primary font-medium">Selected</span>
        </div>
      )}
    </Card>
  )
}
