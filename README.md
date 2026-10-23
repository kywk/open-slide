<img width="1280" height="640" alt="open-slide github cover" src="https://github.com/user-attachments/assets/da535284-f7a9-4834-b281-f9ac6fe416e8" />

<br />
<br />
<a href="https://vercel.com/open-source-program">
  <img alt="Vercel OSS Program" src="https://vercel.com/oss/program-badge-2026.svg" />
</a>

# open-slide

[![GitHub stars](https://img.shields.io/github/stars/kywk/open-slide?style=for-the-badge)](https://github.com/kywk/open-slide/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/kywk/open-slide?style=for-the-badge)](https://github.com/kywk/open-slide/network/members)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> [!IMPORTANT]
> **Downstream Fork & Upstream Attribution**
> This repository is an active downstream fork of [open-slide/open-slide](https://github.com/open-slide/open-slide), created and maintained by [@1weiho](https://github.com/1weiho) ([Yiwei Ho](https://github.com/1weiho)).
> 
> We track and merge upstream releases regularly while providing extended capabilities focused on vector diagramming, Pele integration, and visual diagram workflows. Published under the `@kywk` scope (`@kywk/open-slide-core` and `@kywk/open-slide-cli`).

**The slide framework built for agents.** Describe your deck in natural language — your coding agent writes the React. open-slide handles canvas scaling, navigation, hot reload, and present mode so the agent can focus on content.

---

## Getting Started

### Installation (This Fork)

Create a new presentation workspace using this fork:

```bash
npx @kywk/open-slide-cli init my-slide
cd my-slide
pnpm install
pnpm dev
```

The scaffolded workspace includes preconfigured agent skills (`create-slide`, `slide-authoring`, `apply-comments`) along with built-in support for our extended diagramming components.

> [!NOTE]
> **Don't need the fork extensions?**
> If you only require standard open-slide without our diagramming additions (such as Pele-rendered `<Mermaid>`, `<InlineSvg>` lightbox, and diagram-design routing), please install and use the official upstream version directly:
> ```bash
> npx @open-slide/cli init my-slide
> ```
> Visit the official [upstream repository](https://github.com/open-slide/open-slide) and the official [open-slide documentation](https://open-slide.dev) for standard usage.

---

## Core Features (Upstream)

open-slide provides a complete, agent-native presentation environment. For detailed documentation on all core capabilities, please visit the official documentation:

| Feature | Description | Official Documentation |
| --- | --- | --- |
| **Fixed 1920 × 1080 Canvas** | True pixel-accurate scaling and standard React + Tailwind components | [Getting Started](https://open-slide.dev/docs/getting-started) |
| **Agent-Native Authoring** | Claude Code, Codex, and Cursor integration with built-in authoring skills | [Agent Guide](https://open-slide.dev/docs/core-feature/agent) |
| **In-App Agent Panel** | Browser-native agent chat, live edits, question cards, and presence indicators | [Agent Panel](https://open-slide.dev/docs/core-feature/agent) |
| **In-Browser Inspector & Comments** | Point-and-click comment mode with `@slide-comment` markers and `/apply-comments` | [Inspector & Comments](https://open-slide.dev/docs/core-feature/inspector) |
| **Assets Manager & svgl Search** | Asset management, Google Fonts preview, and [svgl.app](https://svgl.app) logo picker | [Assets Manager](https://open-slide.dev/docs/core-feature/assets-manager) |
| **Stage-Ready Presenter Mode** | Dual-display preview, markdown speaker notes, and presentation timer | [Presenter Mode](https://open-slide.dev/docs) |
| **Multi-Format Export** | Export to static HTML, print PDF, and editable native PowerPoint (PPTX) | [Export Guide](https://open-slide.dev/docs/core-feature/export) |
| **Deck & Theme Management** | Folder organization with emoji icons, theme extraction and tokens | [Themes](https://open-slide.dev/docs/core-feature/themes) |

---

## Fork Extensions & Usage Tips

This fork extends open-slide with **production-grade technical and editorial diagramming capabilities**, making it easy for AI agents and human authors to embed, theme, and interact with diagrams.

### 1. Vector-Native `<Mermaid>` Powered by Pele

Unlike upstream, which lacks built-in diagramming, this fork integrates **Pele** as the Mermaid rendering engine:

- **Zero-Config Design Token Harmonization**: Diagrams render as clean SVGs that automatically inherit open-slide's CSS theme variables (`--osd-bg`, `--osd-text`, `--osd-accent`, `--osd-font-body`). They adapt dynamically to light/dark themes and Design panel color adjustments without hardcoded hex values.
- **Interactive Lightbox (Click-to-Expand)**: Every `<Mermaid>` diagram supports click-to-expand out of the box, allowing viewers to inspect intricate flowcharts and architecture diagrams full-screen during a presentation.
- **Custom Pele Overrides**: Pass `--pele-*` variables directly via `style` to customize specific diagrams:
  ```tsx
  import { Mermaid } from '@kywk/open-slide-core';

  const pipeline = `
  graph LR
    A[Raw Prompt] --> B[Agent Model]
    B --> C{Decision}
    C -->|Code| D[React Page]
    C -->|Visual| E[Vector Diagram]
  `;

  <Mermaid
    chart={pipeline}
    style={{
      width: 1680,
      height: 600,
      '--pele-accent': '#6366f1',
    }}
    lightbox
  />
  ```

### 2. `<InlineSvg>` Component with Lightbox

For complex static SVGs (such as editorial diagrams generated from external skills, design tools, or raw vector assets), embed them via `<InlineSvg>`:

```tsx
import { InlineSvg } from '@kywk/open-slide-core';
import architectureSvg from './assets/system-arch.svg?raw';

<InlineSvg
  svg={architectureSvg}
  alt="System Architecture Diagram"
  lightbox
/>
```

- **Built-in Normalization**: Automatically normalizes `viewBox`, scales responsively within pixel-bound containers, and provides accessibility labels.
- **Lightbox Support**: Full-screen modal expansion by default. Pass `lightbox={false}` for purely decorative marks.

### 3. Diagram Routing & Authoring Decision Tree

Our built-in agent skill references (`packages/core/skills/slide-authoring/references/diagrams.md` and `mermaid.md`) teach coding agents how to choose the right visualization strategy:

```
Is the `diagram-design` skill available?
├─ YES → Can diagram-design handle this type (architecture, sequence, sankey, flywheel, etc.)?
│        ├─ YES → Use `diagram-design` → output SVG → embed with `<InlineSvg lightbox />`
│        └─ NO  → Use `<Mermaid lightbox />`
└─ NO  → Use `<Mermaid lightbox />`
```

#### Canvas Layout Tips for 1920 × 1080
- **Full-Width (Default)**: Best for wide and shallow diagrams (`flowchart LR`, shallow ER). Heading and subtitle above, diagram below (`width: 1680, height: 560`).
- **Two-Column**: Best for tall and narrow flows (sequence diagrams, deep trees). Text narrative on the left (760px), diagram on the right (760px).
- **Full-Bleed**: For dense system architectures where the diagram is the hero element. Use a small top eyebrow label and allocate the canvas (`width: 1800, height: 960`).
- **Concise Node Labels**: Aim for **3–5 words maximum** per node label. Use `<br/>` for intentional line breaks (`A["Build<br/>container"]`). If a diagram exceeds 15–20 nodes, split across multiple slides rather than shrinking labels beyond legibility.

---

## Monorepo Layout

| Path | Package | Role |
| --- | --- | --- |
| [packages/core](packages/core) | `@kywk/open-slide-core` | Runtime (viewer, present mode, inspector, Pele Mermaid, InlineSvg), Vite plugin, CLI. |
| [packages/cli](packages/cli) | `@kywk/open-slide-cli` | `npx @kywk/open-slide-cli init` scaffolder + project template. |
| [apps/demo](apps/demo) | private | Example workspace consuming local `@kywk/open-slide-core` via `workspace:*`. |
| [apps/web](apps/web) | private | Documentation and landing site. |

## Development

```bash
pnpm install
pnpm dev          # Run demo against local core
pnpm build        # Build all packages
pnpm check        # Biome format & lint check
pnpm typecheck    # TypeScript type check
pnpm test         # Unit tests (Vitest)
```

To sync package scopes after merging upstream:
```bash
node scripts/rename-scope.mjs --write
pnpm check:fix
```

---

## Upstream Credits & Support

open-slide was originally designed and built by [Yiwei Ho (@1weiho)](https://github.com/1weiho). We are grateful for his work in creating this agent-native slide framework.

- Original Repository: [github.com/open-slide/open-slide](https://github.com/open-slide/open-slide)
- Official Documentation: [open-slide.dev](https://open-slide.dev)
- Support the original creator:

<a href="https://buymeacoffee.com/1weiho"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me a Coffee" height="40"></a>

## License

MIT License.

Original work Copyright © 2026 [Yiwei Ho](https://github.com/1weiho).
Fork modifications Copyright © 2026 [Yu Zhi Chen (@kywk)](https://github.com/kywk).
