/** @vitest-environment jsdom */

import assert from 'node:assert/strict';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, test, vi } from 'vitest';
import { useNetworkStatus } from './useNetworkStatus';

type HookSnapshot = ReturnType<typeof useNetworkStatus>;

let container: HTMLDivElement;
let root: Root;
let latestSnapshot: HookSnapshot | null = null;

function HookProbe() {
  latestSnapshot = useNetworkStatus();
  return null;
}

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers();
  latestSnapshot = null;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<HookProbe />);
  });
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  vi.useRealTimers();
});

test('tracks offline/online transitions and resets wasOffline after delay', () => {
  assert.equal(latestSnapshot?.isOnline, true);
  assert.equal(latestSnapshot?.wasOffline, false);

  act(() => {
    window.dispatchEvent(new Event('offline'));
  });
  assert.equal(latestSnapshot?.isOnline, false);
  assert.equal(latestSnapshot?.wasOffline, false);

  act(() => {
    window.dispatchEvent(new Event('online'));
  });
  assert.equal(latestSnapshot?.isOnline, true);
  assert.equal(latestSnapshot?.wasOffline, true);

  act(() => {
    vi.advanceTimersByTime(3000);
  });
  assert.equal(latestSnapshot?.wasOffline, false);
});
