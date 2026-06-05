'use client'

import React, { useState } from 'react'
import { ChevronDown, Clock, FileText, Trash2 } from 'lucide-react'
import { SAMPLE_SUMMARIES } from '@/lib/constants'

export default function HistorySidebar() {
  const [expandedSections, setExpandedSections] = useState({
    today: true,
    yesterday: true,
    older: false,
  })

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Group summaries by time
  const now = new Date()
  const today = SAMPLE_SUMMARIES.filter((s) => {
    const summaryDate = new Date(s.date)
    return (
      summaryDate.toDateString() === now.toDateString()
    )
  })

  const yesterday = SAMPLE_SUMMARIES.filter((s) => {
    const summaryDate = new Date(s.date)
    const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    return (
      summaryDate.toDateString() === yesterdayDate.toDateString()
    )
  })

  const older = SAMPLE_SUMMARIES.filter((s) => {
    const summaryDate = new Date(s.date)
    const oldDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    return summaryDate < oldDate
  })

  const SummaryGroup = ({
    title,
    items,
    sectionKey,
  }: {
    title: string
    items: typeof SAMPLE_SUMMARIES
    sectionKey: string
  }) => (
    <div className="mb-4">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="flex items-center gap-2 w-full px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            expandedSections[sectionKey as keyof typeof expandedSections] ? '' : '-rotate-90'
          }`}
        />
        {title}
      </button>

      {expandedSections[sectionKey as keyof typeof expandedSections] && (
        <div className="space-y-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="group mx-2 px-3 py-2 rounded-lg hover:bg-border cursor-pointer transition-colors flex items-start justify-between gap-2"
            >
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.date).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </p>
                </div>
              </div>
              <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-border rounded transition-all flex-shrink-0">
                <Trash2 className="w-3 h-3 text-muted-foreground hover:text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="w-64 border-r border-border bg-card overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          History
        </h2>
      </div>

      {/* New Conversation Button */}
      <div className="p-4">
        <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-secondary transition-colors font-medium text-sm">
          + New Summary
        </button>
      </div>

      {/* Summary Groups */}
      <div className="px-2 py-4">
        {today.length > 0 && <SummaryGroup title="Today" items={today} sectionKey="today" />}
        {yesterday.length > 0 && <SummaryGroup title="Yesterday" items={yesterday} sectionKey="yesterday" />}
        {older.length > 0 && <SummaryGroup title="Older" items={older} sectionKey="older" />}
      </div>
    </div>
  )
}
