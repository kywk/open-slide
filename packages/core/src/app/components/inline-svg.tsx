import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface InlineSvgProps {
  svg: string;
  className?: string;
  style?: CSSProperties;
  lightbox?: boolean;
  alt?: string;
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

export function InlineSvg({ svg, className, style, lightbox = true, alt }: InlineSvgProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [canvasBg, setCanvasBg] = useState('#ffffff');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = svg;
    const svgEl = el.querySelector('svg');
    if (svgEl) {
      svgEl.style.width = '100%';
      svgEl.style.height = '100%';
      svgEl.style.display = 'block';
      svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      if (alt && !svgEl.getAttribute('aria-label')) {
        svgEl.setAttribute('aria-label', alt);
        svgEl.setAttribute('role', 'img');
      }
    }
  }, [svg, alt]);

  const handleClick = useCallback(() => {
    if (lightbox && wrapperRef.current) {
      setCanvasBg(resolveCanvasBg(wrapperRef.current));
      setLightboxOpen(true);
    }
  }, [lightbox]);

  return (
    <>
      <div
        ref={wrapperRef}
        className={className}
        style={{
          width: '100%',
          height: '100%',
          minWidth: 0,
          minHeight: 0,
          position: 'relative',
          overflow: 'hidden',
          cursor: lightbox ? 'zoom-in' : undefined,
          ...style,
        }}
      >
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        {lightbox && (
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
      {lightbox && lightboxOpen && (
        <SvgLightbox svg={svg} canvasBg={canvasBg} onClose={() => setLightboxOpen(false)} />
      )}
    </>
  );
}

function SvgLightbox({
  svg,
  canvasBg,
  onClose,
}: {
  svg: string;
  canvasBg: string;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const light = isLightColor(canvasBg);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = svg;
    const svgEl = el.querySelector('svg');
    if (svgEl) {
      svgEl.style.width = '100%';
      svgEl.style.height = '100%';
      svgEl.style.display = 'block';
      svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    }
  }, [svg]);

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
  const scrimColor = light ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.8)';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Diagram expanded"
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
        padding: '4vh 4vw',
        background: scrimColor,
        backdropFilter: 'blur(4px)',
        cursor: 'zoom-out',
        animation: 'osd-svg-lightbox-in 180ms ease-out',
      }}
    >
      <style>{`
        @keyframes osd-svg-lightbox-in {
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
          maxWidth: '88vw',
          maxHeight: '88vh',
          background: canvasBg,
          borderRadius: 12,
          padding: '2.5rem',
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
