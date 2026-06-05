'use client'

import React from 'react'
import OutputCard from './output-card'
import { Lightbulb, CheckCircle2, AlertCircle, Zap } from 'lucide-react'

interface GeneratedOutputSectionProps {
  output: {
    summary: string
    keyInsights: string[]
    recommendations: string[]
    conclusion: string
  }
}

export default function GeneratedOutputSection({ output }: GeneratedOutputSectionProps) {
  return (
    <div className="space-y-6">
      {/* Main Summary */}
      <OutputCard
        title="Summary"
        content={output.summary}
        icon={<Zap className="w-5 h-5" />}
      />

      {/* Key Insights */}
      <OutputCard
        title="Key Insights"
        content={output.keyInsights.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}
        icon={<Lightbulb className="w-5 h-5" />}
      />

      {/* Recommendations */}
      <OutputCard
        title="Recommendations"
        content={output.recommendations
          .map((rec, i) => `${i + 1}. ${rec}`)
          .join('\n')}
        icon={<CheckCircle2 className="w-5 h-5" />}
      />

      {/* Conclusion */}
      <OutputCard
        title="Conclusion"
        content={output.conclusion}
        icon={<AlertCircle className="w-5 h-5" />}
      />
    </div>
  )
}
