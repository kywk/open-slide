import type { MermaidConfig } from 'mermaid';
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

export interface MermaidProps {
  chart: string;
  className?: string;
  style?: CSSProperties;
  config?: MermaidConfig;
  fallback?: ReactNode;
  lightbox?: boolean;
}

type RenderedDiagram = {
  element: SVGSVGElement;
  bindFunctions?: (element: Element) => void;
};

let mermaidPromise: Promise<typeof import('mermaid')['default']> | undefined;
let renderSequence = 0;

function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(({ default: mermaid }) => mermaid);
  }
  return mermaidPromise;
}

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

function normalizeSvg(svg: string): SVGSVGElement {
  const template = document.createElement('template');
  template.innerHTML = svg.trim();
  const element = template.content.querySelector('svg');
  if (!element) throw new Error('Mermaid did not return an SVG');
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
  element.style.display = 'block';
  element.style.maxWidth = '100%';
  element.style.maxHeight = '100%';
  return element;
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
  const [diagram, setDiagram] = useState<RenderedDiagram | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [canvasBg, setCanvasBg] = useState('#ffffff');

  const configRef = useRef(config);
  const prevConfigKey = useRef('');
  const currentConfigKey = JSON.stringify(config ?? null);
  if (currentConfigKey !== prevConfigKey.current) {
    configRef.current = config;
    prevConfigKey.current = currentConfigKey;
  }
  const stableConfig = configRef.current;

  useEffect(() => {
    let active = true;
    const version = ++renderVersion.current;
    setDiagram(null);
    setError(null);

    loadMermaid()
      .then((mermaid) => {
        mermaid.initialize({
          ...stableConfig,
          startOnLoad: false,
          securityLevel: stableConfig?.securityLevel ?? 'strict',
        });
        return mermaid.render(nextRenderId(), chart, wrapperRef.current ?? undefined);
      })
      .then(({ svg, bindFunctions }) => {
        if (!active || version !== renderVersion.current) return;
        setDiagram({ element: normalizeSvg(svg), bindFunctions });
      })
      .catch((cause: unknown) => {
        if (!active || version !== renderVersion.current) return;
        wrapperRef.current?.replaceChildren();
        setError(cause);
      });

    return () => {
      active = false;
    };
  }, [chart, stableConfig]);

  useEffect(() => {
    if (!diagram || !diagramRef.current) return;
    const container = diagramRef.current;
    container.replaceChildren(diagram.element);
    diagram.bindFunctions?.(container);
    return () => diagram.element.remove();
  }, [diagram]);

  const handleClick = useCallback(() => {
    if (lightbox && diagram) {
      setCanvasBg(resolveCanvasBg(wrapperRef.current));
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
  onClose,
}: {
  chart: string;
  config?: MermaidConfig;
  canvasBg: string;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const light = isLightColor(canvasBg);

  useEffect(() => {
    loadMermaid()
      .then((mermaid) => {
        mermaid.initialize({
          ...config,
          startOnLoad: false,
          securityLevel: config?.securityLevel ?? 'strict',
        });
        return mermaid.render(nextRenderId(), chart, containerRef.current ?? undefined);
      })
      .then(({ svg, bindFunctions }) => {
        if (!containerRef.current) return;
        const el = normalizeSvg(svg);
        containerRef.current.replaceChildren(el);
        bindFunctions?.(containerRef.current);
      })
      .catch(() => {});
  }, [chart, config]);

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
          width: '100%',
          height: '100%',
          maxWidth: '96vw',
          maxHeight: '96vh',
          background: canvasBg,
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
