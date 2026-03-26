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

export function useVisualViewportMetrics(): VisualViewportMetrics {
  const [metrics, setMetrics] = useState<VisualViewportMetrics>(() => readMetrics());

  useEffect(() => {
    const update = () => setMetrics(readMetrics());
    const visualViewport = window.visualViewport;
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const frameId = window.requestAnimationFrame(update);
    const settleTimer = window.setTimeout(update, 120);
    const settleTimerLate = window.setTimeout(update, 360);
    const intervalId = window.setInterval(update, 250);

    update();
    visualViewport?.addEventListener('resize', update);
    visualViewport?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    mediaQuery.addEventListener('change', update);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(settleTimer);
      window.clearTimeout(settleTimerLate);
      window.clearInterval(intervalId);
      visualViewport?.removeEventListener('resize', update);
      visualViewport?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      mediaQuery.removeEventListener('change', update);
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
