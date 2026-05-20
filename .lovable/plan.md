## UI-only: Per-service cost trends & compromise alerts

Build the full visual experience with mock time-series data. No database, no edge functions, no auth. Everything lives in-memory so you can validate the UX before committing to a backend.

### What gets added

**1. Mock data layer** (`src/lib/mockUsage.ts`)
- Generator that produces 90 days of hourly `usage_events` per service: `{ serviceId, timestamp, costUsd, tokens, model }`.
- Realistic patterns: business-hours weighting, weekend dips, per-service baseline.
- Injects 2 synthetic anomalies so alert UI has something to show: one budget breach on "API Credits", one velocity spike on "ChatGPT Plus".
- Helpers: `getDailyTotals(serviceId, days)`, `getHourlyHeatmap(serviceId)`, `getStackedDaily(services, days)`, `getBaseline(serviceId)`.

**2. New AIService fields** (extend the existing type, optional so nothing breaks)
- `expectedMonthlyBudget?: number`
- `baselineDailyCost?: number`
- `keyLabel?: string` (e.g. "sk-...4f2a")
- `keyStatus?: 'healthy' | 'warning' | 'compromised'`

**3. Trends section on the dashboard** (replaces the mock bar chart in `SpendingChart.tsx`)
- **Stacked area chart**: daily spend across all services, last 30 days, toggle 7/30/90d.
- **Per-service line chart with baseline band**: pick a service from a dropdown, see line vs. dashed baseline, shaded ±2σ band. Anomaly points rendered as red dots.
- **Hour-of-day heatmap**: 7×24 grid showing typical usage; surfaces "3am Tuesday" type oddities.

**4. Alerts banner & panel**
- Red banner at top of dashboard when any service has `keyStatus !== 'healthy'`: "Unusual activity on ChatGPT Plus — 4× baseline in last 24h".
- Click banner → opens an "Alerts" drawer listing all active alerts with: service, trigger reason, timestamp, sparkline of the suspicious window, and two buttons: **Rotate key** (opens provider docs link, marks service `healthy` locally) and **Dismiss**.

**5. Service detail drawer** (click any `AIServiceCard`)
- Header: name, provider, key label, status pill.
- Charts: 30d line + baseline, hourly heatmap, model breakdown donut.
- "Rotate key" action and a notes field (local only).

**6. Stats overview fixes**
- Replace hardcoded "+12% / +8% / +2" trend strings with values computed from the mock 90d data (this-month vs last-month).
- Add a 4th stat card: "Active alerts" (count of services with non-healthy status), red when > 0.

### Out of scope (deferred until you say "wire it up")
- Persistence, auth, real provider ingestion, email/Slack alerts, edge functions.
- Anomaly detection logic runs on mock data only — no real statistical engine yet.

### File-level changes
- New: `src/lib/mockUsage.ts`, `src/components/TrendsSection.tsx`, `src/components/AlertsBanner.tsx`, `src/components/AlertsDrawer.tsx`, `src/components/ServiceDetailDrawer.tsx`.
- Edit: `src/components/AIServiceCard.tsx` (add status pill, click handler), `src/components/StatsOverview.tsx` (real trends + alerts card), `src/components/SpendingChart.tsx` (replace mock trend with `TrendsSection`), `src/pages/Index.tsx` (mount banner + drawers, extend seed services with budget/baseline/keyLabel).

### Notes
- All charts use the existing `recharts` dependency — no new packages.
- All colors via existing semantic tokens in `index.css` (destructive for alerts, primary for baseline, muted for grid).
- Drawers use existing `sheet.tsx` shadcn component.
