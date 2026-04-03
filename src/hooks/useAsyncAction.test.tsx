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
  let resolveTask: ((value: number) => void) | null = null;
  const task = (_value: number) => new Promise<number>((resolve) => {
    resolveTask = resolve;
  });

  act(() => {
    root.render(<HookProbe task={task} />);
  });

  const promise = executeRef?.(7);
  assert.equal(latestSnapshot?.loading, true);
  assert.equal(latestSnapshot?.error, null);

  resolveTask?.(42);
  const result = await promise;

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

  const result = await executeRef?.(1);
  assert.equal(result, null);
  assert.equal(latestSnapshot?.loading, false);
  assert.equal(latestSnapshot?.error, 'boom');
});
