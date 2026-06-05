export const TEMPLATES = [
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    description: 'High-level overview for decision makers',
    icon: 'BarChart3',
  },
  {
    id: 'meeting-summary',
    name: 'Meeting Summary',
    description: 'Key points and action items from meetings',
    icon: 'Users',
  },
  {
    id: 'research-brief',
    name: 'Research Brief',
    description: 'Condensed findings and insights',
    icon: 'BookOpen',
  },
  {
    id: 'project-status',
    name: 'Project Status',
    description: 'Progress updates and milestones',
    icon: 'CheckCircle2',
  },
  {
    id: 'competitive-analysis',
    name: 'Competitive Analysis',
    description: 'Market positioning and insights',
    icon: 'TrendingUp',
  },
  {
    id: 'technical-spec',
    name: 'Technical Specification',
    description: 'Architecture and implementation details',
    icon: 'Code2',
  },
];

export const TEMPLATE_PROMPTS: Record<string, string> = {
  'executive-summary':
    'Create a concise executive summary suitable for C-level executives. Focus on key metrics, business impact, and strategic implications.',
  'meeting-summary':
    'Summarize this meeting transcript. Include attendees, key discussion points, decisions made, and action items with owners.',
  'research-brief':
    'Create a research brief highlighting main findings, methodology, data quality, and implications for business decisions.',
  'project-status':
    'Generate a project status report covering completion percentage, milestones achieved, blockers, and next steps.',
  'competitive-analysis':
    'Analyze the competitive landscape. Include competitor overview, strengths, weaknesses, market positioning, and recommendations.',
  'technical-spec':
    'Create a technical specification document. Include system architecture, components, data flows, and implementation considerations.',
};

export const SAMPLE_SUMMARIES = [
  {
    id: '1',
    title: 'Q4 Board Meeting Summary',
    template: 'meeting-summary',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: '2',
    title: 'Market Research Findings',
    template: 'research-brief',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
  {
    id: '3',
    title: 'H1 2025 Competitive Analysis',
    template: 'competitive-analysis',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
  },
];
