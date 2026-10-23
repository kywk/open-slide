import { render as renderPele } from 'pele';
import type { CSSProperties, ReactNode } from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface MermaidConfigLegacy {
  theme?: string;
  themeVariables?: Record<string, string | number>;
  [key: string]: unknown;
}

export interface MermaidProps {
  chart: string;
  className?: string;
  style?: CSSProperties;
  /** @deprecated Pele styles via CSS variables (`--pele-*`). Legacy themeVariables are mapped automatically. */
  config?: MermaidConfigLegacy;
  fallback?: ReactNode;
  lightbox?: boolean;
}

type RenderedDiagram = {
  element: SVGSVGElement;
};

let renderSequence = 0;

function nextRenderId(): string {
  renderSequence += 1;
  return `open-slide-mermaid-${renderSequence}`;
}

function resolveCanvasBg(el: HTMLElement | null): string {
  if (!el) return '#ffffff';
  const canvas = el.closest('[data-osd-canvas]') as HTMLElement | null;
  if (!canvas) return '#ffffff';
  return getComputedStyle(canvas).getPropertyValue('--osd-bg').trim() || '#ffffff';
}

function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  if (hex.length < 6) return true;
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

function normalizeSvg(svg: string, id?: string): SVGSVGElement {
  const template = document.createElement('template');
  template.innerHTML = svg.trim();
  const element = template.content.querySelector('svg');
  if (!element) throw new Error('Pele did not return an SVG');
  if (id && !element.id) {
    element.id = id;
  }
  const origWidth = element.getAttribute('width') ?? '800';
  const origHeight = element.getAttribute('height') ?? '600';
  const w = Number.parseFloat(origWidth);
  const h = Number.parseFloat(origHeight);
  if (!element.getAttribute('viewBox') && w > 0 && h > 0) {
    element.setAttribute('viewBox', `0 0 ${w} ${h}`);
  }
  element.setAttribute('width', '100%');
  element.setAttribute('height', '100%');
  element.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  element.setAttribute('data-mermaid-svg', '');
  element.setAttribute('data-pele-svg', '');
  element.style.display = 'block';
  element.style.maxWidth = '100%';
  element.style.maxHeight = '100%';
  return element;
}

const MAX_CACHE_ENTRIES = 100;
const diagramCache = new Map<string, SVGSVGElement>();

function getCachedDiagram(chart: string): SVGSVGElement {
  let template = diagramCache.get(chart);
  if (template) {
    diagramCache.delete(chart);
    diagramCache.set(chart, template);
  } else {
    const { svg } = renderPele(chart);
    template = normalizeSvg(svg);
    if (diagramCache.size >= MAX_CACHE_ENTRIES) {
      const oldest = diagramCache.keys().next().value;
      if (oldest !== undefined) diagramCache.delete(oldest);
    }
    diagramCache.set(chart, template);
  }
  const clone = template.cloneNode(true) as SVGSVGElement;
  clone.id = nextRenderId();
  return clone;
}

const peleDefaults: CSSProperties = {
  '--pele-bg': 'var(--osd-bg, #ffffff)',
  '--pele-fg': 'var(--osd-text, #111827)',
  '--pele-line': 'var(--osd-text, #111827)',
  '--pele-accent': 'var(--osd-accent, #6366f1)',
  '--pele-font': 'var(--osd-font-body, system-ui, sans-serif)',
  '--pele-radius': 'var(--osd-radius, 8px)',
  '--pele-border':
    'var(--pele-border, color-mix(in srgb, var(--osd-text, #111827) 24%, transparent))',
  '--pele-surface':
    'var(--pele-surface, color-mix(in srgb, var(--osd-text, #111827) 8%, var(--osd-bg, #ffffff)))',
  '--pele-surface-alt':
    'var(--pele-surface-alt, color-mix(in srgb, var(--osd-text, #111827) 16%, var(--osd-bg, #ffffff)))',
  '--pele-muted':
    'var(--pele-muted, color-mix(in srgb, var(--osd-text, #111827) 60%, transparent))',
  '--pele-series-1': 'var(--pele-series-1, var(--osd-accent, #6366f1))',
} as CSSProperties;

function legacyConfigToCssVars(config?: MermaidConfigLegacy): CSSProperties {
  if (!config?.themeVariables) return {};
  const tv = config.themeVariables;
  const vars: Record<string, string> = {};
  if (tv.primaryColor) vars['--pele-surface'] = String(tv.primaryColor);
  if (tv.primaryTextColor) vars['--pele-fg'] = String(tv.primaryTextColor);
  if (tv.primaryBorderColor) vars['--pele-border'] = String(tv.primaryBorderColor);
  if (tv.lineColor) vars['--pele-line'] = String(tv.lineColor);
  if (tv.secondaryColor) vars['--pele-surface-alt'] = String(tv.secondaryColor);
  if (tv.tertiaryColor) vars['--pele-accent'] = String(tv.tertiaryColor);
  if (tv.fontFamily) vars['--pele-font'] = String(tv.fontFamily);
  return vars as CSSProperties;
}

function extractDiagramCssVars(el: HTMLElement | null): CSSProperties {
  if (!el) return {};
  const computed = getComputedStyle(el);
  const canvas = el.closest('[data-osd-canvas]') as HTMLElement | null;
  const canvasComputed = canvas ? getComputedStyle(canvas) : computed;
  const vars: Record<string, string> = {};

  const keys = [
    '--osd-bg',
    '--osd-text',
    '--osd-accent',
    '--osd-font-body',
    '--osd-font-display',
    '--osd-radius',
    '--pele-bg',
    '--pele-fg',
    '--pele-line',
    '--pele-accent',
    '--pele-font',
    '--pele-font-mono',
    '--pele-radius',
    '--pele-border',
    '--pele-surface',
    '--pele-surface-alt',
    '--pele-muted',
    '--pele-critical',
    '--pele-series-1',
    '--pele-series-2',
    '--pele-series-3',
    '--pele-series-4',
    '--pele-series-5',
    '--pele-series-6',
    '--pele-series-7',
    '--pele-series-8',
  ];

  for (const key of keys) {
    const val =
      computed.getPropertyValue(key).trim() || canvasComputed.getPropertyValue(key).trim();
    if (val) {
      vars[key] = val;
    }
  }

  const bg =
    vars['--osd-bg'] ||
    vars['--pele-bg'] ||
    canvasComputed.getPropertyValue('--osd-bg').trim() ||
    '#ffffff';

  const isLight = isLightColor(bg);

  const fg =
    vars['--osd-text'] ||
    vars['--pele-fg'] ||
    canvasComputed.getPropertyValue('--osd-text').trim() ||
    (isLight ? '#111827' : '#f8fafc');

  const accent =
    vars['--osd-accent'] ||
    vars['--pele-accent'] ||
    canvasComputed.getPropertyValue('--osd-accent').trim() ||
    '#6366f1';

  const font =
    vars['--osd-font-body'] ||
    vars['--pele-font'] ||
    canvasComputed.getPropertyValue('--osd-font-body').trim() ||
    'system-ui, sans-serif';

  const radius =
    vars['--osd-radius'] ||
    vars['--pele-radius'] ||
    canvasComputed.getPropertyValue('--osd-radius').trim() ||
    '8px';

  vars['--osd-bg'] = bg;
  vars['--osd-text'] = fg;
  vars['--osd-accent'] = accent;
  vars['--osd-font-body'] = font;
  vars['--osd-radius'] = radius;

  vars['--pele-bg'] = bg;
  vars['--pele-fg'] = fg;
  vars['--pele-line'] = vars['--pele-line'] || fg;
  vars['--pele-accent'] = accent;
  vars['--pele-font'] = font;
  vars['--pele-radius'] = radius;
  vars['--pele-border'] = vars['--pele-border'] || `color-mix(in srgb, ${fg} 24%, transparent)`;
  vars['--pele-surface'] = vars['--pele-surface'] || `color-mix(in srgb, ${fg} 8%, ${bg})`;
  vars['--pele-surface-alt'] = vars['--pele-surface-alt'] || `color-mix(in srgb, ${fg} 16%, ${bg})`;
  vars['--pele-muted'] = vars['--pele-muted'] || `color-mix(in srgb, ${fg} 60%, transparent)`;
  vars['--pele-series-1'] = vars['--pele-series-1'] || accent;

  return vars as CSSProperties;
}

export function Mermaid({
  chart,
  className,
  style,
  config,
  fallback,
  lightbox = true,
}: MermaidProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const renderVersion = useRef(0);
  const [diagram, setDiagram] = useState<RenderedDiagram | null>(() => {
    if (typeof document === 'undefined') return null;
    try {
      if (diagramCache.has(chart)) {
        return { element: getCachedDiagram(chart) };
      }
    } catch {
      // ignore
    }
    return null;
  });
  const [error, setError] = useState<unknown>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [canvasBg, setCanvasBg] = useState('#ffffff');
  const [lightboxTheme, setLightboxTheme] = useState<CSSProperties>({});

  useEffect(() => {
    let active = true;
    const version = ++renderVersion.current;

    try {
      const element = getCachedDiagram(chart);
      if (!active || version !== renderVersion.current) return;
      setError(null);
      setDiagram({ element });
    } catch (cause: unknown) {
      if (!active || version !== renderVersion.current) return;
      wrapperRef.current?.replaceChildren();
      setDiagram(null);
      setError(cause);
    }

    return () => {
      active = false;
    };
  }, [chart]);

  useLayoutEffect(() => {
    if (!diagram || !diagramRef.current) return;
    const container = diagramRef.current;
    container.replaceChildren(diagram.element);
    return () => diagram.element.remove();
  }, [diagram]);

  const handleClick = useCallback(() => {
    if (lightbox && diagram) {
      setCanvasBg(resolveCanvasBg(wrapperRef.current));
      setLightboxTheme(extractDiagramCssVars(wrapperRef.current));
      setLightboxOpen(true);
    }
  }, [lightbox, diagram]);

  const isExpandable = lightbox && !!diagram;

  return (
    <>
      <div
        ref={wrapperRef}
        data-waitfor="svg"
        className={className}
        style={{
          ...peleDefaults,
          ...legacyConfigToCssVars(config),
          width: '100%',
          height: '100%',
          minWidth: 0,
          minHeight: 0,
          position: 'relative',
          overflow: 'hidden',
          cursor: isExpandable ? 'zoom-in' : undefined,
          ...style,
        }}
      >
        {diagram ? (
          <div ref={diagramRef} data-mermaid-diagram="" style={{ width: '100%', height: '100%' }} />
        ) : error ? (
          <>
            {fallback ?? <DefaultFallback />}
            <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute' }} />
          </>
        ) : null}
        {isExpandable && (
          <button
            type="button"
            aria-label="Expand diagram"
            onClick={handleClick}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              padding: 0,
              margin: 0,
              border: 'none',
              background: 'transparent',
              cursor: 'zoom-in',
            }}
          />
        )}
      </div>
      {lightbox && lightboxOpen && diagram && (
        <MermaidLightbox
          chart={chart}
          config={config}
          canvasBg={canvasBg}
          themeStyles={lightboxTheme}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

function MermaidLightbox({
  chart,
  config,
  canvasBg,
  themeStyles,
  onClose,
}: {
  chart: string;
  config?: MermaidConfigLegacy;
  canvasBg: string;
  themeStyles: CSSProperties;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const light = isLightColor(canvasBg);

  useEffect(() => {
    try {
      if (!containerRef.current) return;
      const el = getCachedDiagram(chart);
      containerRef.current.replaceChildren(el);
    } catch {
      // ignore
    }
  }, [chart]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        onClose();
      }
    };
    const target = (document.fullscreenElement as HTMLElement) ?? document;
    target.addEventListener('keydown', handleKey);
    return () => target.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const portalTarget = (document.fullscreenElement as HTMLElement) ?? document.body;
  const scrimColor = light ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.85)';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mermaid diagram expanded"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'grid',
        placeItems: 'center',
        padding: '2vh 2vw',
        background: scrimColor,
        backdropFilter: 'blur(4px)',
        cursor: 'zoom-out',
        animation: 'osd-lightbox-in 180ms ease-out',
      }}
    >
      <style>{`
        @keyframes osd-lightbox-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <div
        ref={containerRef}
        role="presentation"
        style={{
          ...themeStyles,
          ...legacyConfigToCssVars(config),
          width: '100%',
          height: '100%',
          maxWidth: '96vw',
          maxHeight: '96vh',
          background: canvasBg,
          color:
            (themeStyles as Record<string, string>)['--pele-fg'] ?? (light ? '#111827' : '#f8fafc'),
          borderRadius: 12,
          padding: '1rem',
          boxShadow: light
            ? '0 8px 60px rgba(0,0,0,0.3)'
            : '0 8px 60px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.08)',
          cursor: 'zoom-out',
        }}
      />
    </div>,
    portalTarget,
  );
}

function DefaultFallback() {
  return (
    <div
      role="alert"
      data-mermaid-error=""
      style={{
        maxWidth: '80%',
        padding: '20px 24px',
        border: '1px solid rgba(220, 38, 38, 0.3)',
        borderRadius: 10,
        background: 'rgba(220, 38, 38, 0.08)',
        color: 'currentColor',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 24,
        lineHeight: 1.4,
        textAlign: 'center',
      }}
    >
      Unable to render Mermaid diagram. Check the chart syntax.
    </div>
  );
}
