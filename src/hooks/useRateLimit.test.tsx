/** @vitest-environment jsdom */

import assert from 'node:assert/strict';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, test, vi } from 'vitest';
import { useRateLimit } from './useRateLimit';

type HookSnapshot = ReturnType<typeof useRateLimit>;

let container: HTMLDivElement;
let root: Root;
let throttleRef: HookSnapshot | null = null;

function HookProbe({ limitMs }: { limitMs: number }) {
  throttleRef = useRateLimit(limitMs);
  return null;
}

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  throttleRef = null;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<HookProbe limitMs={2000} />);
  });
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  vi.useRealTimers();
});

test('throttles calls within the configured interval', async () => {
  const fn = vi.fn(async () => 'ok');

  const first = await throttleRef?.(() => fn());
  const second = await throttleRef?.(() => fn());

  assert.equal(first, 'ok');
  assert.equal(second, null);
  assert.equal(fn.mock.calls.length, 1);

  vi.setSystemTime(new Date('2026-01-01T00:00:03.000Z'));
  const third = await throttleRef?.(() => fn());
  assert.equal(third, 'ok');
  assert.equal(fn.mock.calls.length, 2);
});
