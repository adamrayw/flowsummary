'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertTriangle, Layers, Info, Target, Activity } from 'lucide-react'

export interface DocumentDNA {
  rowCount: number
  columnCount: number
  columns: string[]
  missingValues: number
  duplicates: number
  dateRange?: string
}

export interface DocumentHealth {
  overallScore: number
  completeness: number
  consistency: number
  reliability: number
  missingValues: number
  duplicates: number
  outliers: number
  potentialRisks: number
  explanation: string
}

export interface LikelyUserIntent {
  objective: string
  probability: number
  reason: string
}

interface InsightPreviewProps {
  classification: string
  confidence: number
  explanation: string
  dna: DocumentDNA
  contextSummary?: string[]
  documentHealth?: DocumentHealth | null
  keyFindings?: string[]
  aiInterpretation?: string
  likelyUserIntent?: LikelyUserIntent[]
  preview?: string[]
}

export default function InsightPreview({
  classification,
  confidence,
  explanation,
  dna,
  contextSummary = [],
  documentHealth = null,
  keyFindings = [],
  aiInterpretation = '',
  likelyUserIntent = [],
  preview = [],
}: InsightPreviewProps) {
  return (
    <div className="w-full animate-in slide-in-from-bottom-4 fade-in duration-700">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Badge variant="secondary" className="px-3 py-1 text-sm bg-primary/10 text-primary hover:bg-primary/20">
            {confidence > 0.8 ? 'High Confidence' : 'Medium Confidence'}
          </Badge>
          <h2 className="text-3xl font-bold">{classification}</h2>
        </div>
        <p className="text-muted-foreground text-lg flex items-start gap-2">
          <Info className="w-5 h-5 mt-0.5 shrink-0 text-primary" />
          {explanation}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Dataset Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dna.rowCount.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">rows</span></div>
            <div className="text-lg font-semibold">{dna.columnCount} <span className="text-sm font-normal text-muted-foreground">columns</span></div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Key Dimensions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {dna.columns.slice(0, 4).map(col => (
                <Badge key={col} variant="outline" className="text-xs bg-background">{col}</Badge>
              ))}
              {dna.columns.length > 4 && (
                <Badge variant="outline" className="text-xs bg-background text-muted-foreground">+{dna.columns.length - 4} more</Badge>
              )}
            </div>
            {dna.dateRange && (
              <div className="mt-3 text-sm">
                <span className="text-muted-foreground">Period:</span> <span className="font-medium">{dna.dateRange}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Data Quality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Missing Values</span>
                <span className={`font-medium ${dna.missingValues > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {dna.missingValues.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Duplicates</span>
                <span className={`font-medium ${dna.duplicates > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {dna.duplicates.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {contextSummary.length > 0 && (
        <Card className="bg-card/50 border-border/50 mb-6">
          <CardHeader>
            <CardTitle className="text-base">Context Summary</CardTitle>
            <CardDescription>What FlowSummary understood before recommending outputs.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
              {contextSummary.map((item) => (
                <li key={item} className="flex gap-2">
                  <Info className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {documentHealth && (
        <Card className="bg-card/50 border-border/50 mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Document Health
            </CardTitle>
            <CardDescription>{documentHealth.explanation}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <HealthMetric label="Overall" value={`${documentHealth.overallScore}/100`} />
              <HealthMetric label="Completeness" value={`${documentHealth.completeness}%`} />
              <HealthMetric label="Consistency" value={`${documentHealth.consistency}%`} />
              <HealthMetric label="Reliability" value={`${documentHealth.reliability}%`} />
              <HealthMetric label="Risks" value={documentHealth.potentialRisks.toLocaleString()} />
            </div>
          </CardContent>
        </Card>
      )}

      {keyFindings.length > 0 && (
        <Card className="bg-card/50 border-border/50 mb-6">
          <CardHeader>
            <CardTitle className="text-base">Key Findings</CardTitle>
            <CardDescription>Early observations from automatic data exploration.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {keyFindings.map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {(aiInterpretation || likelyUserIntent.length > 0) && (
        <div className="grid gap-4 mb-6 md:grid-cols-2">
          {aiInterpretation && (
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-base">AI Interpretation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{aiInterpretation}</p>
              </CardContent>
            </Card>
          )}
          {likelyUserIntent.length > 0 && (
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Likely User Intent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {likelyUserIntent.map((intent) => (
                    <div key={intent.objective}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-foreground">{intent.objective}</span>
                        <span className="text-xs text-primary">{Math.round(intent.probability * 100)}%</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{intent.reason}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {preview.length > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Insight Preview</CardTitle>
            <CardDescription>What FlowSummary understood before generating an output.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {preview.map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function HealthMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-background/50 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  )
}
