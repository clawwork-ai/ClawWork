import { useEffect, useRef, useCallback, type KeyboardEvent } from 'react';
import { useReducedMotion } from 'framer-motion';

let overlayCount = 0;
let savedScrollY = 0;

function acquireOverlay() {
  if (overlayCount++ > 0) return;
  savedScrollY = window.scrollY;
  const s = document.body.style;
  s.position = 'fixed';
  s.top = `-${savedScrollY}px`;
  s.left = '0';
  s.right = '0';
  s.overflow = 'hidden';
  document.getElementById('root')?.setAttribute('inert', '');
}

function releaseOverlay() {
  if (--overlayCount > 0) return;
  const s = document.body.style;
  s.position = '';
  s.top = '';
  s.left = '';
  s.right = '';
  s.overflow = '';
  window.scrollTo(0, savedScrollY);
  document.getElementById('root')?.removeAttribute('inert');
}

let portalEl: HTMLElement | null = null;

function getPortalTarget(): HTMLElement {
  if (!portalEl) {
    portalEl = document.createElement('div');
    portalEl.id = 'overlay-root';
    document.body.appendChild(portalEl);
  }
  return portalEl;
}

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function useOverlay(open: boolean, onClose: () => void) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion() ?? false;

  useEffect(() => {
    if (!open) return;
    acquireOverlay();
    return releaseOverlay;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    prevFocusRef.current = document.activeElement as HTMLElement | null;
    const id = requestAnimationFrame(() => {
      containerRef.current?.querySelector<HTMLElement>('button')?.focus();
    });
    return () => {
      cancelAnimationFrame(id);
      if (prevFocusRef.current?.isConnected) prevFocusRef.current.focus();
    };
  }, [open]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !containerRef.current) return;
      const els = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (els.length === 0) return;
      const first = els[0]!;
      const last = els[els.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  return { portalTarget: getPortalTarget(), containerRef, reducedMotion, handleKeyDown };
}
