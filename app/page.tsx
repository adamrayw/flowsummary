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
  'Upload',
  'Document Detection',
  'Document Understanding',
  'Business Reasoning',
  'Intent Inference',
  'Recommended Actions',
  'Living Workspace',
  'Decision Support',
]

const analystFlow = [
  { label: 'Detect', detail: 'Identifies document type, structure, fields, language, dates, entities, and business signals.' },
  { label: 'Understand', detail: 'Builds document intelligence from metrics, dimensions, evidence, risks, and operational context.' },
  { label: 'Reason', detail: 'Connects patterns to likely business meaning instead of treating the upload as plain text.' },
  { label: 'Recommend', detail: 'Suggests the right investigation, action, or output before the team writes a prompt.' },
  { label: 'Workspace', detail: 'Creates a Living Workspace where context, evidence, copilot answers, and actions stay connected.' },
  { label: 'Decide', detail: 'Turns the investigation into decision support for executives, operators, and follow-up teams.' },
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
    title: 'Document Intelligence',
    text: 'Detects what the document is, which fields matter, and how the information should be interpreted.',
  },
  {
    icon: LineChart,
    title: 'Business Reasoning',
    text: 'Connects KPIs, anomalies, and evidence to business context instead of returning a generic summary.',
  },
  {
    icon: Target,
    title: 'Intent Inference',
    text: 'Predicts whether the team needs a dashboard, root cause analysis, forecast, presentation, or audit trail.',
  },
  {
    icon: ListChecks,
    title: 'Recommended Actions',
    text: 'Prioritizes next steps based on evidence, confidence, urgency, and the likely decision being made.',
  },
  {
    icon: Presentation,
    title: 'Living Outputs',
    text: 'Creates workspaces that teams can explore, question, validate, and turn into executive-ready outputs.',
  },
]

const enterpriseFeatures = [
  { icon: Gauge, title: 'Explainable analysis', text: 'Confidence, evidence, source fields, and reasoning stay visible inside each investigation.' },
  { icon: Database, title: 'Continuous context', text: 'Analysis history, workspace state, recommendations, and generated outputs remain connected.' },
  { icon: ShieldCheck, title: 'RayTech Account access', text: 'Built into the RayTech ecosystem with authenticated workspace flows.' },
  { icon: LockKeyhole, title: 'Enterprise-ready posture', text: 'Designed for controlled document workflows, repeatable reviews, and audit-aware teams.' },
]

const livingWorkspaces = [
  {
    icon: BarChart3,
    title: 'Executive Dashboard',
    text: 'Decision metrics, risk signals, recommended actions, and confidence in one operating view.',
  },
  {
    icon: SearchCheck,
    title: 'Root Cause Investigation',
    text: 'Follow the strongest signal from KPI to dimension, evidence, and recommended next action.',
  },
  {
    icon: LineChart,
    title: 'Forecast Workspace',
    text: 'Turn current signals into scenarios, assumptions, and confidence-aware decision paths.',
  },
  {
    icon: Presentation,
    title: 'Presentation Workspace',
    text: 'Generate executive-ready narratives while preserving the evidence behind each slide.',
  },
  {
    icon: Sparkles,
    title: 'AI Copilot',
    text: 'Ask follow-up questions that inherit the active KPI, dimension, filters, and reasoning context.',
  },
  {
    icon: FileCheck2,
    title: 'Evidence Viewer',
    text: 'Inspect source fields, supporting findings, confidence, and affected records before deciding.',
  },
]

const examples = [
  {
    title: 'Attendance anomaly investigation',
    input: 'Monthly attendance file with employee, region, check-in, check-out, status, and leave reason.',
    output: 'Creates an anomaly workspace with evidence, affected groups, recommended owner actions, and follow-up questions.',
  },
  {
    title: 'Financial board brief',
    input: 'Finance report with revenue, expense, profit, budget, variance, and reporting period.',
    output: 'Builds an executive dashboard, highlights variance drivers, and prepares a decision-ready presentation path.',
  },
  {
    title: 'Contract risk review',
    input: 'Vendor agreement with obligations, payment terms, renewal windows, and termination language.',
    output: 'Opens an evidence-backed risk workspace with obligations, renewal exposure, and recommended negotiation follow-ups.',
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
            <a href="#workspaces" className="text-sm text-muted-foreground transition hover:text-foreground">Workspaces</a>
            <a href="#documents" className="text-sm text-muted-foreground transition hover:text-foreground">Documents</a>
            <a href="#comparison" className="text-sm text-muted-foreground transition hover:text-foreground">Comparison</a>
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
            <div className="max-w-4xl xl:max-w-[610px]">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                Enterprise AI Analyst under RayTech Platform
              </div>
              <h1 className="max-w-4xl text-4xl font-bold leading-tight text-balance sm:text-5xl md:text-6xl xl:text-7xl">
                Stop reading reports. <span className="text-primary">Start investigating with AI.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg md:text-xl md:leading-8">
                Upload spreadsheets, reports, or operational documents. FlowSummary understands your business,
                recommends the best investigation, and creates interactive workspaces that turn information into decisions.
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
                    See analyst workflow
                  </Button>
                </a>
              </div>
              <div className="mt-10 lg:hidden">
                <MobileHeroDemo />
              </div>
            </div>
          </div>
        </section>

        <Section id="problem" eyebrow="Problem" title="Most AI tools stop at the answer." description="Chat interfaces can read documents and generate reports, but enterprise teams still have to choose the investigation, preserve context, validate evidence, and decide what to do next.">
          <div className="grid gap-4 md:grid-cols-5">
            {['Prompt', 'Read', 'Summarize', 'Copy', 'Repeat'].map((step) => (
              <ProcessCard key={step} label={step} muted />
            ))}
          </div>
        </Section>

        <Section id="solution" eyebrow="Solution" title="FlowSummary works like an analyst, not a document chatbot." description="It understands business documents, recommends the right investigation, and creates Living Workspaces that help teams make confident decisions.">
          <div className="grid gap-4 md:grid-cols-5">
            {['Understand', 'Investigate', 'Explain', 'Recommend', 'Decide'].map((step) => (
              <ProcessCard key={step} label={step} />
            ))}
          </div>
        </Section>

        <Section id="thinking" eyebrow="How FlowSummary Thinks" title="It reasons before it generates." description="FlowSummary follows a structured analyst pipeline so the output is grounded in document intelligence, business context, evidence, and user intent.">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <GlassCard>
              <div className="mb-5 flex items-center gap-2 text-sm font-medium text-primary">
                <Activity className="h-4 w-4" />
                Analyst pipeline
              </div>
              <div className="space-y-3">
                {thinkingSteps.map((step, index) => (
                  <div key={step} className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2">
                    <span className="text-sm">{step}</span>
                    <span className={`h-2 w-2 rounded-full ${index < 7 ? 'bg-primary' : 'bg-amber-400'}`} />
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm text-muted-foreground">Done. Recommended next step: open a Living Workspace with evidence and copilot context.</p>
            </GlassCard>
            <div className="grid gap-4 sm:grid-cols-2">
              {capabilities.map((capability) => (
                <CapabilityCard key={capability.title} {...capability} />
              ))}
            </div>
          </div>
        </Section>

        <Section id="how-it-works" eyebrow="How It Works" title="A repeatable path from document to decision support." description="FlowSummary does not ask teams to decide what analysis to run first. It detects the document, infers the likely objective, and opens the workspace that fits the business problem.">
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

        <Section id="workspaces" eyebrow="Living Workspace" title="Collaborate with AI instead of receiving static reports." description="Each analysis becomes an interactive workspace. Teams can explore KPIs, compare segments, forecast scenarios, ask the copilot follow-up questions, and inspect evidence without losing context.">
          <LivingWorkspaceShowcase />
        </Section>

        <Section id="documents" eyebrow="Supported Documents" title="Built for business documents." description="FlowSummary adapts its reasoning to the document type, then recommends the investigation, workspace, and output enterprise teams usually need next.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {documents.map((document) => (
              <div key={document} className="rounded-lg border border-border bg-card/50 px-4 py-3 text-sm font-medium">
                {document}
              </div>
            ))}
          </div>
        </Section>

        <Section id="enterprise" eyebrow="Enterprise Features" title="Designed for recurring investigation work." description="FlowSummary keeps the analyst workflow structured enough for explainable reviews, continuous decision support, and management-ready outputs.">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {enterpriseFeatures.map((feature) => (
              <CapabilityCard key={feature.title} {...feature} />
            ))}
          </div>
        </Section>

        <Section id="comparison" eyebrow="Comparison" title="Why FlowSummary is different from chat AI and BI dashboards." description="Traditional AI can answer prompts. BI dashboards can show metrics. FlowSummary connects documents, reasoning, evidence, recommended actions, and continuous investigation in one analyst workflow.">
          <div className="grid gap-5 lg:grid-cols-2">
            <ComparisonPanel
              title="Traditional AI"
              muted
              items={['Reads documents', 'Answers prompts', 'Generates reports', 'Loses analysis context between follow-ups', 'Leaves investigation design to the user']}
            />
            <ComparisonPanel
              title="FlowSummary"
              items={['Understands business context', 'Recommends investigations', 'Creates interactive workspaces', 'Preserves analysis context', 'Supports continuous decision making']}
            />
          </div>
        </Section>

        <Section id="interactive-demo" eyebrow="Interactive Demo" title="Watch the analyst path." description="Select a stage to see how FlowSummary moves from document intelligence to a decision-support workspace.">
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
                Living Workspace
              </div>
              <h3 className="text-2xl font-semibold">{analystFlow[activeDemoStep].label}</h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{analystFlow[activeDemoStep].detail}</p>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {['Context preserved', 'Evidence attached', 'Copilot ready'].map((item) => (
                  <div key={item} className="rounded-lg border border-border bg-background/40 p-3 text-sm text-muted-foreground">
                    <Check className="mb-3 h-4 w-4 text-primary" />
                    {item}
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </Section>

        <Section id="examples" eyebrow="Examples" title="Investigations that support decisions." description="FlowSummary changes its workspace based on the document type, available evidence, and likely business objective.">
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
              Put document intelligence to work. <span className="text-primary">Open a Living Workspace.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Upload a business document and let FlowSummary understand the context, recommend the investigation,
              preserve evidence, and support the next decision.
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
              Enterprise AI Analyst for document intelligence, Living Workspaces, and decision support. Part of the RayTech ecosystem.
            </p>
          </div>
          <FooterColumn title="Product" links={['How it thinks', 'Living Workspace', 'Documents', 'Comparison']} />
          <FooterColumn title="RayTech" links={['RayTech Account', 'FlowNote', 'FlowSign', 'raytech.cloud']} />
          <FooterColumn title="Legal" links={['Privacy', 'Terms']} />
        </div>
      </footer>
    </div>
  )
}

function HeroSurface() {
  const thinking = [
    { icon: Upload, text: 'Upload Finance.xlsx', delay: '0s' },
    { icon: FileText, text: 'Document detected', meta: 'Financial performance report', delay: '1.1s' },
    { icon: SearchCheck, text: 'Business context understood', delay: '2.2s' },
    { icon: BarChart3, text: 'KPIs and variance extracted', delay: '3.3s' },
    { icon: AlertTriangle, text: 'Risk signals identified', delay: '4.4s' },
    { icon: Target, text: 'Intent inferred', meta: 'Executive investigation', delay: '5.5s' },
    { icon: ClipboardCheck, text: 'Living Workspace ready', delay: '6.6s' },
  ]

  const outputs = [
    { icon: BarChart3, text: 'Executive Dashboard' },
    { icon: SearchCheck, text: 'Root Cause' },
    { icon: Sparkles, text: 'AI Copilot' },
  ]

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(139,92,246,0.18),transparent_34%),radial-gradient(circle_at_45%_80%,rgba(168,85,247,0.12),transparent_30%)]" />
      <div className="absolute right-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] top-1/2 hidden w-[520px] -translate-y-1/2 rounded-2xl border border-border bg-card/65 p-4 shadow-2xl backdrop-blur-xl xl:block">
        <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
          <div>
            <p className="text-sm font-medium">Analyst thinking</p>
            <p className="mt-1 text-xs text-muted-foreground">From document to investigation</p>
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
              <p className="text-sm font-medium">Recommended workspace</p>
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
    { text: 'Document detected', delay: '0.6s' },
    { text: 'Business context understood', delay: '1.8s' },
    { text: 'Risk signals identified', delay: '3s' },
    { text: 'Investigation recommended', delay: '4.2s' },
    { text: 'Living Workspace ready', delay: '5.4s' },
  ]

  return (
    <div className="rounded-2xl border border-border bg-card/65 p-4 shadow-2xl backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Analyst thinking</p>
          <p className="mt-1 text-xs text-muted-foreground">Finance.xlsx</p>
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
        Living Workspace ready
      </div>
    </div>
  )
}

function LivingWorkspaceShowcase() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <GlassCard className="overflow-hidden bg-card/70">
        <div className="mb-5 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Executive Dashboard</p>
            <h3 className="mt-1 text-2xl font-semibold">Financial performance investigation</h3>
          </div>
          <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
            Context preserved
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {['Revenue variance', 'Margin pressure', 'Forecast confidence'].map((metric, index) => (
            <div key={metric} className="rounded-lg border border-border bg-background/40 p-4">
              <p className="text-xs text-muted-foreground">{metric}</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{index === 0 ? '12.4%' : index === 1 ? 'High' : '78%'}</p>
              <div className="mt-4 h-1.5 rounded-full bg-border">
                <div className={`h-full rounded-full bg-primary ${index === 0 ? 'w-3/4' : index === 1 ? 'w-5/6' : 'w-2/3'}`} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-border bg-background/40 p-4">
            <p className="text-sm font-medium">Recommended action</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Open root cause investigation for margin pressure before generating the board presentation.
            </p>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
            <p className="text-sm font-medium">AI Copilot</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              “The strongest signal is expense growth in the current period. Evidence is attached from Budget, Actual, and Variance fields.”
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        {livingWorkspaces.map((workspace) => (
          <GlassCard key={workspace.title} className="p-4">
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <workspace.icon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold">{workspace.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{workspace.text}</p>
              </div>
            </div>
          </GlassCard>
        ))}
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
