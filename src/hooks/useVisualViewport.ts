import { useEffect, useMemo, useState, type CSSProperties } from 'react';

type VisualViewportMetrics = {
  isMobile: boolean;
  width: number;
  height: number;
  left: number;
  top: number;
  bottomOffset: number;
};

function readMetrics(): VisualViewportMetrics {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      width: 0,
      height: 0,
      left: 0,
      top: 0,
      bottomOffset: 0,
    };
  }

  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  const visualViewport = window.visualViewport;

  if (!visualViewport) {
    return {
      isMobile,
      width: window.innerWidth,
      height: window.innerHeight,
      left: 0,
      top: 0,
      bottomOffset: 0,
    };
  }

  return {
    isMobile,
    width: visualViewport.width,
    height: visualViewport.height,
    left: visualViewport.offsetLeft,
    top: visualViewport.offsetTop,
    bottomOffset: Math.max(window.innerHeight - visualViewport.height - visualViewport.offsetTop, 0),
  };
}

let cachedMetrics: VisualViewportMetrics = readMetrics();
const subscribers = new Set<(metrics: VisualViewportMetrics) => void>();
let detachViewportListeners: (() => void) | null = null;

function publishMetrics() {
  cachedMetrics = readMetrics();
  subscribers.forEach((listener) => listener(cachedMetrics));
}

function ensureViewportListeners() {
  if (typeof window === 'undefined' || detachViewportListeners) return;

  const visualViewport = window.visualViewport;
  const mediaQuery = window.matchMedia('(max-width: 767px)');
  let rafId = 0;

  const schedulePublish = () => {
    window.cancelAnimationFrame(rafId);
    rafId = window.requestAnimationFrame(() => {
      publishMetrics();
    });
  };

  schedulePublish();

  visualViewport?.addEventListener('resize', schedulePublish);
  visualViewport?.addEventListener('scroll', schedulePublish);
  window.addEventListener('resize', schedulePublish);
  mediaQuery.addEventListener('change', schedulePublish);

  detachViewportListeners = () => {
    window.cancelAnimationFrame(rafId);
    visualViewport?.removeEventListener('resize', schedulePublish);
    visualViewport?.removeEventListener('scroll', schedulePublish);
    window.removeEventListener('resize', schedulePublish);
    mediaQuery.removeEventListener('change', schedulePublish);
    detachViewportListeners = null;
  };
}

function releaseViewportListenersIfIdle() {
  if (subscribers.size === 0) {
    detachViewportListeners?.();
  }
}

export function useVisualViewportMetrics(): VisualViewportMetrics {
  const [metrics, setMetrics] = useState<VisualViewportMetrics>(() => cachedMetrics);

  useEffect(() => {
    const listener = (nextMetrics: VisualViewportMetrics) => {
      setMetrics(nextMetrics);
    };

    subscribers.add(listener);
    ensureViewportListeners();
    publishMetrics();

    return () => {
      subscribers.delete(listener);
      releaseViewportListenersIfIdle();
    };
  }, []);

  return metrics;
}

export function useMobileFixedBottomStyle(baseBottom = 0): CSSProperties | undefined {
  const metrics = useVisualViewportMetrics();

  return useMemo(() => {
    if (!metrics.isMobile) return undefined;

    return {
      left: `${metrics.left}px`,
      right: 'auto',
      width: `${metrics.width}px`,
      maxWidth: `${metrics.width}px`,
      bottom: `${metrics.bottomOffset + baseBottom}px`,
    };
  }, [baseBottom, metrics]);
}

export function useMobileFixedFillStyle(): CSSProperties | undefined {
  const metrics = useVisualViewportMetrics();

  return useMemo(() => {
    if (!metrics.isMobile) return undefined;

    return {
      left: `${metrics.left}px`,
      top: `${metrics.top}px`,
      width: `${metrics.width}px`,
      height: `${metrics.height}px`,
      maxWidth: `${metrics.width}px`,
    };
  }, [metrics]);
}
