/** @vitest-environment jsdom */

import assert from 'node:assert/strict';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, test } from 'vitest';
import { useAsyncAction } from './useAsyncAction';

type HookSnapshot = ReturnType<typeof useAsyncAction<number, [number]>>;

let container: HTMLDivElement;
let root: Root;
let latestSnapshot: HookSnapshot | null = null;
let executeRef: HookSnapshot['execute'] | null = null;

function HookProbe({ task, message }: { task: (value: number) => Promise<number>; message?: string }) {
  const snapshot = useAsyncAction<number, [number]>(task, message ? { errorMessage: message } : undefined);
  latestSnapshot = snapshot;
  executeRef = snapshot.execute;
  return null;
}

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  latestSnapshot = null;
  executeRef = null;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
});

test('executes async action and updates loading state', async () => {
  const task = async (_value: number) => 42;

  act(() => {
    root.render(<HookProbe task={task} />);
  });

  let result: number | null = null;
  await act(async () => {
    result = await executeRef?.(7) ?? null;
  });

  assert.equal(result, 42);
  assert.equal(latestSnapshot?.loading, false);
  assert.equal(latestSnapshot?.error, null);
});

test('exposes fallback error message when async action throws', async () => {
  const task = async () => {
    throw new Error('boom');
  };

  act(() => {
    root.render(<HookProbe task={task} message="Action impossible" />);
  });

  let result: number | null = null;
  await act(async () => {
    result = await executeRef?.(1) ?? null;
  });

  assert.equal(result, null);
  assert.equal(latestSnapshot?.loading, false);
  assert.equal(latestSnapshot?.error, 'boom');
});
