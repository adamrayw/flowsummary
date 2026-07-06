# FlowSummary Product Specification

FlowSummary is an AI-powered document intelligence platform by RayTech. It should not behave like a chat application with file upload. It should behave like an AI analyst: a senior business analyst that receives a document, understands it, explains what it found, recommends the highest-value analyses, and generates professional outputs with minimal user effort.

Core product loop:

```text
Upload -> Understand -> Explain -> Recommend -> Generate -> Export -> Learn
```

The default user experience should be proactive. The AI should not ask, "What would you like me to do?" after upload. It should say, "I analyzed your document and here are the best things I can generate."

## 1. Complete UX Flow

### Primary Flow

1. Upload file
   - User drops or selects a document.
   - Supported initial formats: XLSX, CSV, PDF, DOCX, TXT.
   - Future formats: PPTX, images, scanned PDFs, JSON, XML, database exports, email exports.

2. AI understanding
   - System extracts text, tables, sheets, metadata, images, headers, field names, row counts, date patterns, currencies, language, and quality signals.
   - UI shows a structured processing timeline instead of a generic spinner.

3. Document classification
   - AI identifies document type, confidence, and evidence.
   - Example: "Attendance Report, 92% confidence, because the file contains employee IDs, attendance statuses, clock-in/clock-out timestamps, and date-based attendance metrics."

4. Context extraction
   - AI summarizes date range, organization, department, number of rows, number of columns, main metrics, dimensions, data quality issues, outliers, and possible relationships.

5. Insight preview
   - AI shows a short intelligent preview before asking the user to generate anything.
   - This is not the final report. It is a diagnostic briefing.

6. Recommendation engine
   - AI dynamically recommends actions based on document class, detected metrics, data quality, user history, and enterprise context.
   - Recommendations are generated, ranked, and explained.

7. User selects goal
   - User chooses a recommended output.
   - The best match is highlighted, but not forced.

8. Generation engine
   - AI generates the selected output using the matching template and output renderer.
   - Outputs should be presentation-ready.

9. Export
   - User exports to PDF, DOCX, PPTX, XLSX, CSV, or copies summary text.
   - Export availability depends on the generated artifact.

10. Follow-up
   - AI suggests the next useful action.
   - Example: "I found 24 employees with unusually high absences. A deeper anomaly analysis would be useful."

### UX State Model

```text
EMPTY
UPLOADING
EXTRACTING
CLASSIFYING
UNDERSTANDING
READY_TO_RECOMMEND
GENERATING
GENERATED
EXPORTING
ERROR_RECOVERABLE
ERROR_BLOCKED
```

Each state needs its own UI copy, progress behavior, and fallback action.

## 2. AI Decision Flow

The AI pipeline should use deterministic preprocessing plus LLM reasoning. Do not rely solely on LLM intelligence.

```text
File received
  -> Format detector
  -> Extraction pipeline
  -> Structure profiler
  -> Data quality profiler
  -> Classification engine
  -> Domain template selector
  -> Context extraction engine
  -> Insight preview generator
  -> Recommendation ranking engine
  -> User goal selection
  -> Output generation engine
  -> Export renderer
  -> Feedback and learning events
```

Decision layers:

1. Rule-based signals
   - File extension, MIME type, sheet names, column names, recurring keywords, row/column shape, date/currency patterns.

2. Statistical signals
   - Missing value rates, duplicate rates, numeric distributions, categorical cardinality, outlier thresholds, time-series continuity.

3. Semantic signals
   - LLM interpretation of labels, paragraphs, tables, document sections, and business meaning.

4. Behavioral signals
   - Past user actions, most selected outputs by document type, organization-level preferences, saved templates.

5. Confidence gates
   - High confidence: proceed automatically.
   - Medium confidence: proceed with transparent uncertainty.
   - Low confidence: use general analysis template and offer classification alternatives.

## 3. AI Reasoning Flow

The AI should internally reason like an analyst, then expose concise evidence to the user.

Internal reasoning checklist:

1. What is this document?
2. What business process does it represent?
3. What entities exist in the document?
4. What metrics can be measured?
5. What dimensions can segment the metrics?
6. What time period is covered?
7. What quality issues affect trust?
8. What patterns or anomalies are visible?
9. What executive questions are likely?
10. What outputs would create immediate value?

User-facing explanation should be brief:

```text
I identified this as an Attendance Report with high confidence.

Why:
- It contains employee identifiers and departments.
- It includes dates and clock-in/clock-out timestamps.
- It has attendance status values such as Present, Absent, Late, and Leave.
```

The AI should expose reasoning as evidence, not as a long chain-of-thought transcript.

## 4. Recommendation Engine Logic

Recommendations must be generated dynamically, not hardcoded as fixed buttons. Each recommendation should include:

- `id`
- `title`
- `description`
- `documentType`
- `outputType`
- `priorityScore`
- `confidence`
- `whyRecommended`
- `estimatedValue`
- `requiredInputs`
- `blockedReason`
- `templateId`
- `exportFormats`

### Ranking Formula

```text
priorityScore =
  documentTypeFit * 0.25 +
  dataAvailability * 0.20 +
  businessValue * 0.20 +
  userHistoryFit * 0.15 +
  organizationHistoryFit * 0.10 +
  freshnessOrUrgency * 0.05 +
  outputReadiness * 0.05
```

### Recommendation Families by Document Type

Attendance report:

- Executive Summary
- Attendance Trend
- Regional Comparison
- Late Arrival Analysis
- Absence Analysis
- Anomaly Detection
- Weekly Pattern
- Manager Report
- PowerPoint Report

Financial report:

- Board Summary
- Revenue Trend
- Expense Breakdown
- Profit Analysis
- Cash Flow Summary
- Budget Variance
- Forecast
- Risk Commentary
- Board Presentation

HR report:

- Headcount Summary
- Department Analysis
- Hiring Trend
- Turnover Risk
- Age Distribution
- Gender Analysis
- Promotion Candidate Review
- Workforce Planning Report

Sales report:

- Sales Performance
- Top Products
- Customer Segmentation
- Regional Sales
- Revenue Trend
- Forecast
- Sales Dashboard
- Pipeline Risk Analysis

Inventory report:

- Stock Health
- Slow Moving Items
- Fast Moving Items
- Reorder Recommendation
- Warehouse Comparison
- Inventory Forecast
- Stockout Risk Report

Meeting minutes:

- Executive Brief
- Decision Summary
- Action Item Tracker
- Risk and Dependency List
- Follow-up Email Draft
- Project Status Update

Contract:

- Obligation Summary
- Risk Review
- Renewal and Expiry Extraction
- Payment Terms Summary
- Clause Comparison
- Negotiation Brief

Unknown document:

- General Executive Summary
- Key Points Extraction
- Table Summary
- Issue Detection
- Action Plan
- Structured Data Export

### Best Match Behavior

If one recommendation is clearly most valuable, mark it as `bestMatch`.

Examples:

- Attendance report with many absence records: prioritize Absence Analysis.
- Financial report prepared monthly: prioritize Board Summary.
- Sales data with product and region columns: prioritize Sales Performance Dashboard.
- Contract with expiry dates: prioritize Obligation and Renewal Summary.

The UI should show why the recommendation is best:

```text
Best match because this document contains employee attendance status, timestamps, and department fields, with 24 unusual absence patterns detected.
```

## 5. Document Classification Logic

Classification should combine file structure, semantic evidence, and domain taxonomy.

### Classification Output

```ts
type DocumentClassification = {
  documentType: string
  industry?: string
  confidence: number
  evidence: string[]
  alternativeTypes: Array<{
    documentType: string
    confidence: number
    reason: string
  }>
  extractionWarnings: string[]
}
```

### Supported Initial Taxonomy

- Attendance Report
- Financial Report
- Sales Report
- HR Report
- Employee Database
- Meeting Minutes
- Project Progress
- Inventory Report
- Survey Results
- Invoice
- Purchase Order
- Contract
- Research Paper
- Government Report
- Medical Report
- Construction Report
- Log File
- Database Export
- Raw Dataset
- PowerPoint Presentation
- Word Proposal
- Unknown Document

### Signal Examples

Attendance Report:

- Columns: employee ID, name, department, status, clock in, clock out, shift, leave reason.
- Keywords: present, absent, late, leave, overtime, attendance.
- Metrics: attendance rate, absence count, late minutes, overtime hours.

Financial Report:

- Columns or sections: revenue, expense, profit, cost, margin, cash flow, budget, actual, variance.
- Units: currency symbols, accounting periods, fiscal year.
- Metrics: revenue, gross profit, net income, EBITDA, budget variance.

Contract:

- Sections: parties, term, payment, obligation, termination, liability, governing law.
- Dates: effective date, renewal date, expiry date.
- Entities: company names, addresses, signatories.

Unknown Document:

- Low confidence across known classes.
- Mixed or sparse structure.
- Extraction quality too poor.
- Use general document intelligence template.

## 6. Template Selection Logic

FlowSummary should have an intelligent template engine. Users should not manually choose analysis templates.

Template selection:

```text
classification + detected metrics + output goal + user preferences + organization policy
  -> template candidate list
  -> score templates
  -> select primary template
  -> fill required sections
  -> render output
```

### Template Registry

```ts
type AnalysisTemplate = {
  id: string
  name: string
  documentTypes: string[]
  industries: string[]
  outputTypes: string[]
  requiredSignals: string[]
  optionalSignals: string[]
  sections: TemplateSection[]
  chartRules: ChartRule[]
  qualityRules: QualityRule[]
  exportFormats: string[]
  version: string
}
```

### Core Templates

- Attendance Analytics Template
- Finance Executive Template
- Inventory Intelligence Template
- HR Analytics Template
- Sales Intelligence Template
- Meeting Summary Template
- Contract Analysis Template
- Research Summary Template
- Government Reporting Template
- General AI Analysis Template

### Template Fallback

If template confidence is low:

1. Use General AI Analysis Template.
2. Explain uncertainty.
3. Offer two or three possible interpretation paths.
4. Still provide useful extraction and summary.

## 7. Context Extraction Logic

Context extraction turns raw content into a structured document profile.

### Document Profile

```ts
type DocumentProfile = {
  file: {
    name: string
    type: string
    sizeBytes: number
    pageCount?: number
    sheetCount?: number
    language?: string
  }
  structure: {
    tables: number
    sheets: SheetProfile[]
    paragraphs: number
    images: number
    headers: string[]
  }
  data: {
    rowCount?: number
    columnCount?: number
    columns: ColumnProfile[]
    dateRange?: string
    currency?: string
    units: string[]
  }
  businessContext: {
    organization?: string
    department?: string
    period?: string
    entities: string[]
    metrics: string[]
    dimensions: string[]
    kpis: string[]
    possibleRelationships: string[]
  }
  quality: {
    missingValues: QualityIssue[]
    duplicates: QualityIssue[]
    outliers: QualityIssue[]
    inconsistencies: QualityIssue[]
    extractionWarnings: string[]
  }
}
```

### Extraction Requirements

The system should automatically inspect:

- file type
- structure
- sheets
- headers
- tables
- paragraphs
- images
- metadata
- language
- units
- date format
- currency
- duplicate data
- missing values

### Quality Signals

Quality signals should be surfaced before final generation:

- Missing values in important fields.
- Duplicate rows or duplicate IDs.
- Date gaps.
- Inconsistent currencies or units.
- Suspicious outliers.
- Merged spreadsheet cells that affect parsing.
- OCR confidence for scanned files.
- Very small sample size.
- Columns with ambiguous names.

## 8. Insight Generation Logic

Insight preview should feel intelligent but concise. It should answer: "What did the AI understand before generating an artifact?"

### Preview Structure

```text
I analyzed your document.

I found:
- [volume signal]
- [time period signal]
- [main business entities]
- [primary KPI]
- [important anomaly]
- [data quality issue]

Recommended next step:
[best match recommendation]
```

### Insight Types

- Descriptive: what exists in the document.
- Diagnostic: what looks unusual or important.
- Comparative: which groups differ.
- Temporal: how metrics move over time.
- Quality: what may affect trust.
- Executive: what leadership likely cares about.

### Guardrails

- Do not overstate conclusions from incomplete data.
- Distinguish observed facts from inferred meaning.
- Show confidence for classification and major insights.
- Mention data quality limitations.
- Avoid generating sensitive personal judgments from HR or medical data.

## 9. Output Generation Logic

Outputs must be presentation-ready. Each output should be generated from:

```text
Document profile + selected goal + template + generated insights + data tables + chart specs + export renderer
```

### Supported Output Types

Executive Summary:

- One-page leadership summary.
- Key findings.
- Business impact.
- Risks.
- Recommended actions.
- Data quality caveats.

PowerPoint:

- Title slide.
- Executive summary.
- Key metrics.
- Trend or comparison charts.
- Anomaly or risk slide.
- Recommendations.
- Appendix with methodology.

Word Report:

- Professional report structure.
- Table of contents for long reports.
- Context and scope.
- Findings.
- Analysis sections.
- Recommendations.
- Appendix.

Excel Summary:

- Cleaned summary sheet.
- Pivot-style summary tables.
- KPI table.
- Data quality sheet.
- Charts where appropriate.

Dashboard:

- KPI cards.
- Charts.
- Filters.
- Anomaly list.
- Recommendation panel.
- Export controls.

Risk Analysis:

- Risk register.
- Severity and likelihood.
- Evidence.
- Recommended mitigation.
- Owner or next action when available.

Action Plan:

- Prioritized action list.
- Rationale.
- Suggested owner category.
- Target timing.
- Dependencies.

### Chart Selection Rules

- Time-series metric: line chart.
- Category comparison: bar chart.
- Composition: stacked bar or donut chart.
- Distribution: histogram or box plot.
- Relationship: scatter plot.
- Geographic region: map only when location fields are reliable.
- Executive summary: no more than three primary visuals.

## 10. Adaptive Learning Strategy

FlowSummary should improve through product telemetry and explicit feedback, not only LLM prompts.

### Events to Track

- File uploaded.
- Document type detected.
- Classification corrected.
- Recommendation viewed.
- Recommendation selected.
- Recommendation ignored.
- Output generated.
- Export format selected.
- Output edited.
- Output regenerated.
- User saved template.
- User favorited output.
- User deleted output.

### Learning Loops

1. Recommendation ranking
   - Increase rank for actions frequently selected for a document type, organization, role, or industry.

2. Template improvement
   - Identify sections users delete or regenerate.
   - Promote sections users keep and export.

3. Classification refinement
   - Store correction events when users choose a different document type.
   - Add organization-specific vocabulary.

4. Export preference
   - Learn whether users prefer PPTX, DOCX, XLSX, or dashboard outputs per use case.

5. Industry adaptation
   - Build industry-specific templates and KPI libraries over time.

### Privacy and Enterprise Controls

- Organization-level learning should be isolated by tenant.
- Global learning should use anonymized aggregate events only.
- Sensitive content should not be used for cross-tenant training.
- Admins should be able to disable learning features.

## 11. Scalable System Architecture

### Recommended Architecture

```text
Frontend App
  -> Upload API
  -> File Storage
  -> Extraction Workers
  -> Document Profile Store
  -> Classification Service
  -> Template Registry
  -> Recommendation Service
  -> Generation Service
  -> Export Service
  -> History and Feedback Store
  -> Analytics and Learning Service
```

### Service Responsibilities

Frontend:

- Upload UX.
- Progress states.
- Insight preview.
- Recommendation selection.
- Generated output workspace.
- History, favorites, templates, exports.

Upload API:

- Validate file type and size.
- Create analysis job.
- Store original file securely.
- Return job ID.

Extraction workers:

- Parse documents asynchronously.
- Extract text, tables, metadata, sheets, images.
- Run data profiling.
- Produce normalized document profile.

Classification service:

- Use rules, embeddings, and LLM classification.
- Return document type, confidence, evidence, alternatives.

Template registry:

- Store versioned templates.
- Map document types to analysis logic and output structures.

Recommendation service:

- Generate ranked recommendations.
- Use document profile, template candidates, and learning signals.

Generation service:

- Produce structured artifacts.
- Keep generated content separated from renderer-specific formatting.

Export service:

- Convert structured artifacts to PDF, PPTX, DOCX, XLSX, CSV, or HTML.

History and feedback store:

- Store analysis sessions.
- Store generated artifacts.
- Store user actions.
- Support favorites and saved templates.

### Data Model Sketch

Core tables:

- `analysis_sessions`
- `uploaded_files`
- `document_profiles`
- `document_classifications`
- `recommendations`
- `generated_outputs`
- `export_jobs`
- `templates`
- `user_template_preferences`
- `feedback_events`
- `organization_learning_stats`

### Scaling to 100+ Document Types

Use a registry-based model:

```text
DocumentTypeDefinition
  -> signals
  -> required extractors
  -> metrics dictionary
  -> KPI library
  -> template mappings
  -> recommendation families
  -> quality rules
  -> export presets
```

Adding a new document type should not require rewriting the product flow.

## 12. Wireframe Descriptions

### Upload Screen

Purpose: start analysis with confidence.

Layout:

- Top navigation with FlowSummary identity, workspace switcher, user menu.
- Left history sidebar on desktop.
- Main upload area with drag-and-drop zone.
- Supported file formats and max size shown as secondary text.
- Recent analyses below upload area.
- Empty state should show examples of useful document outputs, not marketing copy.

Primary controls:

- Upload file.
- Choose from recent.
- Open saved template.

### Analysis Screen

Purpose: show that the AI is actively understanding the file.

Layout:

- Processing timeline:
  - Reading file.
  - Extracting tables and text.
  - Profiling data quality.
  - Classifying document.
  - Preparing recommendations.
- Document thumbnail or file metadata panel.
- Live detected signals as they become available.

### Detection Screen

Purpose: explain classification.

Layout:

- Classification card with document type and confidence.
- Evidence list.
- Alternative classifications if relevant.
- Document DNA panel:
  - rows
  - columns
  - sheets
  - date range
  - language
  - currency
  - missing values
  - duplicates

### Recommendation Screen

Purpose: guide user toward the best next action.

Layout:

- Insight preview at top.
- Best Match recommendation emphasized.
- Other recommendations grouped by output type:
  - Summary
  - Analysis
  - Presentation
  - Dashboard
  - Export
- Each recommendation shows why it is recommended.

### Generation Screen

Purpose: deliver a professional artifact.

Layout:

- Generated output preview.
- Right-side controls for export, regenerate, edit tone, and save template.
- Source trace panel for critical claims.
- Follow-up suggestions below final output.

### History Screen

Purpose: allow repeated enterprise use.

Layout:

- Search and filters by document type, date, owner, output type, favorites.
- Analysis list with classification, generated outputs, and export formats.
- Bulk delete or archive for admins.

### Enterprise Dashboard

Purpose: show organizational document intelligence activity.

Layout:

- Uploaded document volume.
- Common document types.
- Top generated output types.
- Time saved estimate.
- Template usage.
- Data quality trend.
- User adoption.
- Admin controls.

## 13. Component Hierarchy

```text
AppShell
  TopNav
  HistorySidebar
    RecentAnalysisList
    FavoritesList
    SavedTemplatesList
  MainWorkspace
    UploadScreen
      UploadZone
      SupportedFormatList
      RecentAnalyses
    AnalysisScreen
      ProcessingTimeline
      FileMetadataPanel
      DetectedSignalsPanel
    DetectionScreen
      ClassificationCard
      EvidenceList
      DocumentDNAPanel
      QualityIssuePanel
    RecommendationScreen
      InsightPreview
      RecommendationGrid
      RecommendationCard
      BestMatchBadge
    GenerationScreen
      OutputPreview
      ChartPanel
      NarrativeReport
      ExportToolbar
      SourceTracePanel
      FollowUpSuggestionList
  Settings
    TemplateManager
    ExportPreferences
    LearningControls
    OrganizationPolicy
```

## 14. Enterprise UX Recommendations

- Prioritize dense, scannable, work-focused layouts.
- Avoid making the interface feel like a chatbot.
- Use chat only as a secondary refinement surface after the AI has already analyzed and recommended actions.
- Show evidence and confidence for classification.
- Make export controls persistent after generation.
- Preserve analysis history by default.
- Let users favorite recurring outputs.
- Support saved templates, but keep automatic template selection as the default.
- Add admin controls for file retention, data learning, export formats, and audit logs.
- Support dark mode for long analytical sessions.
- Ensure keyboard accessibility for upload, recommendation selection, export, and history navigation.
- Use clear loading states that name the work being done.
- Make error states recoverable wherever possible.

## 15. AI Interaction Principles

1. Proactive by default
   - The AI recommends useful outputs before the user asks.

2. Analyst, not assistant
   - The AI should interpret business meaning, not merely summarize text.

3. Evidence-backed
   - Every classification and major insight should have visible evidence.

4. Output-oriented
   - The AI guides users toward reports, dashboards, presentations, and action plans.

5. Minimal prompting
   - Users should not need prompt engineering skills.

6. Confidence-aware
   - The AI should communicate uncertainty without blocking useful progress.

7. Template-driven
   - Domain-specific templates should shape analysis and generation.

8. Enterprise-safe
   - Respect privacy, tenant boundaries, auditability, and compliance.

9. Continually improving
   - Product telemetry should improve ranking, templates, and workflows.

## 16. Edge Cases and Fallback Behaviors

Unsupported file type:

- Explain supported formats.
- Offer conversion guidance.
- Do not attempt unreliable parsing.

Corrupted file:

- Show recoverable error.
- Ask user to upload a clean copy.
- Preserve failed job record for debugging if enterprise logging is enabled.

Scanned PDF or image-only document:

- Run OCR when available.
- Show OCR confidence.
- Warn if extraction quality is low.

Low classification confidence:

- Use General AI Analysis Template.
- Show likely alternatives.
- Let user correct document type.

Multiple document types in one file:

- Split into sections or sheets.
- Classify each major section.
- Recommend combined or per-section outputs.

Missing important columns:

- Disable recommendations that require unavailable fields.
- Explain blocked reason.
- Suggest available alternatives.

Sensitive personal data:

- Avoid unsupported judgments.
- Use aggregate analysis by default.
- Add privacy warnings for HR, medical, legal, and government documents.

Very large files:

- Process asynchronously.
- Show job status.
- Use sampling for preview, then full processing for generation.

Contradictory data:

- Flag inconsistency.
- Avoid definitive conclusions.
- Offer data quality report.

Language mismatch:

- Detect source language.
- Generate in user's preferred language when possible.
- Preserve original key terms where important.

Repeated uploads:

- Detect similar files.
- Offer comparison against previous period.

## 17. Future Roadmap

### Phase 1: Analyst MVP

- File upload for XLSX, CSV, PDF, DOCX, TXT.
- Structured extraction.
- Document classification.
- Insight preview.
- Dynamic recommendation engine.
- Executive summary generation.
- Saved analysis history.

### Phase 2: Professional Outputs

- PPTX export.
- DOCX export.
- XLSX summary export.
- Chart generation.
- Dashboard-style generated output.
- Source trace for claims.
- Favorite outputs.

### Phase 3: Template Intelligence

- Versioned template registry.
- Domain-specific templates.
- Saved organization templates.
- Template analytics.
- Admin-managed default templates.

### Phase 4: Adaptive Learning

- Recommendation learning.
- User and organization preferences.
- Classification correction learning.
- Export preference learning.
- Industry KPI libraries.

### Phase 5: Enterprise Scale

- Multi-tenant admin console.
- Audit logs.
- Role-based access control.
- Retention policies.
- SSO and organization policies.
- Background processing queue.
- Larger file support.

### Phase 6: Industry Expansion

- Government reporting.
- Finance and accounting.
- Healthcare operations.
- Manufacturing quality reports.
- Education reports.
- Construction progress and safety reports.
- Retail sales and inventory intelligence.
- Logistics performance reports.
- Legal contract intelligence.

### Phase 7: Comparative Intelligence

- Compare with previous period.
- Detect changes across uploads.
- Build recurring report workflows.
- Scheduled generation.
- Automated management packs.

## Implementation Priorities for Current Repo

The current dashboard already has the right high-level states: upload, analyzing, insights, and report. The next implementation steps should be:

1. Replace mock upload analysis with the existing `/api/document/upload` extraction pipeline.
2. Create a normalized `DocumentProfile` type shared by API and UI.
3. Add a classification service that returns type, confidence, evidence, and alternatives.
4. Replace fixed mock recommendations with a recommendation scoring function.
5. Store analysis sessions, classifications, recommendations, and generated outputs.
6. Build the generation workspace for selected recommendations.
7. Add export services after structured generated artifacts are stable.

The first product milestone should prove the full loop:

```text
Upload real file -> Extract profile -> Classify -> Preview insights -> Recommend actions -> Generate executive summary -> Save history
```
