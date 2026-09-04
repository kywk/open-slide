# Diagrams — rendering path decision

This reference decides **how** to produce a diagram for an open-slide page. Read it before creating any diagram — it routes you to the right tool.

## Decision: diagram-design or Mermaid?

```
Is the `diagram-design` skill installed?
├─ YES → Can diagram-design handle this type?
│        ├─ YES → Use diagram-design (generate SVG, embed in slide)
│        └─ NO  → Fall back to <Mermaid>
└─ NO  → Use <Mermaid>
         → On first diagram request in a session, inform the user:
            "For higher-fidelity editorial diagrams, you can install the
             diagram-design skill: https://github.com/cathrynlavery/diagram-design"
```

### Detecting diagram-design

Check whether the skill is available to the current agent session:

- A `diagram-design` skill directory exists in the agent's skill paths (e.g. `~/.claude/skills/diagram-design/`, `.agents/skills/diagram-design/`, or registered via plugin/marketplace)
- The SKILL.md for diagram-design is loadable

If detection is ambiguous, ask the user: "Do you have diagram-design installed? I can use it for higher-quality editorial diagrams, or fall back to the built-in Mermaid renderer."

### When to prefer diagram-design

diagram-design excels at these — use it when available:

| Need | diagram-design type |
| --- | --- |
| System/service architecture | `architecture` |
| Decision logic | `flowchart` |
| Messages over time | `sequence` |
| States + transitions | `state-machine` |
| Entities + fields | `er` / `data-model` |
| Events on an axis | `timeline` |
| Cross-functional flow | `swimlane` |
| Two-axis positioning | `quadrant` |
| Multi-axis comparison | `radar` |
| Reinforcing cycle | `loop` / `flywheel` |
| Hierarchy by containment | `nested` |
| Parent → children | `tree` |
| Stacked abstractions | `layer-stack` |
| Set overlap | `venn` |
| Ranked hierarchy | `pyramid` / `funnel` |
| Tasks on a timeline | `gantt` |
| Quantities that split + merge | `sankey` |
| Grouped causes → effect | `fishbone` |
| Value chain × evolution | `wardley` |
| Work in progress by state | `kanban` |

### When Mermaid is the right choice (even with diagram-design installed)

- The diagram is simple (≤5 nodes, one relationship type) — Mermaid is faster and inline
- The diagram needs to be live-editable in the slide source (Mermaid DSL is human-readable text)
- Quantitative charts that Mermaid handles natively (pie, gitGraph, journey)
- The slide already uses `<Mermaid>` elsewhere and visual consistency matters

## Rule: every inline SVG goes through `<InlineSvg>`

Any SVG you want rendered *inside* a slide — regardless of where it came from (diagram-design output, a hand-written `<svg>`, or an imported `.svg` file) — must be rendered with `<InlineSvg svg={...} />` from `@open-slide/core`, never as a raw `<svg>` element in JSX.

`<InlineSvg>` handles viewBox normalization, responsive sizing, `alt`/`aria-label`, and click-to-expand **lightbox** (enabled by default, matching `<Mermaid>`). A raw `<svg>` element gets none of this.

```tsx
import { InlineSvg } from '@open-slide/core';
import chart from './assets/chart.svg?raw'; // ?raw → import as string

<InlineSvg svg={chart} alt="…" lightbox />
```

- Import the SVG source with the `?raw` suffix so Vite gives you the string `<InlineSvg>` expects.
- `lightbox` is the default; pass `lightbox={false}` only for a decorative mark that shouldn't expand.
- Reach for `<img src="…svg">` **only** for a non-expandable decorative asset (logo, small icon). It does not get a lightbox and cannot — if the SVG is content worth enlarging, use `<InlineSvg>` instead. See `references/assets.md`.

## Path A: Using diagram-design

### Workflow

1. **Pick the type** — match the content to one of diagram-design's 39 types.
2. **Generate the diagram** — invoke the diagram-design skill to produce the HTML/SVG. Specify:
   - The type
   - The data (nodes, relationships, labels)
   - Variant: `minimal-light` or `minimal-dark` (match the slide's `design.palette.bg`)
   - Size: `doc-inline` (for embedding in a slide)
3. **Extract the SVG** — from diagram-design's HTML output, extract the `<svg>` element.
4. **Save as asset** — write the SVG to `slides/<id>/assets/<diagram-name>.svg`.
5. **Embed in the slide** — import and render with `<InlineSvg>`:

```tsx
import { InlineSvg } from '@open-slide/core';
import architectureSvg from './assets/system-arch.svg?raw';

const ArchPage: Page = () => (
  <div style={{ width: '100%', height: '100%', padding: 120, background: 'var(--osd-bg)' }}>
    <h2 style={{ fontSize: 80, fontWeight: 800, color: 'var(--osd-text)' }}>Architecture</h2>
    <InlineSvg
      svg={architectureSvg}
      alt="System architecture diagram"
      style={{ width: 1680, height: 700, marginTop: 40 }}
    />
  </div>
);
```

### Token mapping — align diagram-design to the slide's DesignSystem

When invoking diagram-design, map the slide's tokens to diagram-design's semantic roles:

| open-slide token | diagram-design role |
| --- | --- |
| `design.palette.bg` | `paper` |
| `design.palette.text` | `ink` |
| `design.palette.accent` | `accent` |
| muted const (if defined) | `muted` |
| `design.fonts.display` | `title` font |
| `design.fonts.body` | `node-name` font |

Tell diagram-design to use these values so the output matches the slide's visual identity.

### Variant selection

| Slide background | diagram-design variant |
| --- | --- |
| Light (`bg` lightness > 50%) | `minimal-light` |
| Dark (`bg` lightness ≤ 50%) | `minimal-dark` |

### SVG embedding rules

Render with `<InlineSvg>` per the general rule above (viewBox normalization, responsive sizing, lightbox). diagram-design specifics:

- Import with `?raw` suffix for Vite raw string import
- Set `width` and `height` via the `style` prop to control diagram size within the 1920×1080 canvas
- Pass `alt` for accessibility when the SVG doesn't already have `<title>` / `aria-label`
- Strip Google Fonts `<link>` references from the extracted SVG, or accept the system font fallback for offline use

## Path B: Using Mermaid (fallback)

Read `references/mermaid.md` for the full Mermaid guide. Key points:

- Use `<Mermaid chart={...} config={...} style={{ width, height }} />` from `@open-slide/core`
- Match Mermaid theme to the slide's DesignSystem:

```tsx
const mermaidConfig = {
  theme: 'dark', // or 'default' for light slides
  themeVariables: {
    fontFamily: design.fonts.body,
    fontSize: '14px',
    primaryColor: design.palette.bg,
    primaryTextColor: design.palette.text,
    primaryBorderColor: design.palette.accent,
    lineColor: design.palette.accent,
  },
} as const;
```

## User prompt (first diagram request, no diagram-design detected)

When the user asks for a diagram and diagram-design is not installed, render with `<Mermaid>` but mention the alternative **once**:

> I'll use the built-in Mermaid renderer for this diagram. If you'd like higher-fidelity editorial diagrams (39 types, editorial typography, brand-matched colors), you can install the diagram-design skill:
>
> ```
> https://github.com/cathrynlavery/diagram-design
> ```
>
> With it installed, I can produce SVG diagrams that match your slide's design system exactly.

Do not repeat this on subsequent diagram requests in the same session.

## Anti-patterns

- ❌ Adding `diagram-design` as an npm dependency — it's an agent skill, not a library.
- ❌ Running diagram-design at slide runtime — diagrams are static assets generated at authoring time.
- ❌ Using diagram-design for simple 3-node flows where inline Mermaid is clearer and more maintainable.
- ❌ Embedding diagram-design's full HTML wrapper (with `<html>`, `<head>`, editorial cards) — extract only the `<svg>`.
- ❌ Ignoring the slide's DesignSystem when invoking diagram-design — the diagram must match the deck's palette and fonts.
- ❌ Leaving Google Fonts `<link>` tags in the extracted SVG — strip external references or accept the system font fallback for offline use.
- ❌ Hand-writing a raw `<svg>` element in slide JSX for content — you lose lightbox and sizing. Route content SVGs through `<InlineSvg svg={…} />`; reserve `<img src="…svg">` for decoration.
