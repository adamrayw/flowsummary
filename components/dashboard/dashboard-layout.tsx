'use client'

import React, { useState } from 'react'
import TopNav from './top-nav'
import HistorySidebar from './history-sidebar'
import type { SummaryListItem } from '@/lib/summary-types'

interface DashboardLayoutProps {
  children: React.ReactNode
  summaries?: SummaryListItem[]
  activeSummaryId?: string | null
  isHistoryLoading?: boolean
  onNewSummary?: () => void
  onSelectSummary?: (summaryId: string) => void
  onDeleteSummary?: (summaryId: string) => void
}

export default function DashboardLayout({
  children,
  summaries = [],
  activeSummaryId = null,
  isHistoryLoading = false,
  onNewSummary,
  onSelectSummary,
  onDeleteSummary,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - Hidden on mobile, visible on md and up */}
      <div className="hidden h-full shrink-0 md:block">
        <HistorySidebar
          summaries={summaries}
          activeSummaryId={activeSummaryId}
          isLoading={isHistoryLoading}
          onNewSummary={onNewSummary}
          onSelectSummary={onSelectSummary}
          onDeleteSummary={onDeleteSummary}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen w-64 bg-card border-r border-border z-50 transform transition-transform duration-300 md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <HistorySidebar
          summaries={summaries}
          activeSummaryId={activeSummaryId}
          isLoading={isHistoryLoading}
          onNewSummary={() => {
            setSidebarOpen(false)
            onNewSummary?.()
          }}
          onSelectSummary={(summaryId) => {
            setSidebarOpen(false)
            onSelectSummary?.(summaryId)
          }}
          onDeleteSummary={onDeleteSummary}
        />
      </div>

      {/* Main Content */}
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Top Navigation */}
        <TopNav onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page Content */}
        <main className="min-h-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
