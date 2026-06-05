'use client'

import React, { useState } from 'react'
import DashboardLayout from '@/components/dashboard/dashboard-layout'
import HeroSection from '@/components/dashboard/hero-section'
import SourcePanel from '@/components/dashboard/source-panel'
import PromptPanel from '@/components/dashboard/prompt-panel'
import TemplatesSection from '@/components/dashboard/templates-section'
import GeneratedOutputSection from '@/components/dashboard/generated-output-section'
import EmptyState from '@/components/dashboard/empty-state'
import { Button } from '@/components/ui/button'
import { Wand2 } from 'lucide-react'

const SAMPLE_OUTPUT = {
  summary: `This document provides a comprehensive overview of modern AI applications in business. The research identifies key areas where AI is transforming operations including customer service automation, predictive analytics, and process optimization. Organizations implementing AI solutions report 30-40% improvements in operational efficiency and significant cost savings. However, successful implementation requires careful planning, proper training, and ongoing monitoring to ensure alignment with business objectives and ethical standards.`,
  keyInsights: [
    'AI adoption is accelerating across industries, with 60% of enterprises deploying AI solutions by 2025',
    'Data quality and availability are the primary barriers to effective AI implementation',
    'Organizations with AI-first strategies show 2x higher profitability compared to peers',
    'Skills gap remains a critical challenge, with shortage of AI/ML professionals',
  ],
  recommendations: [
    'Start with high-impact, low-complexity use cases to build internal expertise',
    'Invest in data infrastructure and governance before scaling AI initiatives',
    'Develop a comprehensive AI ethics and compliance framework',
    'Build cross-functional teams with business, technical, and domain expertise',
    'Plan for continuous learning and upskilling of existing workforce',
  ],
  conclusion: `AI is no longer a future consideration but an immediate business imperative. Organizations that strategically invest in AI capabilities while prioritizing ethical practices and workforce development will gain significant competitive advantages. The key to success lies not in technology adoption alone, but in alignment with business strategy, quality data infrastructure, and a culture of continuous innovation.`,
}

export default function DashboardPage() {
  const [sourceText, setSourceText] = useState('')
  const [promptText, setPromptText] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [showOutput, setShowOutput] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleGenerateSummary = async () => {
    if (!sourceText.trim()) {
      alert('Please paste content or upload a file to summarize')
      return
    }

    setIsLoading(true)
    // Simulate API call delay
    setTimeout(() => {
      setShowOutput(true)
      setIsLoading(false)
    }, 2000)
  }

  const handleNewSummary = () => {
    setSourceText('')
    setPromptText('')
    setSelectedTemplate(null)
    setShowOutput(false)
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
        {!showOutput ? (
          <>
            {/* Hero Section */}
            <HeroSection />

            {/* Main Workspace */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 h-auto md:h-[400px]">
              {/* Source Panel */}
              <div>
                <SourcePanel value={sourceText} onChange={setSourceText} />
              </div>

              {/* Prompt Panel */}
              <div>
                <PromptPanel
                  value={promptText}
                  onChange={setPromptText}
                  selectedTemplate={selectedTemplate}
                />
              </div>
            </div>

            {/* Templates Section */}
            <div className="mb-12">
              <TemplatesSection
                selectedTemplate={selectedTemplate}
                onSelectTemplate={setSelectedTemplate}
              />
            </div>

            {/* Generate Button */}
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleGenerateSummary}
                disabled={isLoading}
                className="px-12 py-6 text-base bg-primary hover:bg-secondary text-primary-foreground"
              >
                {isLoading ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⚡</span>
                    Generating Summary...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Generate Summary
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Output View */}
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Generated Summary</h2>
              <Button
                variant="outline"
                onClick={handleNewSummary}
                className="border-border hover:bg-border"
              >
                Create New Summary
              </Button>
            </div>

            <GeneratedOutputSection output={SAMPLE_OUTPUT} />
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
