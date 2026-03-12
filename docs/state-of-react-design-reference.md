# State of React 2025 — Design Reference Document

Source: https://2025.stateofreact.com/en-US

---

## Aesthetic Overview

The site uses a **retro-futuristic / cyberpunk terminal** aesthetic. The dominant mood is dark, dense, and technical — like an operating system from a sci-fi film. Key influences: green-screen terminals, 80s/90s sci-fi UI, Japanese arcade aesthetics. The design balances data density with visual flair.

---

## Color Palette

| Role | Color | Notes |
|---|---|---|
| Page background | `#1a2b35` (dark blue-teal) | Slightly warm dark teal, not pure black |
| Sidebar background | Same dark teal | Unified with page bg |
| Header bar | Same dark bg with a subtle border | Dashed/dotted bottom border |
| Primary accent | `#00d4d4` / bright cyan | Used for interactive elements, chart fills, strong emphasis text |
| Secondary accent | `#e040fb` / magenta-pink | Used for nav links, section headings in sidebar, CTA links |
| Body text | Off-white / light gray | Primary readable content |
| Monospace text color | Slightly desaturated green-white | Body paragraphs render in a terminal-green hue |
| Chart: "Used it" | Bright cyan teal | Dominant bar color |
| Chart: "Heard of it" | Muted teal/dark cyan | Secondary fill |
| Chart: "Never heard" | Dark gray/charcoal | Minimal fill |
| Chart: Positive sentiment | Green | Small inline bar segment |
| Chart: Negative sentiment | Coral/red | Small inline bar segment |
| Link color | Cyan / magenta depending on context | Context-sensitive |

---

## Typography

### Fonts

- **Display / Section headings**: A heavy condensed all-caps sans-serif. Visually very close to **Bebas Neue** or a custom variant. Rendered at very large sizes (80–120px on page titles). Letters are tight, high-contrast, and imposing.
- **Body / Navigation / UI text**: A **monospace font** — likely `Courier New`, a custom webfont, or a monospace stack. This is applied globally to body paragraphs, nav items, button labels, chart labels, and metadata. The monospace choice reinforces the terminal/developer aesthetic.
- **Drop-cap initial**: The first letter of intro paragraphs is rendered as a large drop-cap (4–5 lines tall) in the same display typeface.

### Type Scale & Weights

| Element | Style |
|---|---|
| Page title (e.g. "FEATURES") | All-caps display font, ~80px, white |
| Section heading | All-caps display font, ~32–48px, white |
| Body paragraph | Monospace, ~14–15px, slightly greenish off-white |
| Sidebar nav links | Monospace, ~12–13px, magenta for top-level, indented sub-items in lighter tone |
| Chart labels / percentages | Monospace, ~12px, white |
| Category tags (e.g. "Hooks", "Back-End") | Small monospace, muted/dim color, above the item name |
| Item names in charts | Monospace, cyan underline, link-styled |
| Italics | Used for disclaimers and quotes; monospace italic |

---

## Layout & Structure

### Page Shell

```
┌──────────────────────────────────────────────────────────┐
│  [Logo: ✦ 2025 ▾]  [breadcrumb nav: « Prev | Lang | Next »]  │  ← Header bar (fixed, ~44px)
├──────────────┬───────────────────────────────────────────┤
│              │                                           │
│   Sidebar    │              Main Content                 │
│   (~160px)   │                                           │
│              │                                           │
│  (scrolls    │                                           │
│   with page) │                                           │
│              │                                           │
├──────────────┴───────────────────────────────────────────┤
│  Social share icons (bottom of sidebar, fixed)           │
│  Footer: prev/next links, bug report, Discord, copyright │
└──────────────────────────────────────────────────────────┘
```

### Header Bar
- Height: ~44px
- Three-zone layout: left (logo + hamburger), center (prev/next breadcrumb or language selector), right (next section CTA)
- Bottom border: dashed or dotted, low contrast
- The breadcrumb "« Prev | Language | Next »" uses the `»` and `«` characters as section arrows

### Left Sidebar Navigation
- Fixed width ~160px
- Top-level nav items in magenta/pink
- Active section indicated with `>` prefix
- Sub-items for active section shown indented in lighter text
- Social share icons pinned to bottom-left
- No visible border between sidebar and content — color alone separates them

### Main Content
- Left margin from sidebar; content begins around x=180px
- Max content width ~1100px (data tables/charts span wide)
- Generous top padding before section titles
- Sections separated by vertical whitespace, not dividers

---

## Components

### Section Headings
- Large all-caps display font
- A chain/link icon appears inline to the left (anchor link affordance)
- Subtitle text below in smaller monospace

### Tab Selector
- Pill-style tabs with a subtle outlined border
- Active tab has filled or underlined treatment
- "Query Builder…" link in magenta to the right of the tabs

### Filter/Sort Buttons
- Inline grouped buttons with border styling
- Active state: filled or outlined highlight
- Uses `⏶` (triangular arrow) character to indicate active sort direction
- Labels in monospace, mixed with special characters (↓, ⏶)

### Horizontal Bar Charts
- Full-width within their container
- Segmented into colored fills (cyan, muted teal, gray) with percentage labels inside each segment
- A second row of smaller bars below (sentiment: green/red/gray) — appears as a mini-chart
- Row number (1, 2, 3…) in a column to the left
- Category tag above the item name
- Item name as a styled link (cyan/underlined)
- Respondent count with a person icon on the far right
- Comment count with a speech-bubble icon (circle outline) on the far right
- Total "experience" percentage shown below the main bar (e.g. "98.8%")

### Line/Ratio Charts (over time)
- Multi-line chart on a dark grid
- Y-axis: 0–100% with faint horizontal gridlines
- X-axis: Survey year labels (2023, 2024, 2025)
- Each library is a distinct colored line
- Legend below chart with item names

### Data Table Controls
- "Category:" and "Baseline Status:" dropdowns styled as `<select>` with minimal border
- "Group by:" and "Sort by:" as button groups
- Labels for controls rendered in small monospace above or inline

### Tags / Badges
- Small, outlined pill (border only, no fill): used for API/hook names in the features chart (e.g. `useEffect`, `<Fragment>`)
- Border color matches the cyan accent

### CTA / Navigation Buttons
- "Start" button on hero: large, outlined rectangle, monospace text, centered
- "Show All (N hidden)" button: similar outlined style, full-width in list context

### Cards (Special Thanks / Resources)
- Avatar/image on left
- Name and role/affiliation on right
- Minimal styling — no elevated shadow; relies on layout and whitespace

### Email Signup
- Simple row: text input + "Notify Me" button
- Input has a visible border, monospace placeholder text
- Button styled like other outlined CTA buttons

---

## Hero / Landing Illustration

- Central hexagonal badge with geometric line borders (hex frame with horizontal bars)
- Atom/orbital ring illustration inside the hex
- "STATE OF" in small caps above, "REACT" in large display text, "リアクト" (katakana for "React") in magenta below — strong Japanese retro influence
- "2025" at the bottom of the hex
- The overall logo is cyan/teal on the dark background with magenta accents
- Drop-cap "Y" on the opening paragraph body text

---

## Motion & Interactivity

- Minimal animation — this is a data-dense, utility-first site
- Hover states on nav links and chart rows (likely a subtle highlight)
- Tab switching animates content pane
- The sidebar nav collapses to a hamburger on mobile (button visible in header)

---

## Spacing & Border System

- Spacing appears to use a loose 8px base grid
- Chart rows have ~8–12px vertical gap between entries
- Section titles have ~32–48px top margin
- Borders are used sparingly: dashed/dotted style reinforces the retro/terminal feel
- No box shadows; elevation is implied through color difference alone

---

## Summary: Design Tokens to Extract

```
Background:       #1a2b35 (approx)
Accent-cyan:      #00d4d4 (approx)
Accent-magenta:   #e040fb (approx)
Text-primary:     #e8e8e8
Text-dim:         #8899aa
Font-display:     "Bebas Neue", condensed sans-serif
Font-body:        Monospace (Courier New or custom)
Border-style:     1px dashed rgba(255,255,255,0.2)
Border-radius:    2–4px (very minimal, near-square)
```
