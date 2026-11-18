# IQMS Frontend Redesign — Complete Agent Prompt
# Interactive Question Management Sheet (createsheets.com)
# Target: Polished, Industry-Ready, Premium DSA Prep Platform

---

## PREAMBLE FOR THE AGENT

You are a senior frontend engineer and product designer tasked with a complete visual and UX
overhaul of the IQMS (Interactive Question Management Sheet) web application. The codebase is a
React 19 + Vite 7 + Tailwind CSS 4 + Zustand 5 SPA. The backend is Spring Boot and MongoDB — you
will NOT touch any backend code, any Zustand store logic, any API layer, or any service layer. You
will ONLY modify frontend presentation files: pages, components, the CSS design system
(index.css), and small structural improvements within JSX that do not change any business logic.

The goal is to take the application from its current "functional but plain" state to a premium,
polished product that feels like a professional tool — inspired by platforms like LeetCode,
NeetCode, Codeforces, Notion, Linear, and Striver's A2Z — while keeping every single existing
feature accessible and working.

---

## PART 1: CONTEXT — WHAT THE APP IS AND DOES

### 1.1 Product Summary

IQMS is a full-stack web platform for DSA (Data Structures and Algorithms) and coding interview
preparation. Users create hierarchical "sheets" (Sheet → Topics → SubTopics → Questions), track
per-question solve progress, attach notes/links, set reminders and alarms, share sheets publicly,
view analytics, and optionally unlock premium features via Razorpay payment.

### 1.2 Complete Route / Page Inventory

Every page listed below MUST be redesigned. Nothing should be left untouched.

| Route | Page | Access | Description |
|---|---|---|---|
| `/home` | HomePage | Public | Landing + marketing page with promo slider |
| `/login` | LoginPage | Public only | Email/password login + Google OAuth + forgot password flow |
| `/signup` | SignUpPage | Public only | Registration form + OTP email verification step |
| `/app` | SheetPage (dashboard mode) | Protected | Sheet dashboard — list all sheets with sort/filter |
| `/app/:sheetId` | SheetPage (editor mode) | Protected | Single sheet editor with topic/subtopic/question tree |
| `/app/:username/:sheetSlug` | SheetPage (slug mode) | Protected | Same editor via slug URL |
| `/profile/:username` | ProfilePage / SharedPage | Mixed | Own profile OR public profile view |
| `/profile/:username/:sheetSlug` | SharedPage | Public | Public sheet view (read-only) |
| `/shared/:shareType/:shareId` | SharedPage | Public | Share-link based sheet/profile view |
| `/insights` | LearningInsightsPage | Protected+Premium | Analytics dashboard with charts |
| `/premium` | PremiumPage | Protected | Pricing / upgrade page with Razorpay checkout |
| `/sheets` | PublicSheetsPage | Protected | Browse company-wise and topic-specific public sheets |
| `/notifications` | NotificationsPage | Protected | Inbox, alerts, archived notifications |
| `/alerts` | AlertsPage | Protected | Alert list (sub-view of notifications) |
| `/alarms` | AlarmsPage | Protected | Create and manage timed alarms/reminders |
| `/edit-profile` | EditProfilePage | Protected | Edit user profile fields |
| `/add-accounts` | AddAccountsPage | Protected | Link external coding platform accounts |
| `/import/:sheetId?` | ImportPage | Protected | Import sheet from JSON |
| `/export/:sheetId?` | ExportPage | Protected | Export sheet as JSON/CSV |
| `/how-to-use` | HowToUsePage | Public | Feature guide and onboarding walkthrough |
| `/about` | AboutPage | Public | About the product |
| `/contact` | ContactPage | Public | Contact form |
| `/apply` | ApplyPage | Public | Application/join form |

### 1.3 Key Component Inventory

These components need full visual redesign:

- `AppShell` — outer layout shell (sidebar + topbar + content + footer)
- `Sidebar` — collapsible/expandable left nav with icons and tooltips
- `TopBar` — top header bar with welcome message, create button, theme toggle, user link
- `NotificationBell` — icon button that opens a floating notification drawer
- `NotificationDrawer` — floating panel showing notification list with tabs
- `SheetHeader` — sheet title + circular progress ring + metadata badges
- `EditorActionPanel` — right sidebar with Undo/Redo/Save/Discard/Import/Export/View buttons
- `TopicList` — the core question tree: topics → subtopics → questions with drag-and-drop
- `QuestionsTable` — tabular view of questions within a subtopic
- `QuestionDetailsDrawer` — slide-in drawer for question notes, links, difficulty, tags
- `AttemptLogModal` — modal for logging a solve attempt (result, time, mistakes, confidence)
- `DifficultyDistributionWidget` — donut/bar chart for difficulty breakdown
- `TopicDistributionChart` — bar chart for topic question distribution
- `DonutChart` — reusable SVG donut chart
- `ConfirmationModal` — generic modal for confirmations and alerts
- `SheetMetadataDrawer` — slide-in for editing sheet title/description
- `TopicReminderAlarmPanel` — panel for scheduling topic reminders/alarms
- `AddTopicForm` — inline form for adding a new topic
- `QuestionSearch` — search bar for filtering questions
- `Header` — simple public-page header
- `AlertBar` — dismissible banner for warnings/errors
- `OverviewRail` — right rail sidebar for SharedPage with sheet info
- `ReminderNotificationCenter` — background component for browser notification popup
- `ProgressBar` — horizontal fill bar
- `EmptyState` — placeholder for empty lists
- `Skeleton` / `SkeletonText` — loading state placeholders
- `StatCard` — stat display card on profile page
- `SurfaceCard` — generic content card
- `SectionHeader` — section title + description
- `DifficultyBadge` — colored difficulty chip
- `TopicChip` / `TopicChipsPreview` — tag chips for topic labels
- `DifficultyCategorySelector` — difficulty picker dropdown
- `ResourceLinksEditor` — list editor for solution/article/video links
- `PremiumLotusBadge` — premium user badge
- `ThemeCinematicToggle` — theme switcher
- `GoogleAuthButton` — Google sign-in button
- `InsightsDashboardComponents` — all chart/card components in the insights page
- `NotificationItemCard` — single notification row card

---

## PART 2: DESIGN SYSTEM

### 2.1 Inspiration References

Draw inspiration from these products when making design decisions:

**LeetCode** (leetcode.com)
- Two-column workspace layout with problem list on left, code/description on right
- Clean monochromatic color scheme, very tight spacing
- Status chips: solved (green), attempted (yellow), unsolved (gray)
- Difficulty badges: Easy (green), Medium (yellow/orange), Hard (red)
- Dense but very readable table rows for question lists

**NeetCode** (neetcode.io)
- Extremely clean, minimal — white/dark surfaces, accent blue
- Topic grouping with collapsible sections, progress bars per topic
- Clear visual hierarchy between topic headers and question rows
- Compact question rows with checkbox, title, difficulty, and external links

**Striver's A2Z Sheet** (takeuforward.org)
- Topic banners with large icons, question count chips
- Warm, approachable color palette
- Very clear "done/not done" toggle on each question row
- Progress percentage prominently displayed per topic

**Linear** (linear.app)
- Ultra-refined sidebar navigation with icons + labels
- Very subtle borders, muted backgrounds, high contrast text
- Keyboard-shortcut-first design, dense but airy
- Excellent empty states and loading states

**Notion** (notion.so)
- Clean page metaphor, editable inline titles
- Subtle hover states, content-first approach
- Excellent drag handle UX for reordering
- Breadcrumb and context navigation

**Codeforces**
- Rating badges with distinct colors (gray/green/cyan/blue/violet/orange/red)
- Dense leaderboard and problem table aesthetics
- Status indicators (AC, WA, TLE, CE) as small colored chips

**What to take from all of them combined:**
- The question tree should feel like NeetCode/LeetCode — dense, readable, progress visible
- The sidebar should feel like Linear — clean icons, collapsible, excellent collapsed state
- The sheet header should feel like Notion — inline editable, contextual actions
- Difficulty badges should feel like LeetCode — unmistakable color coding
- Progress rings and bars should feel like modern fitness apps — animated, satisfying
- The premium page should feel like Stripe's pricing — clear, confident, trust-inspiring

### 2.2 New Design Token System

The existing CSS variable system is good. Extend and refine it. The following additions and
changes go into `src/index.css`.

#### Typography Scale

Add Google Fonts imports at the top of `index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap');
```

- **Display / headings**: `Plus Jakarta Sans`, weights 700–800
- **Body**: `Plus Jakarta Sans`, weights 400–600
- **Code / monospace**: `JetBrains Mono` (for question links, code snippets, badges)
- Base font size: 14px (compact, LeetCode-style)
- Line height: 1.5 body, 1.2 headings

Add these tokens to `:root`:

```css
--font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Typography scale */
--text-xs: 11px;
--text-sm: 12px;
--text-base: 14px;
--text-md: 15px;
--text-lg: 17px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 30px;
--text-4xl: 38px;

/* Font weights */
--fw-normal: 400;
--fw-medium: 500;
--fw-semibold: 600;
--fw-bold: 700;
--fw-extrabold: 800;

/* Spacing scale */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;

/* Border radius */
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 14px;
--radius-xl: 18px;
--radius-2xl: 24px;
--radius-full: 9999px;

/* Transition presets */
--transition-fast: 120ms ease;
--transition-base: 200ms ease;
--transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);

/* Z-index scale */
--z-sidebar: 50;
--z-topbar: 60;
--z-drawer: 80;
--z-modal: 100;
--z-tooltip: 120;
--z-notification: 130;
```

#### Color Palette Refinement

For the **light theme** (`superman-light`), refine:

```css
:root, :root[data-theme="superman-light"] {
  /* Backgrounds */
  --background: #f4f6fb;           /* Slightly cooler, less pure white */
  --surface: #ffffff;
  --surface-elevated: #ffffff;
  --surface-subtle: #f0f3f9;
  --surface-muted: #e8edf6;

  /* Text */
  --text-primary: #0f1923;         /* Near-black, not pure black */
  --text-secondary: #3d5068;       /* Readable muted text */
  --text-tertiary: #6b7fa3;        /* Faint labels */
  --text-placeholder: #9dafc8;

  /* Brand accent — deeper blue */
  --accent-primary: #2563eb;
  --accent-primary-hover: #1d4ed8;
  --accent-primary-subtle: #eff6ff;
  --accent-primary-muted: #dbeafe;

  /* Status colors — LeetCode-inspired */
  --color-solved: #16a34a;         /* Definitive green */
  --color-solved-bg: #f0fdf4;
  --color-solved-border: #bbf7d0;
  --color-attempted: #d97706;      /* Amber for partial */
  --color-attempted-bg: #fffbeb;
  --color-attempted-border: #fde68a;
  --color-failed: #dc2626;         /* Red for failed */
  --color-failed-bg: #fef2f2;
  --color-failed-border: #fecaca;
  --color-unsolved: #94a3b8;       /* Neutral for untouched */

  /* Difficulty colors — LeetCode standard */
  --difficulty-easy: #00b8a3;      /* Teal-green */
  --difficulty-easy-bg: #e6f7f5;
  --difficulty-medium: #ffa116;    /* Orange */
  --difficulty-medium-bg: #fff7ed;
  --difficulty-hard: #ef4743;      /* Red */
  --difficulty-hard-bg: #fff1f1;

  /* Borders */
  --border-subtle: #e2e8f3;
  --border-base: #c8d3e8;
  --border-strong: #8fa5c8;

  /* Sidebar specific */
  --sidebar-bg: #0f1923;           /* Dark sidebar on light theme — like Linear */
  --sidebar-text: #c8d4e8;
  --sidebar-text-active: #ffffff;
  --sidebar-item-active-bg: rgba(255,255,255,0.12);
  --sidebar-item-hover-bg: rgba(255,255,255,0.07);
  --sidebar-border: rgba(255,255,255,0.08);
  --sidebar-section-label: rgba(255,255,255,0.35);

  /* Shadows */
  --shadow-xs: 0 1px 2px rgba(15,25,42,0.06);
  --shadow-sm: 0 2px 8px rgba(15,25,42,0.08), 0 1px 2px rgba(15,25,42,0.04);
  --shadow-md: 0 4px 16px rgba(15,25,42,0.10), 0 2px 4px rgba(15,25,42,0.06);
  --shadow-lg: 0 12px 40px rgba(15,25,42,0.14), 0 4px 8px rgba(15,25,42,0.06);
  --shadow-xl: 0 24px 64px rgba(15,25,42,0.18);
}
```

For the **dark theme** (`batman-dark`), refine:

```css
:root[data-theme="batman-dark"] {
  --background: #0d1117;           /* GitHub dark */
  --surface: #161b22;
  --surface-elevated: #1c2230;
  --surface-subtle: #111827;
  --surface-muted: #0d1117;

  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --text-tertiary: #6e7681;
  --text-placeholder: #484f58;

  --accent-primary: #58a6ff;
  --accent-primary-hover: #79b8ff;
  --accent-primary-subtle: rgba(88,166,255,0.10);
  --accent-primary-muted: rgba(88,166,255,0.18);

  --color-solved: #3fb950;
  --color-solved-bg: rgba(63,185,80,0.10);
  --color-solved-border: rgba(63,185,80,0.25);
  --color-attempted: #d29922;
  --color-attempted-bg: rgba(210,153,34,0.10);
  --color-attempted-border: rgba(210,153,34,0.25);
  --color-failed: #f85149;
  --color-failed-bg: rgba(248,81,73,0.10);
  --color-failed-border: rgba(248,81,73,0.25);
  --color-unsolved: #484f58;

  --difficulty-easy: #00b8a3;
  --difficulty-easy-bg: rgba(0,184,163,0.12);
  --difficulty-medium: #ffa116;
  --difficulty-medium-bg: rgba(255,161,22,0.12);
  --difficulty-hard: #ef4743;
  --difficulty-hard-bg: rgba(239,71,67,0.12);

  --border-subtle: rgba(48,54,69,0.8);
  --border-base: #30363d;
  --border-strong: #6e7681;

  --sidebar-bg: #010409;           /* Almost black sidebar */
  --sidebar-text: #8b949e;
  --sidebar-text-active: #e6edf3;
  --sidebar-item-active-bg: rgba(88,166,255,0.12);
  --sidebar-item-hover-bg: rgba(255,255,255,0.05);
  --sidebar-border: #21262d;
  --sidebar-section-label: rgba(139,148,158,0.6);

  --shadow-xs: 0 1px 2px rgba(1,4,9,0.3);
  --shadow-sm: 0 2px 8px rgba(1,4,9,0.4);
  --shadow-md: 0 4px 16px rgba(1,4,9,0.5);
  --shadow-lg: 0 12px 40px rgba(1,4,9,0.6);
  --shadow-xl: 0 24px 64px rgba(1,4,9,0.7);
}
```

### 2.3 Global Base Styles

Replace the body/root base styles in `index.css` with:

```css
*, *::before, *::after {
  box-sizing: border-box;
}

html {
  font-size: 14px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

body {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: var(--fw-normal);
  line-height: 1.5;
  color: var(--text-primary);
  background-color: var(--background);
  margin: 0;
  min-height: 100vh;
}

/* Monospace elements */
code, kbd, pre, .font-mono {
  font-family: var(--font-mono);
}

/* Focus styles — accessible but beautiful */
:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* Scrollbar refinement */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--border-base);
  border-radius: var(--radius-full);
}
::-webkit-scrollbar-thumb:hover {
  background: var(--border-strong);
}

/* Selection */
::selection {
  background: var(--accent-primary-muted);
  color: var(--text-primary);
}
```

### 2.4 Utility Class Overhaul

Rewrite every CSS utility class in `index.css`. Here is the complete new specification:

#### Buttons

```css
.btn-base {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--fw-semibold);
  line-height: 1;
  padding: 7px 14px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast),
              border-color var(--transition-fast), box-shadow var(--transition-fast),
              transform var(--transition-fast), opacity var(--transition-fast);
  white-space: nowrap;
  user-select: none;
  text-decoration: none;
  position: relative;
  overflow: hidden;
}
.btn-base:active:not(:disabled) {
  transform: translateY(1px);
}
.btn-base:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  pointer-events: none;
}

/* Primary — strong blue */
.btn-primary {
  background: var(--accent-primary);
  color: #ffffff;
  border-color: var(--accent-primary);
  box-shadow: 0 1px 2px rgba(37,99,235,0.2), inset 0 1px 0 rgba(255,255,255,0.08);
}
.btn-primary:hover:not(:disabled) {
  background: var(--accent-primary-hover);
  border-color: var(--accent-primary-hover);
  box-shadow: 0 3px 10px rgba(37,99,235,0.35);
}

/* Success — clean green */
.btn-success {
  background: var(--color-solved);
  color: #ffffff;
  border-color: var(--color-solved);
  box-shadow: 0 1px 2px rgba(22,163,74,0.2);
}
.btn-success:hover:not(:disabled) {
  background: #15803d;
  border-color: #15803d;
  box-shadow: 0 3px 10px rgba(22,163,74,0.35);
}

/* Danger */
.btn-danger {
  background: var(--color-failed);
  color: #ffffff;
  border-color: var(--color-failed);
}
.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
  border-color: #b91c1c;
  box-shadow: 0 3px 10px rgba(220,38,38,0.35);
}

/* Neutral — subtle ghost button */
.btn-neutral {
  background: var(--surface-elevated);
  color: var(--text-secondary);
  border-color: var(--border-base);
  box-shadow: var(--shadow-xs);
}
.btn-neutral:hover:not(:disabled) {
  background: var(--surface-muted);
  color: var(--text-primary);
  border-color: var(--border-strong);
}

/* Ghost — no background */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border-color: transparent;
}
.btn-ghost:hover:not(:disabled) {
  background: var(--surface-muted);
  color: var(--text-primary);
}

/* Icon button — square */
.btn-icon {
  padding: 7px;
  border-radius: var(--radius-md);
  aspect-ratio: 1;
}

/* Size variants */
.btn-sm {
  font-size: var(--text-xs);
  padding: 5px 10px;
  border-radius: var(--radius-sm);
}
.btn-lg {
  font-size: var(--text-md);
  padding: 10px 20px;
  border-radius: var(--radius-lg);
}
.btn-xl {
  font-size: var(--text-lg);
  padding: 14px 28px;
  border-radius: var(--radius-lg);
  font-weight: var(--fw-bold);
}
```

#### Form Fields

```css
.field-base {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: var(--fw-normal);
  color: var(--text-primary);
  background: var(--surface);
  border: 1px solid var(--border-base);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  line-height: 1.5;
  width: 100%;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast),
              background var(--transition-fast);
  appearance: none;
}
.field-base::placeholder {
  color: var(--text-placeholder);
}
.field-base:hover:not(:disabled):not(:focus) {
  border-color: var(--border-strong);
}
.field-base:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-primary-muted);
  outline: none;
}
.field-base:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  background: var(--surface-subtle);
}

/* Stack form layout */
.stack-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.stack-form-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--fw-semibold);
  color: var(--text-secondary);
  margin-bottom: 5px;
  letter-spacing: 0.01em;
}
```

#### Panels / Cards

```css
/* Base panel */
.panel {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xs);
}

/* Elevated panel */
.panel-elevated {
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

/* Muted/background panel */
.panel-muted {
  background: var(--surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}

/* Interactive panel (hoverable card) */
.panel-interactive {
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xs);
  transition: border-color var(--transition-base), box-shadow var(--transition-base),
              transform var(--transition-base);
  cursor: pointer;
}
.panel-interactive:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
```

#### Progress

```css
/* Horizontal progress bar */
.progress-track {
  height: 6px;
  background: var(--surface-muted);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 600ms cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--accent-primary);
}
.progress-fill--success {
  background: var(--color-solved);
}
.progress-fill--warning {
  background: var(--color-attempted);
}
.progress-fill--danger {
  background: var(--color-failed);
}

/* Thin variant */
.progress-track--thin {
  height: 3px;
}
```

#### Badges / Chips

```css
/* Generic badge */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  font-weight: var(--fw-semibold);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  white-space: nowrap;
  font-family: var(--font-sans);
  letter-spacing: 0.02em;
}

/* Difficulty badges — LeetCode standard */
.badge-easy {
  color: var(--difficulty-easy);
  background: var(--difficulty-easy-bg);
}
.badge-medium {
  color: var(--difficulty-medium);
  background: var(--difficulty-medium-bg);
}
.badge-hard {
  color: var(--difficulty-hard);
  background: var(--difficulty-hard-bg);
}

/* Status badges */
.badge-solved {
  color: var(--color-solved);
  background: var(--color-solved-bg);
}
.badge-attempted {
  color: var(--color-attempted);
  background: var(--color-attempted-bg);
}
.badge-failed {
  color: var(--color-failed);
  background: var(--color-failed-bg);
}
.badge-neutral {
  color: var(--text-tertiary);
  background: var(--surface-muted);
}
.badge-premium {
  color: #b45309;
  background: #fef3c7;
  border: 1px solid #fde68a;
}
```

#### Typography

```css
.page-title {
  font-size: var(--text-2xl);
  font-weight: var(--fw-bold);
  color: var(--text-primary);
  line-height: 1.2;
  letter-spacing: -0.02em;
}
.section-title {
  font-size: var(--text-lg);
  font-weight: var(--fw-semibold);
  color: var(--text-primary);
  line-height: 1.3;
  letter-spacing: -0.01em;
}
.card-title {
  font-size: var(--text-md);
  font-weight: var(--fw-semibold);
  color: var(--text-primary);
  line-height: 1.3;
}
.caption-text {
  font-size: var(--text-xs);
  font-weight: var(--fw-medium);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.meta-text {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.5;
}
.link-base {
  color: var(--accent-primary);
  text-decoration: none;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  font-size: inherit;
  transition: color var(--transition-fast);
}
.link-base:hover {
  color: var(--accent-primary-hover);
  text-decoration: underline;
}
.eyebrow {
  font-size: var(--text-xs);
  font-weight: var(--fw-semibold);
  text-transform: uppercase;
  letter-spacing: 0.10em;
  color: var(--text-tertiary);
}
```

#### Skeleton Loading

```css
@keyframes skeleton-shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.skeleton {
  background: linear-gradient(
    90deg,
    var(--surface-muted) 25%,
    var(--surface-subtle) 50%,
    var(--surface-muted) 75%
  );
  background-size: 800px 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}
```

#### App Shell Layout

```css
.app-shell {
  min-height: 100vh;
  background: var(--background);
}

.app-shell-grid {
  display: grid;
  grid-template-columns: var(--sidebar-width, 64px) 1fr;
  min-height: 100vh;
  transition: grid-template-columns var(--transition-slow);
}

.app-content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 0 16px 24px;
  max-width: 100%;
}

@media (min-width: 768px) {
  .app-content {
    padding: 0 20px 32px;
  }
}

@media (max-width: 767px) {
  .app-shell-grid {
    grid-template-columns: 1fr;
  }
}
```

#### Sidebar

```css
.sidebar {
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  height: 100vh;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width var(--transition-slow);
  z-index: var(--z-sidebar);
}

.sidebar-desktop-collapsed {
  width: 64px;
}
.sidebar-desktop-expanded {
  width: 240px;
}

/* Sidebar logo area */
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 12px;
  border-bottom: 1px solid var(--sidebar-border);
  min-height: 60px;
  flex-shrink: 0;
}
.sidebar-logo-mark {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: var(--fw-bold);
  color: #ffffff;
  flex-shrink: 0;
  font-family: var(--font-sans);
}
.sidebar-logo-text {
  font-size: var(--text-md);
  font-weight: var(--fw-bold);
  color: var(--sidebar-text-active);
  white-space: nowrap;
  overflow: hidden;
  opacity: 0;
  transition: opacity var(--transition-base);
  letter-spacing: -0.01em;
}
.sidebar-desktop-expanded .sidebar-logo-text {
  opacity: 1;
}

/* Sidebar navigation */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px 8px;
  scrollbar-width: none;
}
.sidebar-nav::-webkit-scrollbar {
  display: none;
}

.sidebar-section {
  margin-bottom: 6px;
}
.sidebar-section + .sidebar-section {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid var(--sidebar-border);
}
.sidebar-section-title {
  font-size: 10px;
  font-weight: var(--fw-semibold);
  text-transform: uppercase;
  letter-spacing: 0.10em;
  color: var(--sidebar-section-label);
  padding: 8px 8px 4px;
  white-space: nowrap;
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition: max-height var(--transition-base), opacity var(--transition-base);
}
.sidebar-section-title.is-visible {
  max-height: 32px;
  opacity: 1;
}

.sidebar-section-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--sidebar-text);
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: background var(--transition-fast), color var(--transition-fast);
  position: relative;
  font-family: var(--font-sans);
  white-space: nowrap;
  overflow: hidden;
}
.sidebar-nav-item:hover {
  background: var(--sidebar-item-hover-bg);
  color: var(--sidebar-text-active);
}
.sidebar-nav-item.is-active {
  background: var(--sidebar-item-active-bg);
  color: var(--sidebar-text-active);
}
.sidebar-nav-item.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: var(--accent-primary);
  border-radius: 0 2px 2px 0;
}

.sidebar-nav-icon {
  font-size: 16px;
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.85;
}
.sidebar-nav-item.is-active .sidebar-nav-icon {
  opacity: 1;
}
.sidebar-nav-label {
  font-size: var(--text-sm);
  font-weight: var(--fw-medium);
  overflow: hidden;
  opacity: 0;
  max-width: 0;
  transition: opacity var(--transition-base), max-width var(--transition-slow);
}
.sidebar-nav-label.is-visible {
  opacity: 1;
  max-width: 160px;
}

/* Sidebar tooltip */
.sidebar-tooltip {
  position: fixed;
  z-index: var(--z-tooltip);
  background: var(--text-primary);
  color: var(--surface);
  font-size: var(--text-xs);
  font-weight: var(--fw-semibold);
  padding: 5px 10px;
  border-radius: var(--radius-sm);
  pointer-events: none;
  white-space: nowrap;
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity var(--transition-fast), transform var(--transition-fast);
  box-shadow: var(--shadow-md);
}
.sidebar-tooltip.is-visible {
  opacity: 1;
  transform: translateX(0);
}

/* Sidebar lock indicator */
.sidebar-lock-indicator {
  margin-left: auto;
  font-size: 12px;
  opacity: 0.6;
}
.sidebar-lock-mask {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-md);
  background: rgba(0,0,0,0.04);
}

/* Sidebar footer (user/toggle area) */
.sidebar-footer {
  border-top: 1px solid var(--sidebar-border);
  padding: 10px 8px;
  flex-shrink: 0;
}
.sidebar-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 8px;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--sidebar-text);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
  font-size: 18px;
}
.sidebar-toggle-btn:hover {
  background: var(--sidebar-item-hover-bg);
  color: var(--sidebar-text-active);
}

/* Mobile sidebar */
.mobile-sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: calc(var(--z-sidebar) - 1);
  backdrop-filter: blur(2px);
  animation: fadeIn var(--transition-base);
}
.sidebar-mobile {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 260px;
  z-index: var(--z-sidebar);
  transform: translateX(-100%);
  transition: transform var(--transition-slow);
}
.sidebar-mobile.is-open {
  transform: translateX(0);
}

.mobile-sidebar-toggle {
  position: fixed;
  top: 14px;
  left: 14px;
  z-index: calc(var(--z-sidebar) - 2);
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-base);
  background: var(--surface-elevated);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  font-size: 16px;
  transition: background var(--transition-fast), color var(--transition-fast);
}
.mobile-sidebar-toggle:hover {
  background: var(--surface-muted);
  color: var(--text-primary);
}
.mobile-sidebar-toggle--hidden {
  opacity: 0;
  pointer-events: none;
}
@media (min-width: 768px) {
  .mobile-sidebar-toggle {
    display: none;
  }
}
```

#### TopBar

```css
.theme-topbar {
  position: sticky;
  top: 0;
  z-index: var(--z-topbar);
  background: var(--surface-elevated);
  border-bottom: 1px solid var(--border-subtle);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: color-mix(in srgb, var(--surface-elevated) 85%, transparent);
  margin-bottom: 0;
  padding: 10px 16px;
}
.theme-topbar__accent {
  display: none;
}

@media (min-width: 768px) {
  .theme-topbar {
    padding: 10px 20px;
  }
}
```

#### Modals / Drawers

```css
/* Overlay backdrop */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: var(--overlay-backdrop);
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: fadeIn var(--transition-base);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(16px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes slideRight {
  from { opacity: 0; transform: translateX(24px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Modal panel */
.modal-panel {
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 440px;
  padding: 24px;
  animation: slideUp var(--transition-slow);
  position: relative;
}
.modal-panel--wide {
  max-width: 620px;
}
.modal-title {
  font-size: var(--text-lg);
  font-weight: var(--fw-bold);
  color: var(--text-primary);
  letter-spacing: -0.01em;
  margin: 0 0 8px;
}
.modal-message {
  font-size: var(--text-base);
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 20px;
}
.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

/* Slide-in Drawer (right side) */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: var(--overlay-backdrop);
  z-index: var(--z-drawer);
  animation: fadeIn var(--transition-base);
}
.drawer-panel {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: min(480px, 100vw);
  background: var(--surface-elevated);
  border-left: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-xl);
  z-index: calc(var(--z-drawer) + 1);
  display: flex;
  flex-direction: column;
  animation: slideRight var(--transition-slow);
  overflow: hidden;
}
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}
.drawer-title {
  font-size: var(--text-md);
  font-weight: var(--fw-semibold);
  color: var(--text-primary);
}
.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
.drawer-footer {
  padding: 14px 20px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-shrink: 0;
}
```

#### Topic Tree (Question List) — The Core UI

```css
/* Topic section */
.topic-section {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--surface-elevated);
  overflow: hidden;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}
.topic-section:hover {
  border-color: var(--border-base);
}
.topic-section + .topic-section {
  margin-top: 8px;
}

/* Topic header row */
.topic-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  cursor: pointer;
  background: var(--surface-elevated);
  transition: background var(--transition-fast);
  user-select: none;
  border: none;
  width: 100%;
  text-align: left;
}
.topic-header:hover {
  background: var(--surface-muted);
}
.topic-header.is-expanded {
  border-bottom: 1px solid var(--border-subtle);
}

.topic-drag-handle {
  color: var(--text-placeholder);
  cursor: grab;
  font-size: 14px;
  flex-shrink: 0;
  padding: 2px;
  opacity: 0;
  transition: opacity var(--transition-fast);
}
.topic-section:hover .topic-drag-handle,
.topic-header:hover .topic-drag-handle {
  opacity: 1;
}
.topic-drag-handle:active {
  cursor: grabbing;
}

.topic-chevron {
  font-size: 12px;
  color: var(--text-tertiary);
  flex-shrink: 0;
  transition: transform var(--transition-base);
}
.topic-chevron.is-expanded {
  transform: rotate(90deg);
}

.topic-title-text {
  font-size: var(--text-md);
  font-weight: var(--fw-semibold);
  color: var(--text-primary);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topic-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.topic-progress-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  font-weight: var(--fw-semibold);
  font-family: var(--font-mono);
  color: var(--text-secondary);
  background: var(--surface-muted);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  white-space: nowrap;
}
.topic-progress-pill.is-complete {
  color: var(--color-solved);
  background: var(--color-solved-bg);
}

/* Topic progress mini bar */
.topic-mini-progress {
  height: 3px;
  background: var(--border-subtle);
  border-radius: var(--radius-full);
  overflow: hidden;
  width: 64px;
  flex-shrink: 0;
}
.topic-mini-progress-fill {
  height: 100%;
  background: var(--accent-primary);
  border-radius: var(--radius-full);
  transition: width 500ms ease;
}
.topic-mini-progress-fill.is-complete {
  background: var(--color-solved);
}

/* Topic actions (edit/delete) */
.topic-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity var(--transition-fast);
}
.topic-header:hover .topic-actions,
.topic-section:focus-within .topic-actions {
  opacity: 1;
}

/* Subtopic section */
.subtopic-section {
  border-top: 1px solid var(--border-subtle);
}
.subtopic-section + .subtopic-section {
  border-top: 1px solid var(--border-subtle);
}

.subtopic-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px 9px 32px;
  cursor: pointer;
  background: var(--surface);
  transition: background var(--transition-fast);
  border: none;
  width: 100%;
  text-align: left;
}
.subtopic-header:hover {
  background: var(--surface-subtle);
}
.subtopic-header.is-expanded {
  border-bottom: 1px solid var(--border-subtle);
}

.subtopic-title-text {
  font-size: var(--text-sm);
  font-weight: var(--fw-semibold);
  color: var(--text-secondary);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Question row */
.question-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px 9px 48px;
  background: var(--surface);
  border-top: 1px solid var(--border-subtle);
  transition: background var(--transition-fast);
  position: relative;
}
.question-row:hover {
  background: var(--surface-subtle);
}
.question-row.is-solved {
  background: color-mix(in srgb, var(--color-solved-bg) 50%, var(--surface));
}
.question-row.is-attempted {
  background: color-mix(in srgb, var(--color-attempted-bg) 40%, var(--surface));
}

/* Solve status toggle button */
.solve-toggle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--border-strong);
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color var(--transition-fast), background var(--transition-fast),
              transform var(--transition-fast);
  padding: 0;
  font-size: 11px;
}
.solve-toggle:hover {
  border-color: var(--color-solved);
  transform: scale(1.1);
}
.solve-toggle.is-solved {
  background: var(--color-solved);
  border-color: var(--color-solved);
  color: #ffffff;
}
.solve-toggle.is-attempted {
  background: var(--color-attempted);
  border-color: var(--color-attempted);
  color: #ffffff;
}
.solve-toggle.is-failed {
  background: var(--color-failed);
  border-color: var(--color-failed);
  color: #ffffff;
}

.question-title {
  flex: 1;
  min-width: 0;
  font-size: var(--text-sm);
  font-weight: var(--fw-medium);
  color: var(--text-primary);
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color var(--transition-fast);
}
.question-title:hover {
  color: var(--accent-primary);
}
.question-title.is-solved {
  color: var(--text-tertiary);
  text-decoration: line-through;
  text-decoration-color: var(--color-solved);
}

.question-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity var(--transition-fast);
}
.question-row:hover .question-actions {
  opacity: 1;
}

/* External link button inside question row */
.q-link-btn {
  font-size: 12px;
  color: var(--text-tertiary);
  text-decoration: none;
  padding: 3px 6px;
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast), background var(--transition-fast);
  border: none;
  background: none;
  cursor: pointer;
  font-family: var(--font-mono);
}
.q-link-btn:hover {
  color: var(--accent-primary);
  background: var(--accent-primary-subtle);
}

/* Inline edit input */
.inline-edit-input {
  font-family: var(--font-sans);
  font-size: inherit;
  font-weight: inherit;
  color: var(--text-primary);
  background: var(--surface);
  border: 1px solid var(--accent-primary);
  border-radius: var(--radius-sm);
  padding: 3px 8px;
  box-shadow: 0 0 0 3px var(--accent-primary-muted);
  outline: none;
  width: 100%;
}
```

#### Notification Bell / Drawer

```css
.notification-bell-btn {
  position: relative;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-base);
  background: var(--surface-elevated);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  transition: background var(--transition-fast), color var(--transition-fast),
              border-color var(--transition-fast);
}
.notification-bell-btn:hover {
  background: var(--surface-muted);
  color: var(--text-primary);
  border-color: var(--border-strong);
}
.notification-bell-btn.has-unread {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}

.notification-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  border-radius: var(--radius-full);
  background: var(--color-failed);
  color: #fff;
  font-size: 9px;
  font-weight: var(--fw-bold);
  font-family: var(--font-mono);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  border: 2px solid var(--surface-elevated);
}

.notification-drawer-panel {
  position: fixed;
  z-index: var(--z-notification);
  width: 360px;
  max-height: 520px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-base);
  background: var(--surface-elevated);
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp var(--transition-base);
}
.notification-drawer-header {
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.notification-drawer-tabs {
  display: flex;
  gap: 2px;
  padding: 8px 12px 0;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}
.notification-tab {
  font-size: var(--text-xs);
  font-weight: var(--fw-semibold);
  padding: 6px 12px;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: color var(--transition-fast), background var(--transition-fast);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.notification-tab:hover {
  color: var(--text-secondary);
}
.notification-tab.is-active {
  color: var(--accent-primary);
  border-bottom-color: var(--accent-primary);
}
.notification-drawer-body {
  flex: 1;
  overflow-y: auto;
}
```

#### SheetHeader (progress ring + metadata)

```css
.sheet-header-card {
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: 20px 24px;
  display: flex;
  align-items: flex-start;
  gap: 20px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 16px;
}

.sheet-progress-ring {
  flex-shrink: 0;
  position: relative;
  width: 80px;
  height: 80px;
}
.sheet-progress-ring svg {
  transform: rotate(-90deg);
}
.sheet-progress-ring-track {
  fill: none;
  stroke: var(--surface-muted);
  stroke-width: 6;
}
.sheet-progress-ring-fill {
  fill: none;
  stroke: var(--accent-primary);
  stroke-width: 6;
  stroke-linecap: round;
  transition: stroke-dashoffset 800ms cubic-bezier(0.4, 0, 0.2, 1);
}
.sheet-progress-ring-fill.is-complete {
  stroke: var(--color-solved);
}
.sheet-progress-ring-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
}
.sheet-progress-ring-pct {
  font-size: var(--text-md);
  font-weight: var(--fw-bold);
  color: var(--text-primary);
  font-family: var(--font-mono);
  line-height: 1;
}
.sheet-progress-ring-sub {
  font-size: 9px;
  color: var(--text-tertiary);
  font-family: var(--font-mono);
  margin-top: 1px;
}

.sheet-header-body {
  flex: 1;
  min-width: 0;
}
.sheet-header-title {
  font-size: var(--text-xl);
  font-weight: var(--fw-bold);
  color: var(--text-primary);
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin: 0;
}
.sheet-header-desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 4px 0 10px;
  line-height: 1.5;
}
.sheet-header-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
```

#### Editor Action Panel

```css
.editor-panel {
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 16px;
  box-shadow: var(--shadow-sm);
}
.editor-panel-title {
  font-size: var(--text-sm);
  font-weight: var(--fw-semibold);
  color: var(--text-primary);
  margin: 0 0 2px;
}
.editor-panel-desc {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin: 0 0 14px;
}
.editor-section {
  margin-top: 14px;
}
.editor-section + .editor-section {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--border-subtle);
}
.editor-section-label {
  font-size: 10px;
  font-weight: var(--fw-semibold);
  text-transform: uppercase;
  letter-spacing: 0.10em;
  color: var(--text-tertiary);
  margin-bottom: 6px;
}
```

#### Alert Bar

```css
.alert-bar {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  font-size: var(--text-sm);
  margin-bottom: 12px;
  animation: slideUp var(--transition-base);
}
.alert-bar--warning {
  background: var(--color-attempted-bg);
  border-color: var(--color-attempted-border);
  color: #92400e;
}
.alert-bar--danger {
  background: var(--color-failed-bg);
  border-color: var(--color-failed-border);
  color: #991b1b;
}
.alert-bar--info {
  background: var(--accent-primary-muted);
  border-color: var(--accent-primary);
  color: #1e40af;
}
```

#### Transitions

```css
@keyframes section-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.section-fade-in {
  animation: section-fade-in 300ms ease both;
}
```

---

## PART 3: COMPONENT-BY-COMPONENT REDESIGN SPECIFICATION

### 3.1 Sidebar (`src/components/Sidebar.jsx`)

**Current problems:**
- Uses emoji text as icons — inconsistent and ugly
- Collapsed state has no visible logo mark
- Section dividers are not visible in collapsed state
- No user avatar or account area at bottom
- Theme toggle is in TopBar, should be accessible from sidebar bottom

**New design:**
- Replace emoji icons with inline SVG icon components or use a consistent icon set
  (recommended: use unicode symbols but style them properly, or embed minimal SVGs)
- Add a logo mark at the top — a small `CS` branded square with accent color
- Show the logo text "CreateSheets" when expanded, hide when collapsed
- Sidebar uses `--sidebar-bg` (dark) for both light and dark theme for continuity
- Section labels appear only when expanded, using `.sidebar-section-title` class
- Add a collapse/expand toggle button at the very bottom of the sidebar
- Add user avatar area at the bottom showing user initials + name when expanded
- Active item has a left-side accent bar (3px wide, accent color)
- Tooltips appear on the right of collapsed sidebar items (already exists, refine styling)
- Premium-locked items: show lock icon on the right, apply subtle opacity

**Icon replacements** (replace emoji with descriptive text-based icons using a unicode set):
- Home: `⌂` → use SVG home icon or styled symbol
- Sheets: `▦` → keep but restyle
- Profile: `◉` → keep but restyle
- Premium: keep star icon but make it gold/amber colored when active
- Notifications/Inbox: bell Unicode `🔔` → styled bell icon
- Reminders/Alarms: clock `⏰` → styled clock icon
- Insights: `◌` → chart bar icon
- Public Sheets: `◎` → grid icon
- How to Use: `?` → styled question mark
- About: `i` → info icon

**Implementation notes:**
- Keep all existing `sections` config and navigation logic unchanged
- Keep all existing `lockedRoutes`, `onLockedItemClick` logic unchanged
- Only change the visual rendering — classes, layout, and styles
- The collapse state toggle: call `onToggle` prop (already exists)
- Mobile: the existing mobile drawer pattern should be preserved and restyled

```jsx
// Rough structure for the new sidebar bottom area:
<div className="sidebar-footer">
  <div className={`flex items-center gap-2 px-2 py-2 rounded-lg overflow-hidden`}>
    <div className="sidebar-user-avatar">
      {/* User initials */}
      {(currentUser?.fullName || currentUser?.username || "U")[0].toUpperCase()}
    </div>
    <div className={`sidebar-user-info ${isSidebarOpen ? 'opacity-100' : 'opacity-0 max-w-0'} transition-all duration-200 overflow-hidden`}>
      <p className="text-xs font-semibold text-[var(--sidebar-text-active)] truncate">
        {currentUser?.fullName || currentUser?.username}
      </p>
      <p className="text-[10px] text-[var(--sidebar-section-label)] truncate">
        {currentUser?.email}
      </p>
    </div>
  </div>
  <button className="sidebar-toggle-btn" onClick={onToggle} aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
    {isSidebarOpen ? '←' : '→'}
  </button>
</div>
```

Add this CSS to `index.css`:
```css
.sidebar-user-avatar {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  background: var(--accent-primary);
  color: #ffffff;
  font-size: var(--text-xs);
  font-weight: var(--fw-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-family: var(--font-sans);
}
```

### 3.2 TopBar (`src/components/TopBar.jsx`)

**Current problems:**
- Too text-heavy, "Track your growth. Build your legacy on the left" is awkward
- Theme toggle is cluttered with other elements
- No search functionality (no global search exists yet — don't add search)
- Emoji logo mark looks like a placeholder

**New design:**
- Clean horizontal bar with subtle background and bottom border
- Left: breadcrumb or current page name (pass as prop or read from route)
- Right: Create button (green), notification bell, theme toggle, user avatar button
- Remove the "Welcome back" message from the topbar — it belongs in the sidebar
- The topbar should be compact — 52px height max
- Create button: use `+ New Sheet` label, `btn-primary btn-sm` style
- User avatar button: show user initials in a circle, clicking goes to profile

**Props that change:**
- Remove `theme` and `onThemeChange` props from TopBar — the `ThemeCinematicToggle` can stay embedded
- The `userLabel` prop still routes to profile

```jsx
// New TopBar structure:
<header className="theme-topbar flex items-center justify-between gap-3">
  {/* Left area — page context */}
  <div className="flex items-center gap-2 ml-10 md:ml-0">
    {/* Breadcrumb or empty */}
  </div>

  {/* Right area — actions */}
  <div className="flex items-center gap-2">
    <Link to={ROUTES.APP} className="btn-base btn-primary btn-sm">
      + New Sheet
    </Link>
    <NotificationBell compact />
    <ThemeCinematicToggle />
    <Link to={getUserProfileRoute(currentUsername)} className="topbar-user-btn">
      <span className="topbar-avatar">
        {(displayName[0] || 'U').toUpperCase()}
      </span>
      <span className="topbar-username hidden md:inline">
        {userLabel}
      </span>
    </Link>
  </div>
</header>
```

Add CSS:
```css
.topbar-user-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 4px 10px 4px 4px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-base);
  background: var(--surface-elevated);
  color: var(--text-secondary);
  cursor: pointer;
  text-decoration: none;
  font-size: var(--text-sm);
  font-weight: var(--fw-medium);
  transition: border-color var(--transition-fast), color var(--transition-fast),
              background var(--transition-fast);
}
.topbar-user-btn:hover {
  border-color: var(--border-strong);
  color: var(--text-primary);
  background: var(--surface-muted);
}
.topbar-avatar {
  width: 26px;
  height: 26px;
  border-radius: var(--radius-full);
  background: var(--accent-primary);
  color: #ffffff;
  font-size: var(--text-xs);
  font-weight: var(--fw-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-family: var(--font-sans);
}
.topbar-username {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

### 3.3 AppShell (`src/components/AppShell.jsx`)

**Current problems:**
- Content area has inconsistent padding
- Footer links are adequate but styling is bland
- Right panel layout works, but the sticky positioning is unreliable

**New design:**
- Grid layout with proper sidebar width handling
- Content area: `px-4 pb-8 md:px-6`
- Max content width: `1280px` centered
- Footer: minimal, single line with copyright and links, proper spacing
- Remove the hardcoded `theme` and `onThemeChange` props passing through (they should live in store)
- Keep `rightPanel` prop for the EditorActionPanel aside layout

```jsx
// New footer:
<footer className="app-footer">
  <div className="app-footer-inner">
    <span className="text-xs text-[var(--text-tertiary)]">
      © {currentYear} CreateSheets · IQMS
    </span>
    <nav className="flex items-center gap-4">
      {footerLinks.map((link) => (
        <a key={link.href} href={link.href} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
          {link.label}
        </a>
      ))}
    </nav>
  </div>
</footer>
```

Add CSS:
```css
.app-footer {
  margin-top: 48px;
  padding-top: 16px;
  border-top: 1px solid var(--border-subtle);
}
.app-footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
```

### 3.4 SheetPage — Dashboard Mode (no sheetId)

**Current problems:**
- Sheet cards are information-dense but visually flat and generic
- Action buttons crowd the card (Make Private, Disable Shared Progress, Archive, Copy, Delete all visible)
- No visual distinction between public and private sheets
- Progress bar is present but feels like an afterthought
- Sort/filter controls are plain selects

**New design — Sheet Dashboard:**

Layout: 2-column grid on large screens, 1-column on mobile.

Each sheet card is a proper card with:
- Top area: sheet title (large, semibold) + visibility badge (Public/Private)
- Middle: progress bar + `X/Y questions` label
- Bottom: created/updated dates in small meta text
- Right side: a `...` overflow menu button (kebab menu on hover) that shows:
  Open | Make Public/Private | Enable/Disable Shared Progress | Archive/Restore | Duplicate | Delete
- On hover: card lifts with `panel-interactive` style
- Solved percentage shown as a colored pill (green if >70%, amber if 30-70%, gray if <30%)
- Archived sheets: slightly muted, show "Archived" badge

Header controls:
- Create Sheet button: large, prominent `btn-primary btn-lg` at top
- Sort and filter: styled pill-style toggle buttons instead of plain `<select>` elements
  - Sort options as clickable pills: "Last edited | Created | Progress | Questions | A-Z"
  - Filter options as clickable pills: "All | Public | Private | Archived"

```css
/* Sheet card */
.sheet-card {
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: border-color var(--transition-base), box-shadow var(--transition-base),
              transform var(--transition-base);
  cursor: pointer;
  position: relative;
}
.sheet-card:hover {
  border-color: var(--border-base);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.sheet-card-title {
  font-size: var(--text-lg);
  font-weight: var(--fw-bold);
  color: var(--text-primary);
  letter-spacing: -0.01em;
  line-height: 1.3;
  margin: 0;
}
.sheet-card-desc {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sheet-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
}
.sheet-card-dates {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}

/* Progress pill */
.progress-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  font-weight: var(--fw-semibold);
  font-family: var(--font-mono);
  padding: 3px 8px;
  border-radius: var(--radius-full);
}
.progress-pill--high {
  color: var(--color-solved);
  background: var(--color-solved-bg);
}
.progress-pill--mid {
  color: var(--color-attempted);
  background: var(--color-attempted-bg);
}
.progress-pill--low {
  color: var(--text-tertiary);
  background: var(--surface-muted);
}

/* Pill toggle group (sort/filter) */
.pill-group {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 3px;
  background: var(--surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  width: fit-content;
}
.pill-option {
  font-size: var(--text-xs);
  font-weight: var(--fw-semibold);
  padding: 5px 12px;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast),
              box-shadow var(--transition-fast);
  white-space: nowrap;
}
.pill-option:hover {
  color: var(--text-secondary);
  background: var(--surface-muted);
}
.pill-option.is-active {
  background: var(--surface-elevated);
  color: var(--text-primary);
  box-shadow: var(--shadow-xs);
}

/* Kebab menu */
.kebab-menu-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  opacity: 0;
  transition: opacity var(--transition-fast), background var(--transition-fast),
              border-color var(--transition-fast), color var(--transition-fast);
}
.sheet-card:hover .kebab-menu-btn {
  opacity: 1;
}
.kebab-menu-btn:hover {
  background: var(--surface-muted);
  border-color: var(--border-base);
  color: var(--text-primary);
}

.kebab-dropdown {
  position: absolute;
  top: 40px;
  right: 12px;
  z-index: 20;
  background: var(--surface-elevated);
  border: 1px solid var(--border-base);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  min-width: 180px;
  overflow: hidden;
  animation: slideUp var(--transition-base);
}
.kebab-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 9px 14px;
  font-size: var(--text-sm);
  font-weight: var(--fw-medium);
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background var(--transition-fast), color var(--transition-fast);
  font-family: var(--font-sans);
}
.kebab-item:hover {
  background: var(--surface-muted);
  color: var(--text-primary);
}
.kebab-item--danger {
  color: var(--color-failed);
}
.kebab-item--danger:hover {
  background: var(--color-failed-bg);
  color: var(--color-failed);
}
.kebab-divider {
  height: 1px;
  background: var(--border-subtle);
  margin: 4px 0;
}
```

**Implementation notes for dashboard cards:**
- Replace the current map of sheet cards with the new `sheet-card` layout
- Replace the two rows of action buttons with a `kebab-menu-btn` + `kebab-dropdown`
- The kebab dropdown opens on click (use a local `useState` per card or a single shared state with the card's id)
- Keep ALL existing `onClick` handlers from `groupedSheetActionsById` — just trigger them from the dropdown
- Close the dropdown when clicking outside (use `useEffect` + document click listener)
- The "Open" action navigates directly (clicking the card itself also navigates)
- Sort/filter: replace `<select>` elements with `pill-group` + `pill-option` buttons

### 3.5 SheetPage — Editor Mode (with sheetId)

**Current problems:**
- The `SheetHeader` is good conceptually but styled blandly
- The action buttons panel on the right feels disconnected and text-heavy
- The overall page has too many small action buttons scattered
- The `DifficultyDistributionWidget` and `TopicDistributionChart` take too much vertical space on large screens

**New design:**
- `SheetHeader` card at top: use the new `.sheet-header-card` styles with animated progress ring
- Below the header: a compact status row showing visibility, archive status, share progress toggle
- `EditorActionPanel` in the right aside: cleaner grouping with icon+label buttons
- Charts: move to a collapsible "Analytics" section below the topic list, expanded by default on desktop, collapsed on mobile. Use a `<details>` or state-based toggle with a nice header.
- The `AddTopicForm` should look like a clean input row with a plus button, not a labeled form
- `QuestionSearch` should be a prominent search bar with an icon prefix

**AddTopicForm redesign:**

```css
.add-topic-form {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 10px 14px;
  background: var(--surface-subtle);
  border: 1px dashed var(--border-base);
  border-radius: var(--radius-lg);
  margin-bottom: 12px;
  transition: border-color var(--transition-fast), background var(--transition-fast);
}
.add-topic-form:focus-within {
  border-color: var(--accent-primary);
  border-style: solid;
  background: var(--surface-elevated);
}
.add-topic-input {
  flex: 1;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--fw-medium);
  color: var(--text-primary);
  background: transparent;
  border: none;
  outline: none;
  padding: 0;
}
.add-topic-input::placeholder {
  color: var(--text-placeholder);
}
.add-topic-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  background: var(--accent-primary);
  color: #ffffff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: var(--fw-bold);
  flex-shrink: 0;
  transition: background var(--transition-fast), transform var(--transition-fast);
}
.add-topic-btn:hover:not(:disabled) {
  background: var(--accent-primary-hover);
}
.add-topic-btn:active:not(:disabled) {
  transform: scale(0.94);
}
.add-topic-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

**QuestionSearch redesign:**

```css
.question-search-wrapper {
  position: relative;
  margin-bottom: 14px;
}
.question-search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  font-size: 14px;
  pointer-events: none;
}
.question-search-input {
  width: 100%;
  padding: 9px 12px 9px 36px;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--text-primary);
  background: var(--surface-elevated);
  border: 1px solid var(--border-base);
  border-radius: var(--radius-lg);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  outline: none;
}
.question-search-input::placeholder {
  color: var(--text-placeholder);
}
.question-search-input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-primary-muted);
}
```

### 3.6 TopicList (`src/components/TopicList.jsx`)

**This is the most important component. Most of the UX value is here.**

**Current problems:**
- Topic rows are functional but visually plain
- The expand/collapse behavior is not animated
- Question rows do not scale well on mobile
- The "drag handle" is barely visible
- Solve status button is small and hard to hit on mobile
- Difficulty badges are not using the standard LeetCode color system
- Question action buttons appear inline and clutter the row
- The attempt log modal opens on every checkbox click — this is correct, keep it

**New design — Topic rows:**

Use the `.topic-section`, `.topic-header`, `.subtopic-section`, `.subtopic-header`, `.question-row` classes defined in the CSS spec above.

Topic header shows:
- Drag handle (shows on hover, use `⋮⋮` or `≡` as a grippy icon)
- Expand/collapse chevron (animated rotation via CSS)
- Topic title
- Right side: `X/Y` progress pill + thin mini-progress bar
- On hover: Edit icon button + Delete icon button (using `.topic-actions`)

SubTopic header shows:
- Drag handle
- Expand chevron
- SubTopic title (slightly smaller, muted color)
- Right side: question count chip
- On hover: Edit + Delete buttons

Question row shows (left to right):
- Drag handle (small dots icon, visible on hover)
- Solve status circle button (`.solve-toggle`) — click opens the AttemptLogModal
- Question number (tiny, monospace, e.g. "01", "02", "03")
- Question title — click opens QuestionDetailsDrawer
- Right side (appears on hover):
  - Difficulty badge if set
  - External link button (↗) if link exists
  - Notes icon if notes exist
  - Revised badge if marked for revision
  - Edit title button (pencil icon)
  - Delete button (trash icon)

**Question number styling:**
```css
.question-number {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: var(--fw-medium);
  color: var(--text-placeholder);
  min-width: 20px;
  text-align: right;
  flex-shrink: 0;
  user-select: none;
}
```

**Subtopic "Add question" row:**
```css
.add-question-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px 7px 48px;
  border-top: 1px solid var(--border-subtle);
  background: var(--surface);
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  transition: opacity var(--transition-base), max-height var(--transition-slow);
}
.subtopic-section:hover .add-question-row,
.add-question-row:focus-within {
  opacity: 1;
  max-height: 56px;
}
.add-question-input {
  flex: 1;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--text-primary);
  background: transparent;
  border: none;
  outline: none;
  padding: 0;
}
.add-question-input::placeholder {
  color: var(--text-placeholder);
}
```

**Smooth expand/collapse animation:**
```css
.topic-content {
  overflow: hidden;
  transition: max-height var(--transition-slow), opacity var(--transition-base);
  max-height: 0;
  opacity: 0;
}
.topic-content.is-expanded {
  max-height: 10000px;
  opacity: 1;
}
```

**Implementation notes:**
- Keep ALL existing state variables (editingTopicId, editingSubId, editingQuestionId, etc.)
- Keep ALL existing drag-and-drop logic with `@hello-pangea/dnd`
- Keep ALL existing progress calculation calls
- Keep ALL existing `openQuestionDrawer`, `handleToggleProgress`, etc.
- Only change the JSX rendering and CSS classes
- The `ATTEMPT_RESULT_META` constant should use the new CSS badge colors instead of Tailwind color-mix inline styles
- On mobile: the question-actions row should be accessible via a long-press or a dedicated "..." button since hover does not exist

### 3.7 QuestionDetailsDrawer (`src/components/QuestionDetailsDrawer.jsx`)

**Current problems:**
- Drawer has no clear visual hierarchy
- Fields are cramped together
- Resource links editor is functional but not polished
- Tags section needs better visual treatment
- Save/Cancel buttons are at the bottom but barely stand out

**New design:**

Use the `.drawer-panel`, `.drawer-header`, `.drawer-body`, `.drawer-footer` classes.

**Drawer header:**
- Question title (large, bold, editable inline)
- Close button (X) top-right
- Status row: show current solve status badge + difficulty badge

**Drawer body sections (with clear visual separators):**

1. **Quick Actions** row: difficulty selector + tags selector as inline controls
2. **Notes** textarea (full width, autoresize, monospace font for code notes)
3. **Resource Links** section with the existing `ResourceLinksEditor`
4. **Danger zone** (delete button) at the very bottom, muted

Add this CSS:
```css
.drawer-section {
  padding: 16px 0;
  border-bottom: 1px solid var(--border-subtle);
}
.drawer-section:last-child {
  border-bottom: none;
}
.drawer-section-title {
  font-size: var(--text-xs);
  font-weight: var(--fw-semibold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
  margin: 0 0 10px;
}

/* Notes textarea */
.notes-textarea {
  width: 100%;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--text-primary);
  background: var(--surface-subtle);
  border: 1px solid var(--border-base);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  resize: vertical;
  min-height: 100px;
  outline: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  line-height: 1.6;
}
.notes-textarea:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-primary-muted);
}

/* Resource link row */
.resource-link-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--surface);
  margin-bottom: 6px;
  transition: border-color var(--transition-fast);
}
.resource-link-row:focus-within {
  border-color: var(--accent-primary);
}
.resource-link-type-badge {
  font-size: var(--text-xs);
  font-weight: var(--fw-semibold);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background: var(--surface-muted);
  color: var(--text-tertiary);
  white-space: nowrap;
  flex-shrink: 0;
}
```

### 3.8 AttemptLogModal (`src/components/AttemptLogModal.jsx`)

**Current problems:**
- The modal is actually quite feature-rich, but the visual styling is inconsistent
- Cards use hardcoded shadow values and color-mix inline styles
- Timer display uses a live stopwatch — keep the logic, only style the display

**New design:**

Use the `.modal-backdrop` and `.modal-panel.modal-panel--wide` structure.

**Visual sections in the modal:**
1. **Header**: Question title + breadcrumb (topic / subtopic)
2. **Result** selection: Three large clickable cards for Solved / Partially Solved / Failed
   - These are the most important choice — make them visually dominant, full-width 3-column grid
   - Each card: icon + label + brief description, colored border when selected
3. **Details section** (collapses or just below result):
   - Timer / time spent (keep existing stopwatch logic)
   - Difficulty rating
   - Platform selection
   - Confidence level (Low / Medium / High) as pill buttons
   - Mistakes checklist (keep existing checkboxes)
   - Revision scheduling pills (Today / Tomorrow / In 2 Days / In 1 Week / In 2 Weeks / Never)
4. **Footer**: Save button (prominent, green) + Cancel

```css
/* Attempt result cards */
.attempt-result-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}
.attempt-result-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border: 2px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--surface);
  cursor: pointer;
  transition: border-color var(--transition-fast), background var(--transition-fast),
              transform var(--transition-fast);
  text-align: center;
}
.attempt-result-card:hover {
  transform: translateY(-1px);
}
.attempt-result-card.is-solved {
  border-color: var(--color-solved);
  background: var(--color-solved-bg);
}
.attempt-result-card.is-attempted {
  border-color: var(--color-attempted);
  background: var(--color-attempted-bg);
}
.attempt-result-card.is-failed {
  border-color: var(--color-failed);
  background: var(--color-failed-bg);
}
.attempt-result-icon {
  font-size: 24px;
  line-height: 1;
}
.attempt-result-label {
  font-size: var(--text-xs);
  font-weight: var(--fw-semibold);
  color: var(--text-secondary);
}
.attempt-result-card.is-solved .attempt-result-label { color: var(--color-solved); }
.attempt-result-card.is-attempted .attempt-result-label { color: var(--color-attempted); }
.attempt-result-card.is-failed .attempt-result-label { color: var(--color-failed); }

/* Confidence pills */
.confidence-group {
  display: flex;
  gap: 6px;
}
.confidence-pill {
  flex: 1;
  text-align: center;
  padding: 6px 10px;
  font-size: var(--text-xs);
  font-weight: var(--fw-semibold);
  border: 1px solid var(--border-base);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.confidence-pill.is-low.is-selected {
  background: var(--color-failed-bg);
  border-color: var(--color-failed);
  color: var(--color-failed);
}
.confidence-pill.is-medium.is-selected {
  background: var(--color-attempted-bg);
  border-color: var(--color-attempted);
  color: var(--color-attempted);
}
.confidence-pill.is-high.is-selected {
  background: var(--color-solved-bg);
  border-color: var(--color-solved);
  color: var(--color-solved);
}

/* Revision pill row */
.revision-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.revision-pill {
  padding: 5px 12px;
  font-size: var(--text-xs);
  font-weight: var(--fw-semibold);
  border: 1px solid var(--border-base);
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.revision-pill:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}
.revision-pill.is-selected {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: #ffffff;
}

/* Timer display */
.timer-display {
  font-family: var(--font-mono);
  font-size: var(--text-3xl);
  font-weight: var(--fw-bold);
  color: var(--text-primary);
  letter-spacing: -0.02em;
  text-align: center;
  padding: 8px 0;
}
.timer-controls {
  display: flex;
  gap: 8px;
  justify-content: center;
}
```

### 3.9 ConfirmationModal (`src/components/ConfirmationModal.jsx`)

**New design:**

Replace current implementation with a clean centered modal using the `.modal-backdrop` + `.modal-panel` structure. No changes to the props interface — `isOpen`, `title`, `message`, `actions`, `onClose`, `isBusy` all remain.

The modal icon can vary by first action variant:
- `danger` variant → show a red warning icon in a circle at top
- `success` variant → show a green check icon
- `neutral` → show a blue info icon

```css
.modal-icon-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  margin: 0 auto 16px;
  flex-shrink: 0;
}
.modal-icon-circle--danger {
  background: var(--color-failed-bg);
  color: var(--color-failed);
  border: 1px solid var(--color-failed-border);
}
.modal-icon-circle--success {
  background: var(--color-solved-bg);
  color: var(--color-solved);
  border: 1px solid var(--color-solved-border);
}
.modal-icon-circle--info {
  background: var(--accent-primary-muted);
  color: var(--accent-primary);
  border: 1px solid var(--accent-primary);
}
```

### 3.10 NotificationBell + NotificationDrawer

**Current problems:**
- Bell button is styled oddly
- Drawer overlaps content randomly
- Tabs are not prominently styled

**New design:**

Use `.notification-bell-btn` and the new `.notification-drawer-panel` CSS.

The bell button goes in the TopBar. Unread count badge is a small red pill on the top-right of the bell icon.

The drawer panel appears below the bell button, anchored to its position. On mobile it becomes a bottom sheet.

### 3.11 LoginPage (`src/pages/LoginPage.jsx`)

**Current problems:**
- The login form is centered on an empty page with AppShell header/sidebar — wasteful space usage for a login page
- The forgot password flow is fully inline, making the form shift visually
- No logo/branding above the form

**New design:**

For the login and signup pages specifically, override the AppShell layout to use a centered two-column layout:

- **Left half** (hidden on mobile): A branded illustration or gradient panel
  - Deep blue-navy background
  - Platform name "CreateSheets" in large bold text
  - A tagline: "Build your DSA mastery. One sheet at a time."
  - Floating abstract shapes or a simple illustration (use SVG geometric shapes)
  - A list of 3 feature highlights with checkmarks

- **Right half**: The actual form, centered vertically
  - White/surface card, no extra border (it's already on a split background)
  - Logo mark at top of form
  - Form title: "Welcome back" or "Create account"
  - Form fields
  - Divider + Google auth button
  - Footer link to sign up

```css
.auth-page-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr;
  background: var(--background);
}
@media (min-width: 900px) {
  .auth-page-layout {
    grid-template-columns: 1fr 1fr;
  }
}

.auth-brand-panel {
  background: linear-gradient(135deg, #0f1923 0%, #1a2d4d 40%, #0d2040 100%);
  display: none;
  flex-direction: column;
  justify-content: center;
  padding: 60px 48px;
  position: relative;
  overflow: hidden;
}
@media (min-width: 900px) {
  .auth-brand-panel {
    display: flex;
  }
}
.auth-brand-panel::before {
  content: '';
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%);
  top: -100px;
  right: -100px;
}
.auth-brand-panel::after {
  content: '';
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(22,163,74,0.10) 0%, transparent 70%);
  bottom: -80px;
  left: -60px;
}

.auth-brand-logo {
  font-size: 28px;
  font-weight: var(--fw-extrabold);
  color: #ffffff;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
}
.auth-brand-tagline {
  font-size: var(--text-xl);
  font-weight: var(--fw-bold);
  color: rgba(255,255,255,0.9);
  line-height: 1.3;
  letter-spacing: -0.02em;
  margin: 0 0 32px;
}
.auth-brand-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.auth-brand-feature {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: rgba(255,255,255,0.75);
  font-size: var(--text-sm);
  line-height: 1.5;
}
.auth-brand-feature-check {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(22,163,74,0.25);
  border: 1px solid rgba(22,163,74,0.5);
  color: #3fb950;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  flex-shrink: 0;
  margin-top: 1px;
}

.auth-form-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  min-height: 100vh;
}
.auth-form-card {
  width: 100%;
  max-width: 420px;
}
.auth-form-logo-mark {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-lg);
  background: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 18px;
  font-weight: var(--fw-bold);
  margin-bottom: 20px;
}
.auth-form-title {
  font-size: var(--text-2xl);
  font-weight: var(--fw-bold);
  color: var(--text-primary);
  letter-spacing: -0.02em;
  margin: 0 0 4px;
}
.auth-form-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0 0 24px;
}
.auth-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
}
.auth-divider-line {
  flex: 1;
  height: 1px;
  background: var(--border-subtle);
}
.auth-divider-text {
  font-size: var(--text-xs);
  font-weight: var(--fw-semibold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
  white-space: nowrap;
}
```

**Implementation changes for LoginPage:**
- Wrap the entire page content in `.auth-page-layout` instead of `AppShell`
- Remove `AppShell` from `LoginPage` — it looks wrong for an auth page
- Add `.auth-brand-panel` with branding content on the left
- Add `.auth-form-panel` on the right with the existing form logic
- Keep ALL existing form state, handlers, and the forgot password flow
- Keep the `GoogleAuthButton` component
- The same layout applies to `SignUpPage`

### 3.12 HomePage (`src/pages/HomePage.jsx`)

**Current problems:**
- The homepage uses AppShell which shows the full sidebar — wrong for a marketing page
- The promo slider and discovery sections feel disconnected from the product's DSA identity

**New design:**

Use a standalone layout (no AppShell sidebar). The homepage is a marketing page.

Structure:
1. **Navbar**: Fixed top bar with logo, navigation links (Sheets, Premium, How to Use), and Login/Sign Up CTAs
2. **Hero section**: Full-width, dark background gradient, large headline, subheadline, two CTAs
3. **Stats bar**: 3-4 key numbers (e.g., "10,000+ Questions Tracked", "50+ DSA Topics")
4. **Feature grid**: 3-column feature cards with icons
5. **How it works**: 3-step visual with numbered steps
6. **Famous Sheets discovery**: Horizontal scrollable row of sheet cards
7. **Premium CTA banner**: Dark gradient banner with pricing tease
8. **Footer**: Links + copyright

```css
/* Homepage-specific styles */
.home-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-topbar);
  background: color-mix(in srgb, var(--background) 88%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-subtle);
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.home-hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100px 24px 80px;
  text-align: center;
  background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.12) 0%, transparent 70%),
              var(--background);
  position: relative;
}
.home-hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--text-xs);
  font-weight: var(--fw-semibold);
  text-transform: uppercase;
  letter-spacing: 0.10em;
  color: var(--accent-primary);
  background: var(--accent-primary-muted);
  padding: 4px 12px;
  border-radius: var(--radius-full);
  margin-bottom: 20px;
  border: 1px solid var(--accent-primary-subtle);
}
.home-hero-title {
  font-size: clamp(36px, 6vw, 72px);
  font-weight: var(--fw-extrabold);
  color: var(--text-primary);
  letter-spacing: -0.04em;
  line-height: 1.1;
  margin: 0 0 20px;
  max-width: 800px;
}
.home-hero-title span {
  background: linear-gradient(135deg, var(--accent-primary), #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.home-hero-sub {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  max-width: 560px;
  margin: 0 auto 36px;
  line-height: 1.6;
}
.home-hero-ctas {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}
.home-stats-bar {
  background: var(--surface-elevated);
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
  padding: 24px;
}
.home-stats-grid {
  max-width: 900px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 24px;
}
.home-stat-item {
  text-align: center;
}
.home-stat-number {
  font-size: var(--text-3xl);
  font-weight: var(--fw-extrabold);
  color: var(--text-primary);
  letter-spacing: -0.03em;
  font-family: var(--font-mono);
}
.home-stat-label {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  margin-top: 4px;
}

.home-section {
  padding: 80px 24px;
  max-width: 1200px;
  margin: 0 auto;
}
.home-section-title {
  font-size: clamp(28px, 4vw, 44px);
  font-weight: var(--fw-extrabold);
  color: var(--text-primary);
  letter-spacing: -0.03em;
  text-align: center;
  margin: 0 0 12px;
}
.home-section-sub {
  text-align: center;
  font-size: var(--text-lg);
  color: var(--text-secondary);
  max-width: 540px;
  margin: 0 auto 48px;
  line-height: 1.6;
}

.home-feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}
.home-feature-card {
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: 24px;
  transition: border-color var(--transition-base), box-shadow var(--transition-base),
              transform var(--transition-base);
}
.home-feature-card:hover {
  border-color: var(--border-base);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.home-feature-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  margin-bottom: 14px;
}
.home-feature-icon--blue { background: var(--accent-primary-muted); }
.home-feature-icon--green { background: var(--color-solved-bg); }
.home-feature-icon--amber { background: var(--color-attempted-bg); }
.home-feature-title {
  font-size: var(--text-md);
  font-weight: var(--fw-bold);
  color: var(--text-primary);
  margin: 0 0 6px;
}
.home-feature-desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

.home-premium-banner {
  background: linear-gradient(135deg, #0f1923 0%, #1a2d4d 100%);
  border-radius: var(--radius-2xl);
  padding: 60px 40px;
  text-align: center;
  position: relative;
  overflow: hidden;
  margin: 0 24px 80px;
}
.home-premium-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 60% 60% at 50% 0%, rgba(37,99,235,0.2) 0%, transparent 70%);
}
```

**Implementation notes for HomePage:**
- Remove AppShell wrapper — use standalone layout
- Keep all existing `promoSlides`, `DISCOVERY_SHEETS` data
- Add a proper homepage-specific `<nav>` component
- Add smooth scroll behavior between sections

### 3.13 PremiumPage (`src/pages/PremiumPage.jsx`)

**Current problems:**
- Plan cards are functional but not confidence-inspiring
- Pricing comparison lacks visual polish

**New design:**

Pricing page layout inspired by Stripe's pricing page:
- Page title: "Simple, transparent pricing"
- Billing toggle: Monthly / Yearly (use pill toggle)
- Three plan cards: Starter (Free), Pro (Monthly), Premium Plus (Yearly)
- Each card:
  - Plan name badge
  - Large price display
  - Billing period note
  - Feature list with checkmarks
  - CTA button (disabled for current plan, green for recommended, blue for others)
- The recommended/popular plan card: slightly elevated, has a "Most Popular" badge, accent border

```css
.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  max-width: 960px;
  margin: 0 auto;
}
.pricing-card {
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-2xl);
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
}
.pricing-card--recommended {
  border-color: var(--accent-primary);
  border-width: 2px;
  box-shadow: 0 0 0 4px var(--accent-primary-muted);
}
.pricing-popular-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--accent-primary);
  color: #ffffff;
  font-size: var(--text-xs);
  font-weight: var(--fw-bold);
  padding: 4px 14px;
  border-radius: var(--radius-full);
  white-space: nowrap;
}
.pricing-plan-name {
  font-size: var(--text-sm);
  font-weight: var(--fw-semibold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
}
.pricing-price {
  font-size: var(--text-4xl);
  font-weight: var(--fw-extrabold);
  color: var(--text-primary);
  letter-spacing: -0.03em;
  font-family: var(--font-mono);
  line-height: 1;
}
.pricing-billing-period {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  margin-top: 4px;
}
.pricing-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}
.pricing-feature {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.4;
}
.pricing-feature-check {
  color: var(--color-solved);
  font-size: 14px;
  flex-shrink: 0;
  margin-top: 1px;
}
```

### 3.14 PublicSheetsPage (`src/pages/PublicSheetsPage.jsx`)

**New design:**

- Company filter pills across the top (already has category filters — make them look like proper pill tabs)
- Sheet cards in a 2-3 column responsive grid
- Each card: company emoji + name, sheet title, description, category badge
- "Load more" button at bottom

```css
.public-sheet-card {
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  cursor: pointer;
  transition: border-color var(--transition-base), box-shadow var(--transition-base),
              transform var(--transition-base);
}
.public-sheet-card:hover {
  border-color: var(--accent-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.public-sheet-company {
  display: flex;
  align-items: center;
  gap: 8px;
}
.public-sheet-company-logo {
  font-size: 24px;
  line-height: 1;
}
.public-sheet-company-name {
  font-size: var(--text-xs);
  font-weight: var(--fw-semibold);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.public-sheet-title {
  font-size: var(--text-md);
  font-weight: var(--fw-bold);
  color: var(--text-primary);
  letter-spacing: -0.01em;
}
.public-sheet-desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}
```

### 3.15 ProfilePage (`src/pages/ProfilePage.jsx`)

**Current problems:**
- Stats are displayed but visually not impactful
- Sheet list is styled similarly to the dashboard, creating visual repetition
- No visual identity for the user

**New design:**

- **Profile header card**: Full-width card with
  - User avatar (large initials circle, or image if set)
  - Display name + username badge + premium badge if active
  - Bio/description if set
  - Join date
  - Public profile URL with copy button
  - Quick stats: Total Sheets, Total Questions, Questions Solved
- **Progress overview**: Horizontal progress bar + percentage
- **Sheets section**: Filter tabs (All, Public, In Progress, Archived) + sort dropdown
- Sheet list uses the same card style as dashboard but more compact

```css
.profile-header-card {
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: 24px;
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 16px;
}
.profile-avatar-lg {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, var(--accent-primary) 0%, #7c3aed 100%);
  color: #ffffff;
  font-size: var(--text-2xl);
  font-weight: var(--fw-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 3px solid var(--surface);
  box-shadow: 0 0 0 2px var(--accent-primary-muted);
}
.profile-username-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  font-weight: var(--fw-semibold);
  color: var(--text-tertiary);
  background: var(--surface-muted);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-family: var(--font-mono);
}
.profile-url-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  background: var(--surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-top: 10px;
}
.profile-url-text {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-secondary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

### 3.16 NotificationsPage (`src/pages/NotificationsPage.jsx`)

**New design:**

Two-column layout on desktop:
- **Left column**: Sidebar with section buttons (Inbox, Alerts, Archived, Settings) using the pill-style
- **Right column**: Main notification feed

Each notification card:
- Icon indicating type (reminder = clock, mention = @, system = bell)
- Title + message (truncated)
- Timestamp (relative: "2 hours ago")
- Status dot (unread = blue, read = gray)
- Action buttons on hover: Mark Read, Archive, Delete, Snooze

```css
.notifications-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 20px;
}
@media (max-width: 768px) {
  .notifications-layout {
    grid-template-columns: 1fr;
  }
}
.notifications-sidebar {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.notification-sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--fw-medium);
  color: var(--text-secondary);
  cursor: pointer;
  border: none;
  background: transparent;
  transition: background var(--transition-fast), color var(--transition-fast);
  width: 100%;
  text-align: left;
}
.notification-sidebar-item:hover {
  background: var(--surface-muted);
  color: var(--text-primary);
}
.notification-sidebar-item.is-active {
  background: var(--accent-primary-muted);
  color: var(--accent-primary);
  font-weight: var(--fw-semibold);
}

.notification-item-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-subtle);
  position: relative;
  transition: background var(--transition-fast);
  cursor: pointer;
}
.notification-item-card:hover {
  background: var(--surface-subtle);
}
.notification-item-card.is-unread {
  background: color-mix(in srgb, var(--accent-primary-muted) 30%, var(--surface));
}
.notification-unread-dot {
  position: absolute;
  left: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-primary);
}
.notification-item-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--surface-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}
.notification-item-body {
  flex: 1;
  min-width: 0;
}
.notification-item-title {
  font-size: var(--text-sm);
  font-weight: var(--fw-semibold);
  color: var(--text-primary);
  margin: 0 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.notification-item-message {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.notification-item-time {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
  white-space: nowrap;
  flex-shrink: 0;
}
.notification-item-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity var(--transition-fast);
}
.notification-item-card:hover .notification-item-actions {
  opacity: 1;
}
```

### 3.17 AlarmsPage (`src/pages/AlarmsPage.jsx`)

**New design:**

Two-section layout:
- **Create alarm panel**: Clean form card at top (title, message, datetime picker, recurrence) with a primary "Set Alarm" button
- **Alarm list**: Cards grouped by status (Overdue, Upcoming, Completed) with appropriate color coding

```css
.alarm-create-card {
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: 20px;
  margin-bottom: 20px;
}
.alarm-group-header {
  font-size: var(--text-xs);
  font-weight: var(--fw-semibold);
  text-transform: uppercase;
  letter-spacing: 0.10em;
  color: var(--text-tertiary);
  padding: 10px 0 6px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
}
.alarm-item-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  margin-bottom: 6px;
  transition: border-color var(--transition-fast);
}
.alarm-item-card.is-overdue {
  border-color: var(--color-failed-border);
  background: var(--color-failed-bg);
}
.alarm-item-card.is-completed {
  opacity: 0.6;
}
.alarm-item-icon {
  font-size: 20px;
  flex-shrink: 0;
}
.alarm-item-body {
  flex: 1;
  min-width: 0;
}
.alarm-item-title {
  font-size: var(--text-sm);
  font-weight: var(--fw-semibold);
  color: var(--text-primary);
}
.alarm-item-time {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-family: var(--font-mono);
  margin-top: 2px;
}
```

### 3.18 LearningInsightsPage (`src/pages/LearningInsightsPage.jsx`)

**Current problems:**
- Premium gate message is plain text
- Charts lack labels and polish
- Filter controls are minimal

**New design:**

For the premium gate: Show a preview/blur of the content behind a centered overlay card:
```css
.insights-gate-overlay {
  position: relative;
}
.insights-gate-blur {
  filter: blur(6px);
  pointer-events: none;
  user-select: none;
  opacity: 0.4;
}
.insights-gate-card {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
.insights-gate-inner {
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: 32px 40px;
  text-align: center;
  box-shadow: var(--shadow-xl);
  max-width: 380px;
}
```

For the actual insights content (premium users):
- KPI stat cards in a 4-column grid at the top
- Charts in a 2-column responsive grid
- Filter pills at top for dateRange / topic / platform

```css
.kpi-card {
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.kpi-label {
  font-size: var(--text-xs);
  font-weight: var(--fw-semibold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
}
.kpi-value {
  font-size: var(--text-2xl);
  font-weight: var(--fw-extrabold);
  color: var(--text-primary);
  font-family: var(--font-mono);
  letter-spacing: -0.02em;
}
.kpi-trend {
  font-size: var(--text-xs);
  font-weight: var(--fw-semibold);
  margin-top: 2px;
}
.kpi-trend--up { color: var(--color-solved); }
.kpi-trend--down { color: var(--color-failed); }

.chart-card {
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: 20px;
}
.chart-card-title {
  font-size: var(--text-md);
  font-weight: var(--fw-semibold);
  color: var(--text-primary);
  margin: 0 0 16px;
}
```

### 3.19 EmptyState (`src/components/ui/EmptyState.jsx`)

**New design:**

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 24px;
  gap: 12px;
}
.empty-state-icon {
  font-size: 40px;
  opacity: 0.5;
  margin-bottom: 4px;
}
.empty-state-title {
  font-size: var(--text-lg);
  font-weight: var(--fw-bold);
  color: var(--text-primary);
  margin: 0;
}
.empty-state-desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  max-width: 340px;
  line-height: 1.6;
  margin: 0;
}
```

### 3.20 DifficultyBadge (`src/components/DifficultyBadge.jsx`)

**New design:**

Replace all existing difficulty badge rendering with the standard LeetCode difficulty color system:

```jsx
function DifficultyBadge({ category }) {
  const getDifficultyClass = (name, key) => {
    const normalizedKey = (key || name || '').toLowerCase();
    if (normalizedKey === 'easy') return 'badge badge-easy';
    if (normalizedKey === 'medium') return 'badge badge-medium';
    if (normalizedKey === 'hard') return 'badge badge-hard';
    return 'badge badge-neutral';
  };

  if (!category) return null;
  
  return (
    <span 
      className={getDifficultyClass(category.name, category.key)}
      style={category.color && !['easy','medium','hard'].includes((category.key || category.name || '').toLowerCase()) 
        ? { color: category.color, backgroundColor: `${category.color}18` } 
        : undefined}
    >
      {category.name || category.label || 'Unknown'}
    </span>
  );
}
```

### 3.21 ProgressBar (`src/components/ui/ProgressBar.jsx`)

**New design:**

```jsx
function ProgressBar({ percent = 0, tone = 'default', thin = false }) {
  const fillClass = {
    success: 'progress-fill--success',
    warning: 'progress-fill--warning',
    danger: 'progress-fill--danger',
    default: '',
  }[tone] || '';

  return (
    <div className={`progress-track ${thin ? 'progress-track--thin' : ''}`} role="progressbar" 
         aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <div 
        className={`progress-fill ${fillClass}`}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}
```

### 3.22 SurfaceCard (`src/components/ui/SurfaceCard.jsx`)

**New design:**

```jsx
function SurfaceCard({ title, description, children, className = '' }) {
  return (
    <section className={`panel ${className}`} style={{ padding: '20px' }}>
      {(title || description) && (
        <div style={{ marginBottom: '16px' }}>
          {title && <h2 className="section-title">{title}</h2>}
          {description && <p className="meta-text" style={{ marginTop: '4px' }}>{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
```

### 3.23 StatCard (`src/components/ui/StatCard.jsx`)

**New design:**

```jsx
function StatCard({ label, value, icon, accent = false }) {
  return (
    <div className={`kpi-card ${accent ? 'border-[var(--accent-primary)]' : ''}`}>
      {icon && <span style={{ fontSize: '20px', opacity: 0.7 }}>{icon}</span>}
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
    </div>
  );
}
```

### 3.24 Skeleton (`src/components/ui/Skeleton.jsx`)

**New design:**

```jsx
function Skeleton({ className = '', rounded = 'rounded-md', style }) {
  return (
    <div 
      className={`skeleton ${rounded} ${className}`}
      style={{ height: '16px', ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton 
          key={index}
          style={{ width: index === lines - 1 ? '60%' : '100%', height: '14px' }}
        />
      ))}
    </div>
  );
}
```

### 3.25 ThemeCinematicToggle (`src/components/theme/ThemeCinematicToggle.jsx`)

Keep all existing logic. Style as a clean icon button with a sun/moon icon that switches based on current theme.

```css
.theme-toggle-btn {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-base);
  background: var(--surface-elevated);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all var(--transition-fast);
}
.theme-toggle-btn:hover {
  background: var(--surface-muted);
  color: var(--text-primary);
  border-color: var(--border-strong);
}
```

### 3.26 SharedPage (`src/pages/SharedPage.jsx`)

**New design:**

The shared page is for public/read-only sheet viewing. It should feel like a polished public-facing page.

- No auth sidebar — use a clean minimal topbar with logo and "Sign Up Free" CTA
- Sheet header: title, author attribution, stats
- The topic/question tree uses the same `TopicList` component but with `isEditing=false`
- `OverviewRail` on the right: sheet info, quick actions (Fork/Copy, Share)
- On mobile: OverviewRail moves to bottom of page or into a drawer

### 3.27 ImportPage / ExportPage

**Clean, minimal form pages:**

```css
.transfer-page-card {
  max-width: 600px;
  margin: 0 auto;
  background: var(--surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: 28px;
}
.transfer-page-title {
  font-size: var(--text-xl);
  font-weight: var(--fw-bold);
  color: var(--text-primary);
  margin: 0 0 4px;
  letter-spacing: -0.01em;
}
.transfer-page-desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0 0 20px;
  line-height: 1.6;
}
.drop-zone {
  border: 2px dashed var(--border-base);
  border-radius: var(--radius-lg);
  padding: 40px;
  text-align: center;
  background: var(--surface-subtle);
  transition: border-color var(--transition-fast), background var(--transition-fast);
  cursor: pointer;
}
.drop-zone:hover, .drop-zone.is-drag-over {
  border-color: var(--accent-primary);
  background: var(--accent-primary-subtle);
}
```

---

## PART 4: SPECIFIC IMPLEMENTATION RULES

### 4.1 What You MUST NOT Change

- **No store changes**: Do not modify any file in `src/store/`
- **No API layer changes**: Do not modify any file in `src/api/`
- **No service changes**: Do not modify any file in `src/services/`
- **No config changes**: Do not modify any file in `src/config/`
- **No route changes**: Do not modify `ROUTES` constants or any routing logic in `App.jsx` routes config
- **No backend changes**: No files under `backend/` should be touched
- **No prop interface changes**: All existing component props must still work as before
- **No store call changes**: All existing `useSheetStore`, `useAuthStore` calls must stay the same
- **No business logic changes**: Limit warnings, premium gate checks, save/discard flows — all stay identical

### 4.2 What You SHOULD Change

- `src/index.css`: Complete rewrite with the new design system defined in Part 2
- All JSX files in `src/pages/`: New layout, new class names, new visual hierarchy
- All JSX files in `src/components/`: New visual rendering with the new CSS classes
- `src/App.jsx`: Only if needed to remove the `theme`/`onThemeChange` prop threading (minor cleanup)
- Add the Google Fonts import to `index.html` `<head>` for fastest loading, OR use the `@import` in CSS

### 4.3 CSS Architecture Rules

- ALL new styles go in `src/index.css` — do not create new `.css` files except for pages that already have them (`PremiumPage.css`, `ApplyPage.css`)
- Use CSS custom properties (variables) for ALL colors and spacing — zero hardcoded hex values in JSX
- Use Tailwind utility classes ONLY for layout (flex, grid, gap, padding numbers that aren't in our system) — do not use Tailwind for colors, borders, backgrounds
- Never use `!important`
- All transitions use the `--transition-*` variables
- All border-radius values use `var(--radius-*)` variables
- All shadow values use `var(--shadow-*)` variables

### 4.4 Animation Rules

- Page content fade-in: wrap main content areas in `<div className="section-fade-in">` — this gives a subtle entrance animation
- Topic expand/collapse: use CSS max-height transition (defined in the topic CSS spec)
- Hover lifts on cards: `translateY(-2px)` — never more than 2-3px
- Modal appearance: `slideUp` keyframe animation (defined in the CSS spec)
- Drawer appearance: `slideRight` keyframe animation (defined in the CSS spec)
- Progress bar fills: `transition: width 600ms cubic-bezier(0.4, 0, 0.2, 1)` — smooth and satisfying
- No `setTimeout` for animations — use only CSS transitions and keyframes

### 4.5 Mobile Responsiveness Rules

- Mobile breakpoint: `768px` (md in Tailwind)
- Sidebar: completely hidden on mobile, replaced by the hamburger toggle + mobile overlay drawer
- All cards: single column on mobile, 2 columns on `sm` (640px+), 3 columns on `lg` (1024px+)
- TopBar: user label hidden on mobile (show only avatar circle)
- Sheet dashboard cards: single column on mobile
- Topic tree: question rows stack labels vertically on mobile < 480px
- Attempt log modal: full-width on mobile (`max-width: 100%`, reduce padding)
- Drawer: `width: min(480px, 100vw)` — full-width on small screens
- Premium page pricing cards: single column on mobile

### 4.6 Accessibility Rules

- All interactive elements must have visible focus styles (already covered by `:focus-visible`)
- All icon-only buttons must have `aria-label`
- Progress bars must have `role="progressbar"` with `aria-valuenow/min/max`
- Modals must trap focus (the existing `ConfirmationModal` should maintain this)
- Color alone must not convey information — always pair color with text or icon
- Sidebar collapsed state: tooltip must be accessible on focus (already implemented — keep it)
- All `<img>` elements must have `alt` attributes
- Form labels: keep all existing `<label>` associations

### 4.7 Theme Toggle Implementation

The existing `ThemeCinematicToggle` component cycles through themes. Keep all existing logic.
The three themes defined in `index.css` (`superman-light`, `batman-dark`, `joker-blue`) should all be supported.
Just update the visual appearance of the toggle button itself.

---

## PART 5: PAGE-BY-PAGE REDESIGN CHECKLIST

Work through every page in this exact order. Check off each item as you complete it.

### Phase 1: Design System Foundation
- [ ] 1. Add Google Fonts import to `index.html`
- [ ] 2. Completely rewrite `src/index.css` with the new design token system from Part 2
- [ ] 3. Verify the app still loads and navigates without crashes
- [ ] 4. Check all three themes work correctly

### Phase 2: Core Layout Components
- [ ] 5. Redesign `src/components/Sidebar.jsx` — new visual style, keep all logic
- [ ] 6. Redesign `src/components/TopBar.jsx` — cleaner layout
- [ ] 7. Redesign `src/components/AppShell.jsx` — improved grid, footer
- [ ] 8. Redesign `src/components/AlertBar.jsx` — new alert styles
- [ ] 9. Verify sidebar collapse/expand, mobile toggle still works

### Phase 3: Utility Components
- [ ] 10. Redesign `src/components/ui/ProgressBar.jsx`
- [ ] 11. Redesign `src/components/ui/EmptyState.jsx`
- [ ] 12. Redesign `src/components/ui/Skeleton.jsx`
- [ ] 13. Redesign `src/components/ui/StatCard.jsx`
- [ ] 14. Redesign `src/components/ui/SurfaceCard.jsx`
- [ ] 15. Redesign `src/components/ui/SectionHeader.jsx`
- [ ] 16. Redesign `src/components/DifficultyBadge.jsx`
- [ ] 17. Redesign `src/components/TopicChip.jsx` and `TopicChipsPreview.jsx`
- [ ] 18. Redesign `src/components/PremiumLotusBadge.jsx`
- [ ] 19. Redesign `src/components/ui/NotificationItemCard.jsx`

### Phase 4: Notification System
- [ ] 20. Redesign `src/components/NotificationBell.jsx`
- [ ] 21. Redesign `src/components/NotificationDrawer.jsx`
- [ ] 22. Verify notification bell opens/closes correctly

### Phase 5: Modal / Drawer Components
- [ ] 23. Redesign `src/components/ConfirmationModal.jsx`
- [ ] 24. Redesign `src/components/SheetMetadataDrawer.jsx`
- [ ] 25. Redesign `src/components/QuestionDetailsDrawer.jsx`
- [ ] 26. Redesign `src/components/AttemptLogModal.jsx`
- [ ] 27. Redesign `src/components/TopicReminderAlarmPanel.jsx`
- [ ] 28. Redesign `src/components/DifficultyCategorySelector.jsx`
- [ ] 29. Redesign `src/components/CustomDifficultyModal.jsx`
- [ ] 30. Redesign `src/components/CustomTopicModal.jsx`
- [ ] 31. Redesign `src/components/ResourceLinksEditor.jsx`
- [ ] 32. Verify all modals open, close, and save correctly

### Phase 6: The Core Sheet Editor
- [ ] 33. Redesign `src/components/AddTopicForm.jsx`
- [ ] 34. Redesign `src/components/QuestionSearch.jsx`
- [ ] 35. Redesign `src/components/SheetHeader.jsx`
- [ ] 36. Redesign `src/components/EditorActionPanel.jsx`
- [ ] 37. Redesign `src/components/TopicList.jsx` — the most important component
- [ ] 38. Redesign `src/components/QuestionsTable.jsx`
- [ ] 39. Redesign `src/components/DifficultyDistributionWidget.jsx`
- [ ] 40. Redesign `src/components/TopicDistributionChart.jsx`
- [ ] 41. Redesign `src/components/DonutChart.jsx`
- [ ] 42. Redesign `src/components/SheetTabs.jsx`
- [ ] 43. Redesign `src/components/TopicTagSelector.jsx`
- [ ] 44. Redesign `src/components/OverviewRail.jsx`
- [ ] 45. Test drag-and-drop reordering still works
- [ ] 46. Test question solve toggle still works
- [ ] 47. Test undo/redo still works
- [ ] 48. Test save/discard still works

### Phase 7: Auth Pages
- [ ] 49. Redesign `src/pages/LoginPage.jsx` — split-panel layout, remove AppShell
- [ ] 50. Redesign `src/pages/SignUpPage.jsx` — same split-panel layout
- [ ] 51. Redesign `src/components/GoogleAuthButton.jsx`
- [ ] 52. Test login flow end-to-end
- [ ] 53. Test signup + OTP flow end-to-end
- [ ] 54. Test forgot password flow end-to-end

### Phase 8: Main Pages
- [ ] 55. Redesign `src/pages/SheetPage.jsx` — dashboard mode (no sheetId)
- [ ] 56. Redesign `src/pages/SheetPage.jsx` — editor mode (with sheetId)
- [ ] 57. Redesign `src/pages/ProfilePage.jsx`
- [ ] 58. Redesign `src/pages/PremiumPage.jsx`
- [ ] 59. Redesign `src/pages/PublicSheetsPage.jsx`
- [ ] 60. Redesign `src/pages/NotificationsPage.jsx`
- [ ] 61. Redesign `src/pages/AlarmsPage.jsx`
- [ ] 62. Redesign `src/pages/AlertsPage.jsx`
- [ ] 63. Redesign `src/pages/LearningInsightsPage.jsx`
- [ ] 64. Redesign `src/pages/AddAccountsPage.jsx`
- [ ] 65. Redesign `src/pages/EditProfilePage.jsx`
- [ ] 66. Redesign `src/pages/ImportPage.jsx`
- [ ] 67. Redesign `src/pages/ExportPage.jsx`

### Phase 9: Public Pages
- [ ] 68. Redesign `src/pages/HomePage.jsx` — full marketing landing page
- [ ] 69. Redesign `src/pages/SharedPage.jsx` — public sheet/profile view
- [ ] 70. Redesign `src/pages/HowToUsePage.jsx`
- [ ] 71. Redesign `src/pages/AboutPage.jsx`
- [ ] 72. Redesign `src/pages/ContactPage.jsx`
- [ ] 73. Redesign `src/pages/ApplyPage.jsx`

### Phase 10: Final Polish
- [ ] 74. Verify all three themes across all pages
- [ ] 75. Test mobile viewport (375px width) on all pages
- [ ] 76. Test tablet viewport (768px) on all pages
- [ ] 77. Check all loading states look good with new skeleton styles
- [ ] 78. Check all empty states look good
- [ ] 79. Run `npm run lint` and fix any issues
- [ ] 80. Run `npm run build` and verify no build errors

---

## PART 6: INSTALLATION AND SETUP

### 6.1 Prerequisites

Ensure the following are installed on your system before proceeding:

```bash
# Check Node.js version (must be 20+)
node --version

# Check npm version (must be 10+)
npm --version

# Check Java version (must be 17+) — for backend only
java -version

# Check Maven version (must be 3.9+) — for backend only
mvn --version
```

### 6.2 Repository Setup

```bash
# Clone the repository (or extract the zip)
# If from zip:
unzip Interactive-Question-Management-Sheet-main.zip
cd Interactive-Question-Management-Sheet-main

# Install all frontend dependencies
npm install

# Verify installation
npm list react
```

### 6.3 Environment Configuration

```bash
# Copy the frontend env example
cp .env.example .env

# Open .env and set (at minimum):
# VITE_API_BASE_URL=http://localhost:8080
# Leave other vars as their defaults for local dev

# Copy the backend env example
cd backend
cp .env.example .env

# Open backend/.env and set:
# MONGODB_URI=mongodb://localhost:27017/create-sheets
# APP_AUTH_SECRET=your-random-64-char-secret
# MONGODB must be running locally or use MongoDB Atlas URI

# Generate a secure secret:
openssl rand -base64 48
```

### 6.4 Running the Application for Development

**Terminal 1 — Start Backend:**
```bash
cd backend
mvn spring-boot:run
# Backend starts at http://localhost:8080
# Watch for "Started IqmsBackendApplication" in logs
```

**Terminal 2 — Start Frontend:**
```bash
# From repository root
npm run dev
# OR: npm run start
# Frontend starts at http://127.0.0.1:5172 (note: not 5173, uses --strictPort 5172)
```

Open browser at: `http://127.0.0.1:5172`

### 6.5 Verification Steps

After starting both servers:

1. Navigate to `http://127.0.0.1:5172/home` — should see the homepage
2. Navigate to `http://127.0.0.1:5172/login` — should see the login form
3. Create an account via signup
4. Log in and verify the sheet dashboard at `/app`
5. Create a sheet and add topics/questions to verify the editor works

### 6.6 Working on the Frontend Redesign

When making changes, the Vite dev server hot-reloads automatically.

```bash
# Check for lint errors before committing
npm run lint

# Build to verify no TypeScript/build errors
npm run build

# Preview the built output
npm run preview
```

**File locations for the redesign work:**

```
src/
├── index.css              ← PRIMARY FILE: All CSS changes here
├── App.jsx                ← Minor cleanup only (optional)
├── main.jsx               ← Do not touch
├── pages/
│   ├── HomePage.jsx       ← Full marketing page redesign
│   ├── LoginPage.jsx      ← Split-panel auth layout
│   ├── SignUpPage.jsx     ← Split-panel auth layout
│   ├── SheetPage.jsx      ← Dashboard + editor redesign
│   ├── ProfilePage.jsx    ← Profile redesign
│   ├── PremiumPage.jsx    ← Pricing page redesign
│   └── ... (all other pages)
└── components/
    ├── Sidebar.jsx        ← New sidebar with logo, user area
    ├── TopBar.jsx         ← Cleaner topbar
    ├── AppShell.jsx       ← Layout wrapper
    ├── TopicList.jsx      ← MOST IMPORTANT - question tree
    ├── QuestionDetailsDrawer.jsx
    ├── AttemptLogModal.jsx
    ├── ConfirmationModal.jsx
    └── ... (all other components)
```

### 6.7 CSS Organization in `index.css`

Structure the new `index.css` in this exact order:

```css
/* 1. Font import */
@import url('...');

/* 2. Tailwind base */
@import "tailwindcss";

/* 3. Design tokens — light theme */
:root, :root[data-theme="superman-light"] { ... }

/* 4. Dark theme */
:root[data-theme="batman-dark"] { ... }

/* 5. Blue theme */
:root[data-theme="joker-blue"] { ... }

/* 6. Global base styles */
*, *::before, *::after { box-sizing: border-box; }
html { ... }
body { ... }

/* 7. Scrollbar + selection */
::-webkit-scrollbar { ... }
::selection { ... }

/* 8. Animations / keyframes */
@keyframes fadeIn { ... }
@keyframes slideUp { ... }
@keyframes slideRight { ... }
@keyframes skeleton-shimmer { ... }
@keyframes section-fade-in { ... }

/* 9. Typography utilities */
.page-title { ... }
.section-title { ... }
/* ... */

/* 10. Buttons */
.btn-base { ... }
.btn-primary { ... }
/* ... */

/* 11. Form fields */
.field-base { ... }
.stack-form { ... }
/* ... */

/* 12. Panels / Cards */
.panel { ... }
.panel-elevated { ... }
/* ... */

/* 13. Badges / Chips */
.badge { ... }
.badge-easy { ... }
/* ... */

/* 14. Progress */
.progress-track { ... }
/* ... */

/* 15. App shell layout */
.app-shell { ... }
.app-shell-grid { ... }
/* ... */

/* 16. Sidebar */
.sidebar { ... }
/* ... */

/* 17. TopBar */
.theme-topbar { ... }
/* ... */

/* 18. Modals / Drawers */
.modal-backdrop { ... }
/* ... */

/* 19. Notifications */
.notification-bell-btn { ... }
/* ... */

/* 20. Topic Tree */
.topic-section { ... }
/* ... */

/* 21. Sheet components */
.sheet-header-card { ... }
.editor-panel { ... }
/* ... */

/* 22. Dashboard cards */
.sheet-card { ... }
.kebab-menu-btn { ... }
/* ... */

/* 23. Auth pages */
.auth-page-layout { ... }
/* ... */

/* 24. Homepage */
.home-navbar { ... }
.home-hero { ... }
/* ... */

/* 25. Specific pages */
.pricing-grid { ... }
.notifications-layout { ... }
/* ... */

/* 26. Misc utilities */
.section-fade-in { ... }
.empty-state { ... }
.skeleton { ... }
/* ... */
```

---

## PART 7: QUALITY BENCHMARKS

Before considering the redesign complete, the result should pass these quality benchmarks:

### Visual Quality
- [ ] The app looks like a product you would pay for
- [ ] Typography is consistent — same font, similar sizes, proper hierarchy throughout
- [ ] Colors are consistent — no random blue or gray shades outside the design token system
- [ ] Spacing is consistent — cards have the same internal padding, sections have similar gaps
- [ ] The dark theme looks as polished as the light theme
- [ ] Difficulty badges use the standard Easy/Medium/Hard color system like LeetCode

### Usability
- [ ] A new user can understand the main actions within 30 seconds of opening the app
- [ ] The sheet editor (topic → subtopic → question) flow is clear and unambiguous
- [ ] The solve status toggle is large enough to hit on mobile
- [ ] The question details drawer opens smoothly and closes with the X button or Escape key
- [ ] Premium-gated features show a clear explanation instead of a cryptic block
- [ ] Empty states have clear instructions for what to do next

### Performance
- [ ] No CSS classes throw errors in the browser console
- [ ] No broken images or icons
- [ ] The page does not flicker on theme change
- [ ] Sidebar collapse/expand is smooth (no jerky transitions)
- [ ] The app loads in under 3 seconds on a standard connection

### Correctness
- [ ] All existing features still work after the redesign
- [ ] Sheet CRUD (create, read, update, delete) works correctly
- [ ] Drag-and-drop reordering for topics, subtopics, and questions works
- [ ] Undo/redo works correctly
- [ ] Login, signup, and logout work correctly
- [ ] OTP verification during signup works
- [ ] Google login/signup works (if configured)
- [ ] Forgot password flow works
- [ ] Premium payment flow (Razorpay) works (if configured)
- [ ] Notification bell shows unread count and opens drawer
- [ ] Alarms and reminders can be created and managed
- [ ] Import JSON works — imported sheet appears in the editor
- [ ] Export works — file downloads correctly
- [ ] Public sheet sharing via link works
- [ ] Learning insights page shows analytics for premium users
- [ ] All three themes apply correctly

---

## PART 8: COMPONENT MENTAL MODEL

For the agent's reference, here is how the key components relate:

```
App (routing)
└── Routes
    ├── [Auth] LoginPage / SignUpPage
    │   └── auth-page-layout (NO AppShell)
    │       ├── auth-brand-panel (left branding)
    │       └── auth-form-panel (right form)
    │
    ├── [Public] HomePage
    │   └── home-navbar (fixed) + home-hero + home-sections...
    │
    └── [Protected] AppShell
        ├── Sidebar (left)
        │   ├── logo mark + logo text
        │   ├── nav sections + nav items
        │   ├── user avatar area (bottom)
        │   └── toggle button (bottom)
        │
        └── app-content (right)
            ├── TopBar (sticky)
            │   ├── breadcrumb (left)
            │   ├── NotificationBell
            │   ├── ThemeCinematicToggle
            │   └── user avatar button
            │
            ├── AlertBar (conditional)
            │
            ├── [SheetPage - dashboard mode]
            │   └── sheet cards grid + sort/filter pills
            │
            ├── [SheetPage - editor mode]
            │   ├── SheetHeader (progress ring + metadata)
            │   ├── AddTopicForm
            │   ├── QuestionSearch
            │   ├── Charts (DifficultyDist + TopicDist)
            │   └── TopicList
            │       ├── topic-section × N
            │       │   ├── topic-header (drag, chevron, title, progress)
            │       │   └── topic-content (expanded)
            │       │       └── subtopic-section × M
            │       │           ├── subtopic-header
            │       │           └── question-row × P
            │       │               ├── solve-toggle
            │       │               ├── question-title
            │       │               └── difficulty badge + link
            │       └── [Floating] EditorActionPanel (right aside)
            │
            ├── [ProfilePage]
            │   ├── profile-header-card (avatar + stats)
            │   └── sheet list (filtered)
            │
            ├── [PremiumPage]
            │   └── pricing-grid (3 cards)
            │
            ├── [NotificationsPage]
            │   ├── notifications-sidebar
            │   └── notification feed
            │
            └── [LearningInsightsPage]
                ├── kpi stats row
                └── chart grid
```

---

## PART 9: COPY AND MICROCOPY IMPROVEMENTS

Improve the text throughout the UI to be more professional:

| Location | Current | Improved |
|---|---|---|
| TopBar subtitle | "Track your growth. Build your legacy on the left" | Remove entirely |
| Empty sheet list | "This account has zero sheets. Create your first sheet to get started." | "No sheets yet. Create your first sheet to start tracking questions." |
| Sheet edit mode toggle | "View Only" | "View mode" |
| EditorActionPanel title | "Editor Tools" | "Sheet Editor" |
| EditorActionPanel desc | "Contextual sheet actions." | "Manage and save your changes." |
| Sheet dashboard page title | "Question Sheet" | "My Sheets" |
| Sheet dashboard subtitle | "Manage and organize all your sheets" | "Manage your DSA preparation sheets" |
| Premium gate message | "Advanced analytics is a premium feature. Buy premium to unlock full insights." | "Unlock full learning analytics with Premium — visualize your progress, track mistakes, and identify weak areas." |
| Free plan limit warning | "Your free plan question limit is exhausted for this sheet. Buy premium to add more questions." | "You've reached the free plan question limit for this sheet. Upgrade to Premium for unlimited questions." |
| Login page title | "Login" | "Welcome back" |
| Login page subtitle | "Access your question sheets" | "Sign in to continue your preparation" |
| Signup page title | "Sign Up" | "Create your account" |
| TopicList empty | *(whatever it shows now)* | "No topics yet. Add your first topic to organize your questions." |
| SubTopic empty | *(empty subtopic)* | "No questions yet. Type a question below to get started." |
| How to use header | "How To Use" | "Getting started with CreateSheets" |

---

## PART 10: SPECIFIC TECHNICAL NOTES FOR THE AGENT

### 10.1 Tailwind CSS 4 Compatibility

This project uses **Tailwind CSS 4**, which has a different config model from Tailwind 3.
- There is no `tailwind.config.js` in v4 — configuration is done through CSS
- The `@import "tailwindcss"` directive is used (not `@tailwind base; @tailwind components; @tailwind utilities`)
- Custom CSS variables can be used directly with Tailwind's `var()` support in arbitrary values
- Tailwind color utilities still work (e.g., `text-blue-500`) but we PREFER our custom variables for consistency
- Do NOT add a `tailwind.config.js` file — it is not needed and may break the v4 setup

### 10.2 React 19 Notes

- Using React 19 — ensure no deprecated APIs are used
- `createPortal` is available and used by the `NotificationDrawer` — keep it
- `useId` is used in `Sidebar` for tooltip IDs — keep it
- `useRef` with forwarding: the existing patterns are fine

### 10.3 Zustand 5 Notes

- Using Zustand 5 — the store API is slightly different from v4
- Do not add new `create()` calls or modify store slices
- The `useSheetStore` and `useAuthStore` hooks work exactly as shown in the existing code

### 10.4 React Router DOM 7 Notes

- Using React Router DOM 7 — `<Link>`, `<Routes>`, `<Route>`, `useNavigate`, `useParams` all work as before
- The `BrowserRouter` wraps the app in `main.jsx` — do not move it
- All existing `navigateTo` helper calls can be kept or converted to `useNavigate` — either is fine

### 10.5 `@hello-pangea/dnd` Notes

- This is the maintained fork of react-beautiful-dnd, compatible with React 18+
- The `DragDropContext`, `Droppable`, and `Draggable` components in `TopicList.jsx` must stay exactly as they are
- Only change the rendered output (div structure, class names) — not the DnD wrappers
- The `draggableProps`, `dragHandleProps`, and `innerRef` must be applied exactly as currently done

### 10.6 Chart.js / Recharts Notes

- The project imports `chart.js` (for `DonutChart`) — these are pure SVG/canvas charts
- The `InsightsDashboardComponents` likely use Recharts — check and preserve all data/config props
- Style charts using the CSS custom properties that can be read from `getComputedStyle(document.documentElement)`

### 10.7 Razorpay Integration Notes

- The `PremiumPage.jsx` loads Razorpay SDK dynamically via script tag
- Do not move or change the `loadRazorpayCheckoutScript` function
- The checkout is triggered on a button click — just style the button

### 10.8 Google OAuth Notes

- `GoogleAuthButton.jsx` renders the Google sign-in button via `window.google.accounts.id`
- The container div for the Google button must be preserved in the DOM
- Wrap it in a styled container but do not change the button's direct DOM structure

---

## PART 11: FINAL NOTES

### What "Done" Looks Like

The redesign is complete when:

1. A developer opening the app for the first time immediately feels it is a professional product
2. Every page is visually consistent — same fonts, same spacing rhythm, same component patterns
3. The question editor is as clean and usable as NeetCode's sheet view
4. The mobile experience is fully functional, not just "it doesn't break"
5. All three themes look intentional and polished
6. The premium page could actually convert users
7. The homepage clearly communicates the product's value without confusion
8. No component looks like it was left untouched from the original plain design

### Common Mistakes to Avoid

1. **Do not** change business logic while changing visual styling — they are separate concerns
2. **Do not** remove features — every feature must remain accessible
3. **Do not** break the drag-and-drop — it is core to the product's UX
4. **Do not** use a color not defined in the design token system
5. **Do not** use `inline styles` for colors — always use CSS classes or CSS variables
6. **Do not** forget the `section-fade-in` animation on page content — it makes a huge difference
7. **Do not** skip mobile testing — many DSA users prep on their phones
8. **Do not** change the AppShell wrapper for the auth pages — they need a completely different layout
9. **Do not** use `@apply` in Tailwind 4 — it may not work the same way
10. **Do not** use browser-only APIs in server-side contexts — the code runs CSR only, this is fine

### Success Criteria Summary

| Criterion | Target |
|---|---|
| Visual consistency | 100% — every page uses the design system |
| Feature preservation | 100% — every feature from the original still works |
| Mobile usability | Full functionality at 375px viewport width |
| Dark theme quality | Equal to light theme |
| Load performance | `npm run build` succeeds, no bundle errors |
| Code quality | `npm run lint` passes |
| Branding alignment | Matches "premium DSA prep tool" positioning |
| User clarity | New users can find Create Sheet within 10 seconds |

---

*End of IQMS Frontend Redesign Prompt*
*Total specification length: Complete*
*Version: 1.0*
*Target codebase: Interactive-Question-Management-Sheet (createsheets.com)*
