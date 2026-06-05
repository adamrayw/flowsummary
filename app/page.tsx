'use client'

import { Button } from '@/components/ui/button'
import { buildAuthLogoutUrl } from '@/lib/raytech-account'
import { useAuthSession } from '@/hooks/use-auth-session'
import { ArrowRight, Zap, FileText, Users, Lightbulb, Clock, Shield, Sparkles, Play, Copy, Check, ChevronDown, LayoutDashboard, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

export default function Page() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
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

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleSignOut = () => {
    window.location.href = buildAuthLogoutUrl(`${window.location.origin}/signin`)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">FlowSummary</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition">Features</a>
            <a href="#usecases" className="text-sm text-muted-foreground hover:text-foreground transition">Use Cases</a>
            <a href="#examples" className="text-sm text-muted-foreground hover:text-foreground transition">Examples</a>
          </div>
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-border transition-colors"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                  {initials}
                </span>
                <span className="hidden sm:inline max-w-36 truncate">{userName}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-card shadow-lg z-50">
                  <div className="border-b border-border p-3">
                    <p className="truncate text-sm font-medium text-foreground">{userName}</p>
                    <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
                  </div>
                  <div className="p-2">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 rounded px-3 py-2 text-sm text-foreground hover:bg-border transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-red-400 hover:bg-border transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
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
                <Button size="sm" className="bg-primary hover:bg-primary/90">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Report Generation</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-balance">
            Turn raw information into <span className="text-primary">professional reports</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
            Paste notes, spreadsheets, reports, meeting notes, or raw data and generate professional summaries in seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/signup">
              <Button size="lg" className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                Start Summarizing Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              <Play className="w-4 h-4 mr-2" />
              View Demo
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mb-12">
            A Product by <span className="font-semibold text-foreground">raytech.cloud</span>
          </p>

          {/* Hero Visual - Transformation Flow */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-3xl mx-auto">
            <div className="space-y-3">
              <div className="h-24 bg-card border border-border rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">150</div>
                  <div className="text-xs text-muted-foreground">employees</div>
                </div>
              </div>
              <p className="text-sm font-medium">Raw Information</p>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-2xl text-primary">→</div>
            </div>

            <div className="space-y-3">
              <div className="h-24 bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 rounded-lg flex items-center justify-center p-4">
                <p className="text-sm leading-relaxed">
                  <span className="font-semibold text-primary">80%</span> attendance rate indicates strong compliance
                </p>
              </div>
              <p className="text-sm font-medium">Professional Report</p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="features" className="py-20 border-t border-border">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            Creating reports takes too much time
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Reports require repetitive, manual work that distracts from higher-value activities
          </p>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: FileText, title: 'Collect Data', desc: 'Gather information from multiple sources' },
              { icon: Lightbulb, title: 'Write Summaries', desc: 'Manually compose and refine text' },
              { icon: Clock, title: 'Prepare Reports', desc: 'Format and organize the content' },
              { icon: Users, title: 'Share Results', desc: 'Distribute to stakeholders' }
            ].map((item, i) => (
              <div key={i} className="space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 border-t border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            FlowSummary does the writing for you
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Three simple steps to professional reports
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Paste Information', desc: 'Copy and paste your raw content, data, or notes' },
              { step: '2', title: 'Describe What You Need', desc: 'Specify the style, format, or focus for your report' },
              { step: '3', title: 'Generate Professional Report', desc: 'Get polished, ready-to-use summaries instantly' }
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-5xl font-bold text-primary/20 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="usecases" className="py-20 border-t border-border">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            Built for every role
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Generate the right reports for your team
          </p>

          <div className="grid md:grid-cols-5 gap-6">
            {[
              { icon: '🎓', title: 'Students', items: ['Internship Reports', 'Research Summaries', 'Academic Writing'] },
              { icon: '🏢', title: 'Managers', items: ['Executive Summaries', 'Weekly Reports', 'Project Updates'] },
              { icon: '👥', title: 'HR Teams', items: ['Interview Summaries', 'Training Reports', 'Performance Reviews'] },
              { icon: '📚', title: 'Lecturers', items: ['Research Summaries', 'Workshop Reports', 'Academic Papers'] },
              { icon: '🏛️', title: 'Government', items: ['Monitoring Reports', 'Activity Reports', 'Attendance Reports'] }
            ].map((usecase, i) => (
              <div key={i} className="p-6 rounded-lg border border-border bg-card hover:border-primary/50 transition">
                <div className="text-3xl mb-3">{usecase.icon}</div>
                <h3 className="font-semibold mb-4">{usecase.title}</h3>
                <ul className="space-y-2">
                  {usecase.items.map((item, j) => (
                    <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Outputs */}
      <section id="examples" className="py-20 border-t border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">
            See what it generates
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'Executive Summary',
                content: 'Q3 performance exceeded targets with 32% YoY growth. Key drivers included market expansion in APAC (+45%) and product innovation. Operating margin improved to 28% despite inflationary pressures. Strategic initiatives on track for 2024 objectives.'
              },
              {
                title: 'Meeting Summary',
                content: 'Discussed Q4 roadmap, budget allocation, and team expansion. Decided to prioritize API v2 launch before year-end. Approved hiring for 3 engineering roles. Next sync in 2 weeks to review progress on action items.'
              },
              {
                title: 'Research Summary',
                content: 'Study analyzed 500+ enterprise SaaS adoption patterns. Findings: 73% prioritize security & compliance, 68% seek integration flexibility. Key recommendation: improve onboarding experience and compliance documentation to increase adoption rates.'
              },
              {
                title: 'Monitoring Report',
                content: 'System uptime: 99.98% | Avg response time: 145ms | Error rate: 0.02%. Database performance stable with peak load at 2PM. No critical incidents. All SLAs met. Scheduled maintenance window completed successfully.'
              }
            ].map((example, i) => (
              <div key={i} className="p-6 rounded-lg border border-border bg-background">
                <h3 className="font-semibold mb-4">{example.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{example.content}</p>
                <button
                  onClick={() => copyToClipboard(example.content, i)}
                  className="text-xs text-primary hover:text-primary/80 transition flex items-center gap-1"
                >
                  {copiedIndex === i ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 border-t border-border">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">
            Why FlowSummary
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: 'Save Time', desc: 'Generate reports 10x faster than manual writing' },
              { icon: Shield, title: 'Professional Writing', desc: 'AI-generated content maintains your brand voice' },
              { icon: Lightbulb, title: 'Works With Any Information', desc: 'Upload any format: text, data, spreadsheets, and more' },
              { icon: Clock, title: 'No Complex Setup', desc: 'Start summarizing in seconds, no training required' },
              { icon: Sparkles, title: 'Always Accurate', desc: 'Reviews your content for quality and coherence' },
              { icon: Users, title: 'Shareable', desc: 'Export and share reports with your team instantly' }
            ].map((benefit, i) => (
              <div key={i} className="space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 border-t border-border bg-gradient-to-r from-primary/10 via-primary/5 to-background">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Stop writing reports manually
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Generate professional summaries and reports in seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                Get Started Free
              </Button>
            </Link>
            <Link href="/signin">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Sign in with RayTech Account
              </Button>
            </Link>
          </div>

          <p className="text-sm text-muted-foreground mt-8">
            No credit card required • Free tier includes 10 reports/month
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-5 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">FlowSummary</h3>
              <p className="text-sm text-muted-foreground">Part of the RayTech ecosystem.</p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Features</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Blog</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-4">RayTech</h4>
              <ul className="space-y-2">
                <li><Link href="/signin" className="text-sm text-muted-foreground hover:text-foreground">RayTech Account</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>A Product by <span className="font-semibold text-foreground">raytech.cloud</span></p>
          </div>
        </div>
      </footer>
    </div>
  )
}
