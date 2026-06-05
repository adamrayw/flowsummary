'use client'

import React from 'react'
import { TEMPLATES } from '@/lib/constants'
import TemplateCard from './template-card'

interface TemplatesSectionProps {
  selectedTemplate: string | null
  onSelectTemplate: (templateId: string) => void
}

export default function TemplatesSection({
  selectedTemplate,
  onSelectTemplate,
}: TemplatesSectionProps) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-4">
        Or choose a template
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TEMPLATES.map((template) => (
          <TemplateCard
            key={template.id}
            name={template.name}
            description={template.description}
            icon={template.icon}
            isSelected={selectedTemplate === template.id}
            onClick={() => onSelectTemplate(template.id)}
          />
        ))}
      </div>
    </div>
  )
}
