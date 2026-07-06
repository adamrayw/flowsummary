'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, BarChart3, Presentation, FileText } from 'lucide-react'

export interface Recommendation {
  id: string
  title: string
  description: string
  isPrimary: boolean
  type: 'dashboard' | 'report' | 'presentation'
  priorityScore?: number
  confidence?: number
  whyRecommended?: string
  templateId?: string
  exportFormats?: string[]
}

interface RecommendationEngineProps {
  recommendations: Recommendation[]
  onSelect: (id: string) => void
}

export default function RecommendationEngine({ recommendations, onSelect }: RecommendationEngineProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'dashboard': return <BarChart3 className="w-5 h-5" />
      case 'presentation': return <Presentation className="w-5 h-5" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  return (
    <div className="w-full animate-in slide-in-from-bottom-6 fade-in duration-700 delay-150 fill-mode-both">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-xl font-bold">Recommended Actions</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((rec) => (
          <Card 
            key={rec.id} 
            className={`cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${
              rec.isPrimary 
                ? 'border-primary ring-1 ring-primary/20 bg-primary/5' 
                : 'border-border/50 bg-card/50 hover:border-primary/50'
            }`}
            onClick={() => onSelect(rec.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className={`p-2 rounded-lg ${rec.isPrimary ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                  {getIcon(rec.type)}
                </div>
                {rec.isPrimary && (
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-full">
                    Best Match
                  </span>
                )}
              </div>
              <CardTitle className="mt-4 text-lg">{rec.title}</CardTitle>
            </CardHeader>
              <CardContent>
                <CardDescription className="text-sm mb-6 min-h-[40px]">
                  {rec.description}
                </CardDescription>
                {rec.whyRecommended && (
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                    {rec.whyRecommended}
                  </p>
                )}
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs font-medium text-muted-foreground uppercase">{rec.type}</span>
                <Button variant={rec.isPrimary ? 'default' : 'ghost'} size="sm" className={!rec.isPrimary ? 'hover:bg-primary/10 hover:text-primary' : ''}>
                  Generate
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
