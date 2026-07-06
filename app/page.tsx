'use client'

import { Button } from '@/components/ui/button'
import { FlowSummaryLogo } from '@/components/brand/flowsummary-logo'
import { buildAuthLogoutUrl } from '@/lib/raytech-account'
import { useAuthSession } from '@/hooks/use-auth-session'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  ClipboardCheck,
  Database,
  FileCheck2,
  FileText,
  Gauge,
  LayoutDashboard,
  LineChart,
  ListChecks,
  LockKeyhole,
  LogOut,
  Presentation,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

const thinkingSteps = [
  'Reading document',
  'Detecting document type',
  'Extracting KPIs',
  'Finding anomalies',
  'Understanding business context',
  'Predicting user intent',
  'Selecting best outputs',
]

const analystFlow = [
  { label: 'Upload', detail: 'PDF, Excel, Word, CSV, or raw text' },
  { label: 'Understand', detail: 'Type, structure, language, dates, entities' },
  { label: 'Explore', detail: 'Patterns, missing values, duplicates, anomalies' },
  { label: 'Infer intent', detail: 'Likely objective, audience, and decision context' },
  { label: 'Recommend', detail: 'Best analysis and output for this document' },
  { label: 'Generate', detail: 'Executive-ready reports, briefs, and action plans' },
]

const documents = [
  'Attendance',
  'Finance',
  'Sales',
  'HR',
  'Inventory',
  'Government',
  'Research',
  'Contracts',
  'Medical',
  'Construction',
  'Legal',
  'Meeting Minutes',
  'Invoices',
]

const capabilities = [
  {
    icon: SearchCheck,
    title: 'Understands',
    text: 'Detects document type, structure, metrics, dimensions, language, and business context automatically.',
  },
  {
    icon: LineChart,
    title: 'Explores',
    text: 'Looks for trends, anomalies, duplicate records, missing values, unusual distributions, and risks.',
  },
  {
    icon: Target,
    title: 'Infers',
    text: 'Predicts the likely objective: executive summary, audit, dashboard, risk review, or investigation.',
  },
  {
    icon: ListChecks,
    title: 'Recommends',
    text: 'Prioritizes outcome-driven actions based on what the document actually contains.',
  },
  {
    icon: Presentation,
    title: 'Generates',
    text: 'Creates management summaries, board briefs, action plans, and professional reports.',
  },
]

const enterpriseFeatures = [
  { icon: Gauge, title: 'Document health score', text: 'Completeness, consistency, reliability, missing values, duplicates, and risk signals.' },
  { icon: Database, title: 'Structured analysis history', text: 'Classifications, profiles, recommendations, and generated reports are saved for review.' },
  { icon: ShieldCheck, title: 'RayTech Account access', text: 'Built into the RayTech ecosystem with authenticated workspace flows.' },
  { icon: LockKeyhole, title: 'Enterprise-ready posture', text: 'Designed for controlled document workflows, repeatable outputs, and audit-aware teams.' },
]

const examples = [
  {
    title: 'Attendance anomaly investigation',
    input: 'Monthly attendance file with employee, region, check-in, check-out, status, and leave reason.',
    output: 'Flags unusual absence patterns, missing leave reasons, late-arrival clusters, and manager actions.',
  },
  {
    title: 'Financial board brief',
    input: 'Finance report with revenue, expense, profit, budget, variance, and reporting period.',
    output: 'Explains performance movement, risk areas, budget concerns, and leadership recommendations.',
  },
  {
    title: 'Contract risk review',
    input: 'Vendor agreement with obligations, payment terms, renewal windows, and termination language.',
    output: 'Extracts key dates, operational obligations, renewal risks, and negotiation follow-ups.',
  },
]

export default function Page() {
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [activeDemoStep, setActiveDemoStep] = useState(0)
  const { data: session, status } = useAuthSession()
  const isAuthenticated = status === 'authenticated'
  const userName =
    session?.user?.name?.trim() ||
    session?.user?.email?.split('@')[0] ||
    'RayTech User'
  const userEmail = session?.user?.email || ''
  const initials = useMemo(() => {
    const parts = userName.split(' ').filter(Boolean)
    if (parts.length === 0) return 'FS'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }, [userName])

  const handleSignOut = () => {
    window.location.href = buildAuthLogoutUrl(`${window.location.origin}/signin`)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <FlowSummaryLogo className="h-8 w-8 rounded-lg" priority />
            <span className="text-lg font-semibold">FlowSummary</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#thinking" className="text-sm text-muted-foreground transition hover:text-foreground">How it thinks</a>
            <a href="#documents" className="text-sm text-muted-foreground transition hover:text-foreground">Documents</a>
            <a href="#comparison" className="text-sm text-muted-foreground transition hover:text-foreground">Comparison</a>
            <a href="#examples" className="text-sm text-muted-foreground transition hover:text-foreground">Examples</a>
          </div>

          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm transition hover:bg-border"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                  {initials}
                </span>
                <span className="hidden max-w-36 truncate sm:inline">{userName}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-border bg-card shadow-lg">
                  <div className="border-b border-border p-3">
                    <p className="truncate text-sm font-medium">{userName}</p>
                    <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
                  </div>
                  <div className="p-2">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 rounded px-3 py-2 text-sm transition hover:bg-border"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-red-400 transition hover:bg-border"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/signin">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-primary hover:bg-primary/90">Open workspace</Button>
              </Link>
            </div>
          )}
        </div>
      </nav>

      <main>
        <section className="relative overflow-hidden border-b border-border py-20 md:py-32">
          <HeroSurface />
          <div className="relative z-10 mx-auto max-w-7xl px-6">
            <div className="max-w-4xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                Enterprise AI Analyst for documents
              </div>
              <h1 className="max-w-4xl text-4xl font-bold leading-tight text-balance sm:text-5xl md:text-7xl">
                Documents in. <span className="text-primary">Decisions out.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg md:text-xl md:leading-8">
                Upload any report. FlowSummary understands it before generating anything.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link href={isAuthenticated ? '/dashboard' : '/signup'}>
                  <Button size="lg" className="bg-primary px-5 hover:bg-primary/90">
                    Start free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <a href="#interactive-demo">
                  <Button size="lg" variant="outline" className="px-5">
                    See AI thinking
                  </Button>
                </a>
              </div>
              <div className="mt-10 lg:hidden">
                <MobileHeroDemo />
              </div>
            </div>
          </div>
        </section>

        <Section id="problem" eyebrow="Problem" title="Most document tools stop at text." description="Business teams do not just need a shorter document. They need to know what the document is, what changed, what looks risky, and what decision should happen next.">
          <div className="grid gap-4 md:grid-cols-5">
            {['Read', 'Analyze', 'Write', 'Review', 'Present'].map((step) => (
              <ProcessCard key={step} label={step} muted />
            ))}
          </div>
        </Section>

        <Section id="solution" eyebrow="Solution" title="FlowSummary works like an experienced analyst." description="It understands the document, explores the evidence, infers the user’s intent, and recommends the most useful output before the user writes a prompt.">
          <div className="grid gap-4 md:grid-cols-5">
            {['Upload', 'Understand', 'Recommend', 'Generate', 'Present'].map((step) => (
              <ProcessCard key={step} label={step} />
            ))}
          </div>
        </Section>

        <Section id="thinking" eyebrow="How FlowSummary Thinks" title="It analyzes before it answers." description="Every upload follows a structured analyst process. The product does not wait for “what should I do?” It explains, explores, and recommends.">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <GlassCard>
              <div className="mb-5 flex items-center gap-2 text-sm font-medium text-primary">
                <Activity className="h-4 w-4" />
                Reading document...
              </div>
              <div className="space-y-3">
                {thinkingSteps.map((step, index) => (
                  <div key={step} className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2">
                    <span className="text-sm">{step}</span>
                    <span className={`h-2 w-2 rounded-full ${index < 6 ? 'bg-primary' : 'bg-amber-400'}`} />
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm text-muted-foreground">Done. Recommended output: Executive decision brief.</p>
            </GlassCard>
            <div className="grid gap-4 sm:grid-cols-2">
              {capabilities.map((capability) => (
                <CapabilityCard key={capability.title} {...capability} />
              ))}
            </div>
          </div>
        </Section>

        <Section id="how-it-works" eyebrow="How It Works" title="A repeatable path from file to decision." description="FlowSummary treats each upload as business evidence, not a generic text block.">
          <div className="grid gap-4 lg:grid-cols-6">
            {analystFlow.map((step, index) => (
              <GlassCard key={step.label}>
                <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-sm font-semibold text-primary">
                  {index + 1}
                </div>
                <h3 className="text-base font-semibold">{step.label}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.detail}</p>
              </GlassCard>
            ))}
          </div>
        </Section>

        <Section id="documents" eyebrow="Supported Documents" title="Built for every document." description="FlowSummary adapts its analysis to the document type, then recommends the outputs executives and operators usually need.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {documents.map((document) => (
              <div key={document} className="rounded-lg border border-border bg-card/50 px-4 py-3 text-sm font-medium">
                {document}
              </div>
            ))}
          </div>
        </Section>

        <Section id="enterprise" eyebrow="Enterprise Features" title="Designed for recurring analysis work." description="FlowSummary keeps the analyst workflow structured enough for teams, saved history, repeatable reviews, and management-ready outputs.">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {enterpriseFeatures.map((feature) => (
              <CapabilityCard key={feature.title} {...feature} />
            ))}
          </div>
        </Section>

        <Section id="comparison" eyebrow="Comparison" title="Traditional AI waits. FlowSummary understands first." description="The experience is built around proactive document intelligence, not open-ended prompting.">
          <div className="grid gap-5 lg:grid-cols-2">
            <ComparisonPanel
              title="Traditional AI"
              muted
              items={['Waits for prompts', 'Treats files as text', 'Returns generic summaries', 'Leaves analysis choices to the user', 'Requires manual follow-up']}
            />
            <ComparisonPanel
              title="FlowSummary"
              items={['Understands first', 'Classifies the document', 'Explores anomalies and risk', 'Predicts the likely objective', 'Recommends the best outputs']}
            />
          </div>
        </Section>

        <Section id="interactive-demo" eyebrow="Interactive Demo" title="Watch the analyst path." description="Select a stage to see how FlowSummary moves from raw document to decision-ready output.">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-2">
              {analystFlow.map((step, index) => (
                <button
                  key={step.label}
                  onClick={() => setActiveDemoStep(index)}
                  className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
                    activeDemoStep === index
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card/50 hover:bg-card'
                  }`}
                >
                  <span className="font-medium">{step.label}</span>
                  <ArrowRight className="h-4 w-4 text-primary" />
                </button>
              ))}
            </div>
            <GlassCard className="bg-card/70">
              <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <FileCheck2 className="h-4 w-4 text-primary" />
                Analyst workspace
              </div>
              <h3 className="text-2xl font-semibold">{analystFlow[activeDemoStep].label}</h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{analystFlow[activeDemoStep].detail}</p>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {['Document detected', 'KPIs extracted', 'Next action selected'].map((item) => (
                  <div key={item} className="rounded-lg border border-border bg-background/40 p-3 text-sm text-muted-foreground">
                    <Check className="mb-3 h-4 w-4 text-primary" />
                    {item}
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </Section>

        <Section id="examples" eyebrow="Examples" title="Outputs that support decisions." description="FlowSummary changes its output based on the document type and the likely business objective.">
          <div className="grid gap-4 lg:grid-cols-3">
            {examples.map((example) => (
              <GlassCard key={example.title}>
                <h3 className="text-lg font-semibold">{example.title}</h3>
                <p className="mt-4 text-sm font-medium text-primary">Input</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{example.input}</p>
                <p className="mt-4 text-sm font-medium text-primary">Output</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{example.output}</p>
              </GlassCard>
            ))}
          </div>
        </Section>

        <section className="border-t border-border bg-card/40 px-6 py-20">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-4xl font-bold leading-tight md:text-6xl">
              Stop reading reports. <span className="text-primary">Start making decisions.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Upload a document and let FlowSummary find the context, risks, intent, and best next output.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link href={isAuthenticated ? '/dashboard' : '/signup'}>
                <Button size="lg" className="bg-primary px-5 hover:bg-primary/90">
                  Analyze a document
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/signin">
                <Button size="lg" variant="outline" className="px-5">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card/50 py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <FlowSummaryLogo className="h-8 w-8 rounded-lg" />
              <span className="font-semibold">FlowSummary</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
              Enterprise AI Analyst for document intelligence. Part of the RayTech ecosystem.
            </p>
          </div>
          <FooterColumn title="Product" links={['How it thinks', 'Documents', 'Comparison', 'Examples']} />
          <FooterColumn title="RayTech" links={['RayTech Account', 'FlowNote', 'FlowSign', 'raytech.cloud']} />
          <FooterColumn title="Legal" links={['Privacy', 'Terms']} />
        </div>
      </footer>
    </div>
  )
}

function HeroSurface() {
  const thinking = [
    { icon: Upload, text: 'Upload Report.pdf', delay: '0s' },
    { icon: Activity, text: 'Reading document...', delay: '1.1s' },
    { icon: FileText, text: 'Financial Report detected', meta: '98% confidence', delay: '2.2s' },
    { icon: BarChart3, text: '12 KPIs extracted', delay: '3.3s' },
    { icon: AlertTriangle, text: '4 anomalies discovered', delay: '4.4s' },
    { icon: Target, text: 'User intent predicted', delay: '5.5s' },
    { icon: ClipboardCheck, text: 'Recommended outputs ready', delay: '6.6s' },
  ]

  const outputs = [
    { icon: FileText, text: 'Executive Summary' },
    { icon: BarChart3, text: 'Dashboard' },
    { icon: Presentation, text: 'Presentation' },
  ]

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(139,92,246,0.18),transparent_34%),radial-gradient(circle_at_45%_80%,rgba(168,85,247,0.12),transparent_30%)]" />
      <div className="absolute right-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] top-1/2 hidden w-[560px] -translate-y-1/2 rounded-2xl border border-border bg-card/65 p-4 shadow-2xl backdrop-blur-xl lg:block">
        <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
          <div>
            <p className="text-sm font-medium">Analyst thinking</p>
            <p className="mt-1 text-xs text-muted-foreground">Looping product demonstration</p>
          </div>
          <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
            Live analysis
          </div>
        </div>

        <div className="flex flex-col">
          <div className="space-y-2">
            {thinking.map((step, index) => (
              <div
                key={step.text}
                className="hero-thinking-step flex items-center justify-between rounded-lg border border-border bg-background/45 px-3 py-2"
                style={{ animationDelay: step.delay }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <step.icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground">{step.text}</p>
                    {step.meta && <p className="text-xs text-muted-foreground">{step.meta}</p>}
                  </div>
                </div>
                {index > 0 && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            ))}
          </div>

          <div className="hero-output-panel mt-3 rounded-xl border border-primary/20 bg-primary/10 p-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">Recommended outputs</p>
              <span className="text-xs text-primary">Done</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {outputs.map((output) => (
                <div key={output.text} className="rounded-lg border border-border bg-background/45 p-2.5">
                  <output.icon className="mb-2 h-4 w-4 text-primary" />
                  <p className="text-xs text-muted-foreground">{output.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MobileHeroDemo() {
  const items = [
    { text: 'Reading document...', delay: '0.6s' },
    { text: 'Financial Report detected', delay: '1.8s' },
    { text: '12 KPIs extracted', delay: '3s' },
    { text: '4 anomalies discovered', delay: '4.2s' },
    { text: 'User intent predicted', delay: '5.4s' },
  ]

  return (
    <div className="rounded-2xl border border-border bg-card/65 p-4 shadow-2xl backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Analyst thinking</p>
          <p className="mt-1 text-xs text-muted-foreground">Report.pdf</p>
        </div>
        <Activity className="h-4 w-4 animate-pulse text-primary" />
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.text}
            className="hero-thinking-step flex items-center gap-2 rounded-lg border border-border bg-background/45 px-3 py-2 text-xs text-muted-foreground"
            style={{ animationDelay: item.delay }}
          >
            <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span>{item.text}</span>
          </div>
        ))}
      </div>
      <div className="hero-output-panel mt-3 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-xs text-primary">
        Recommended outputs ready
      </div>
    </div>
  )
}

function Section({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="border-t border-border px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-sm font-semibold text-primary">{eyebrow}</p>
          <h2 className="text-4xl font-bold leading-tight md:text-5xl">{title}</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">{description}</p>
        </div>
        {children}
      </div>
    </section>
  )
}

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card/50 p-5 backdrop-blur ${className}`}>
      {children}
    </div>
  )
}

function ProcessCard({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${muted ? 'border-border bg-card/35 text-muted-foreground' : 'border-primary/30 bg-primary/10 text-foreground'}`}>
      <div className="mb-4 h-1.5 w-12 rounded bg-current opacity-40" />
      <p className="font-semibold">{label}</p>
    </div>
  )
}

function CapabilityCard({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  text: string
}) {
  return (
    <GlassCard>
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="mt-5 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </GlassCard>
  )
}

function ComparisonPanel({ title, items, muted = false }: { title: string; items: string[]; muted?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${muted ? 'border-border bg-card/35' : 'border-primary/30 bg-primary/10'}`}>
      <h3 className="text-xl font-semibold">{title}</h3>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
            <Check className={`h-4 w-4 ${muted ? 'text-muted-foreground' : 'text-primary'}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-4 space-y-2">
        {links.map((link) => (
          <li key={link}>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">{link}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
