'use client'

import React from 'react'
import { FileText } from 'lucide-react'

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="mb-4 p-4 rounded-full bg-border">
        <FileText className="w-12 h-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No summary generated yet
      </h3>
      <p className="text-center text-muted-foreground max-w-md">
        Paste your content in the source panel, select a template or add instructions, then click "Generate Summary" to get started.
      </p>
    </div>
  )
}
