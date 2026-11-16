// @vitest-environment jsdom
import { act, createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { REVEAL_ALL_INTERVAL_MS, useProgressiveReveal } from './useProgressiveReveal';

const globalWithAct = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
globalWithAct.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
let container: HTMLDivElement;

function RevealHarness({ initialIndex = 0 }: { initialIndex?: number }) {
  const [revealIndex, setRevealIndex] = useState(initialIndex);
  const [isRevealScreen, setIsRevealScreen] = useState(true);
  const { isRevealingAll, startRevealAll } = useProgressiveReveal(revealIndex, setRevealIndex, isRevealScreen);

  return createElement(
    'div',
    { 'data-index': revealIndex, 'data-running': isRevealingAll },
    createElement('button', { id: 'start', onClick: startRevealAll }),
    createElement('button', { id: 'leave', onClick: () => setIsRevealScreen(false) }),
  );
}

function mount(initialIndex = 0): void {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() => root?.render(createElement(RevealHarness, { initialIndex })));
}

function getIndex(): number {
  return Number(container.firstElementChild?.getAttribute('data-index'));
}

function isRunning(): boolean {
  return container.firstElementChild?.getAttribute('data-running') === 'true';
}

afterEach(() => {
  if (root) act(() => root?.unmount());
  container?.remove();
  root = undefined;
  vi.useRealTimers();
});

describe('useProgressiveReveal', () => {
  it('continues revealing from the current card at a steady interval', () => {
    vi.useFakeTimers();
    mount(4);

    act(() => container.querySelector<HTMLButtonElement>('#start')?.click());
    expect(getIndex()).toBe(5);
    expect(isRunning()).toBe(true);

    act(() => vi.advanceTimersByTime(REVEAL_ALL_INTERVAL_MS));
    expect(getIndex()).toBe(6);
    act(() => vi.advanceTimersByTime(REVEAL_ALL_INTERVAL_MS));
    expect(getIndex()).toBe(7);
  });

  it('stops at the tenth card and returns control to the normal reveal button', () => {
    vi.useFakeTimers();
    mount(8);

    act(() => container.querySelector<HTMLButtonElement>('#start')?.click());
    expect(getIndex()).toBe(9);
    act(() => vi.advanceTimersByTime(REVEAL_ALL_INTERVAL_MS));
    expect(getIndex()).toBe(10);
    expect(isRunning()).toBe(false);
    act(() => vi.runOnlyPendingTimers());
    expect(getIndex()).toBe(10);
  });

  it('cancels the remaining sequence when leaving the reveal screen', () => {
    vi.useFakeTimers();
    mount(2);

    act(() => container.querySelector<HTMLButtonElement>('#start')?.click());
    expect(getIndex()).toBe(3);

    act(() => container.querySelector<HTMLButtonElement>('#leave')?.click());
    expect(isRunning()).toBe(false);
    act(() => vi.advanceTimersByTime(REVEAL_ALL_INTERVAL_MS * 3));
    expect(getIndex()).toBe(3);
  });
});
