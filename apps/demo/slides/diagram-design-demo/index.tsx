import { type DesignSystem, InlineSvg, type Page, type SlideMeta } from '@open-slide/core';
import type { ReactNode } from 'react';
import architectureSvg from './assets/architecture.svg?raw';
import flowchartSvg from './assets/flowchart.svg?raw';
import sequenceSvg from './assets/sequence.svg?raw';

export const design: DesignSystem = {
  palette: { bg: '#fafaf8', text: '#1a1a1a', accent: '#eb6c36' },
  fonts: {
    display: "'Instrument Serif', Georgia, serif",
    body: "'Geist', system-ui, -apple-system, sans-serif",
  },
  typeScale: { hero: 160, body: 36 },
  radius: 8,
};

const muted = '#787878';
const hairline = '#e8e8e8';

const fill = {
  width: '100%',
  height: '100%',
  fontFamily: 'var(--osd-font-body)',
} as const;

const Eyebrow = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      color: 'var(--osd-accent)',
      fontFamily: 'var(--osd-font-body)',
      fontSize: 18,
      fontWeight: 500,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
    }}
  >
    {children}
  </div>
);

const Cover: Page = () => (
  <div
    style={{
      ...fill,
      background: 'var(--osd-bg)',
      color: 'var(--osd-text)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '0 160px',
      position: 'relative',
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        background: 'var(--osd-accent)',
      }}
    />
    <Eyebrow>DIAGRAM DESIGN × OPEN-SLIDE</Eyebrow>
    <h1
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 'var(--osd-size-hero)',
        fontWeight: 400,
        lineHeight: 1.0,
        margin: '28px 0 0',
      }}
    >
      Editorial Diagrams
    </h1>
    <p style={{ fontSize: 38, color: muted, margin: '36px 0 0', maxWidth: 1100, lineHeight: 1.45 }}>
      39 diagram types. Self-contained SVG. No shadows, no Mermaid slop. Matched to your slide's
      design system in 60 seconds.
    </p>
    <div
      style={{
        position: 'absolute',
        bottom: 80,
        left: 160,
        display: 'flex',
        gap: 32,
        color: muted,
        fontSize: 22,
        fontFamily: "'Geist Mono', monospace",
      }}
    >
      <span>cathrynlavery/diagram-design</span>
      <span style={{ color: hairline }}>·</span>
      <span>embedded as static SVG assets</span>
    </div>
  </div>
);

const Architecture: Page = () => (
  <div style={{ ...fill, background: 'var(--osd-bg)', color: 'var(--osd-text)', padding: 100 }}>
    <Eyebrow>ARCHITECTURE</Eyebrow>
    <h2
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 72,
        fontWeight: 400,
        margin: '16px 0 0',
      }}
    >
      System Overview
    </h2>
    <p style={{ color: muted, fontSize: 30, margin: '12px 0 40px' }}>
      Three-tier architecture with async processing. Accent marks the API Gateway — the single entry
      point.
    </p>
    <InlineSvg
      svg={architectureSvg}
      alt="Three-tier architecture with async processing"
      style={{
        width: 1720,
        height: 640,
        border: `1px solid ${hairline}`,
        borderRadius: 8,
        padding: 24,
        boxSizing: 'border-box',
      }}
    />
  </div>
);

const Sequence: Page = () => (
  <div style={{ ...fill, background: 'var(--osd-bg)', color: 'var(--osd-text)', padding: 100 }}>
    <Eyebrow>SEQUENCE</Eyebrow>
    <h2
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 72,
        fontWeight: 400,
        margin: '16px 0 0',
      }}
    >
      Token Refresh Flow
    </h2>
    <p style={{ color: muted, fontSize: 30, margin: '12px 0 40px' }}>
      Bearer token expires → 401 → silent refresh → retry. The accent highlights the refresh call.
    </p>
    <InlineSvg
      svg={sequenceSvg}
      alt="Token refresh sequence diagram"
      style={{ width: 1440, height: 640, margin: '0 auto', padding: 24, boxSizing: 'border-box' }}
    />
  </div>
);

const Flowchart: Page = () => (
  <div style={{ ...fill, background: 'var(--osd-bg)', color: 'var(--osd-text)', padding: 100 }}>
    <Eyebrow>FLOWCHART</Eyebrow>
    <h2
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 72,
        fontWeight: 400,
        margin: '16px 0 0',
      }}
    >
      Request Authorization
    </h2>
    <p style={{ color: muted, fontSize: 30, margin: '12px 0 40px' }}>
      Decision logic: authenticate first, then authorize. Accent marks the happy path.
    </p>
    <InlineSvg
      svg={flowchartSvg}
      alt="Request authorization flowchart"
      style={{ width: 1280, height: 640, margin: '0 auto', padding: 24, boxSizing: 'border-box' }}
    />
  </div>
);

const Comparison: Page = () => (
  <div style={{ ...fill, background: 'var(--osd-bg)', color: 'var(--osd-text)', padding: 100 }}>
    <Eyebrow>COMPARISON</Eyebrow>
    <h2
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 72,
        fontWeight: 400,
        margin: '16px 0 0',
      }}
    >
      diagram-design vs Mermaid
    </h2>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, marginTop: 56 }}>
      <div>
        <h3
          style={{ fontSize: 36, fontWeight: 600, margin: '0 0 20px', color: 'var(--osd-accent)' }}
        >
          diagram-design
        </h3>
        <ul style={{ fontSize: 30, lineHeight: 1.8, paddingLeft: 36, color: 'var(--osd-text)' }}>
          <li>39 editorial visual types</li>
          <li>Static SVG — no JS runtime</li>
          <li>4px grid, 1px hairline, single accent</li>
          <li>Brand-matched via style-guide tokens</li>
          <li>Agent skill — generates at authoring time</li>
        </ul>
      </div>
      <div>
        <h3 style={{ fontSize: 36, fontWeight: 600, margin: '0 0 20px' }}>Mermaid</h3>
        <ul style={{ fontSize: 30, lineHeight: 1.8, paddingLeft: 36, color: muted }}>
          <li>~15 diagram types</li>
          <li>Runtime render — needs mermaid.js</li>
          <li>Auto-layout, limited styling control</li>
          <li>Theme via themeVariables (limited)</li>
          <li>Inline DSL — live-editable in source</li>
        </ul>
      </div>
    </div>
    <div
      style={{
        marginTop: 48,
        padding: '24px 32px',
        borderLeft: `4px solid var(--osd-accent)`,
        background: '#fef8f4',
        fontSize: 28,
        lineHeight: 1.5,
        borderRadius: 4,
      }}
    >
      Use <span style={{ fontWeight: 600, color: 'var(--osd-accent)' }}>diagram-design</span> for
      presentation-quality visuals. Use <span style={{ fontWeight: 600 }}>Mermaid</span> for quick
      inline diagrams or when diagram-design is not installed.
    </div>
  </div>
);

const HowItWorks: Page = () => (
  <div style={{ ...fill, background: 'var(--osd-bg)', color: 'var(--osd-text)', padding: 100 }}>
    <Eyebrow>WORKFLOW</Eyebrow>
    <h2
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 72,
        fontWeight: 400,
        margin: '16px 0 48px',
      }}
    >
      How It Works
    </h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
      <div
        style={{
          border: `1px solid ${hairline}`,
          borderTop: '3px solid var(--osd-accent)',
          padding: 32,
          borderRadius: 8,
        }}
      >
        <div
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: 20,
            color: 'var(--osd-accent)',
          }}
        >
          01
        </div>
        <h3 style={{ fontSize: 30, margin: '16px 0 12px', fontWeight: 600 }}>Describe</h3>
        <p style={{ fontSize: 24, color: muted, lineHeight: 1.5, margin: 0 }}>
          Tell the agent what you need: "architecture diagram of our auth system"
        </p>
      </div>
      <div
        style={{
          border: `1px solid ${hairline}`,
          borderTop: '3px solid var(--osd-accent)',
          padding: 32,
          borderRadius: 8,
        }}
      >
        <div
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: 20,
            color: 'var(--osd-accent)',
          }}
        >
          02
        </div>
        <h3 style={{ fontSize: 30, margin: '16px 0 12px', fontWeight: 600 }}>Generate</h3>
        <p style={{ fontSize: 24, color: muted, lineHeight: 1.5, margin: 0 }}>
          Agent invokes diagram-design skill, maps your slide's palette to its tokens
        </p>
      </div>
      <div
        style={{
          border: `1px solid ${hairline}`,
          borderTop: '3px solid var(--osd-accent)',
          padding: 32,
          borderRadius: 8,
        }}
      >
        <div
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: 20,
            color: 'var(--osd-accent)',
          }}
        >
          03
        </div>
        <h3 style={{ fontSize: 30, margin: '16px 0 12px', fontWeight: 600 }}>Extract</h3>
        <p style={{ fontSize: 24, color: muted, lineHeight: 1.5, margin: 0 }}>
          SVG extracted from HTML output, saved to slides/id/assets/
        </p>
      </div>
      <div
        style={{
          border: `1px solid ${hairline}`,
          borderTop: '3px solid var(--osd-accent)',
          padding: 32,
          borderRadius: 8,
        }}
      >
        <div
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: 20,
            color: 'var(--osd-accent)',
          }}
        >
          04
        </div>
        <h3 style={{ fontSize: 30, margin: '16px 0 12px', fontWeight: 600 }}>Embed</h3>
        <p style={{ fontSize: 24, color: muted, lineHeight: 1.5, margin: 0 }}>
          Import with ?raw, render via dangerouslySetInnerHTML in a sized container
        </p>
      </div>
    </div>
    <div
      style={{
        marginTop: 56,
        fontFamily: "'Geist Mono', monospace",
        fontSize: 22,
        color: muted,
        textAlign: 'center',
      }}
    >
      {
        "import svg from './assets/diagram.svg?raw'  →  <div dangerouslySetInnerHTML={{ __html: svg }} />"
      }
    </div>
  </div>
);

export const meta: SlideMeta = {
  title: 'Diagram Design × Open-Slide Demo',
  createdAt: '2026-08-24T07:08:41.973Z',
};

export default [Cover, Architecture, Sequence, Flowchart, Comparison, HowItWorks] satisfies Page[];
