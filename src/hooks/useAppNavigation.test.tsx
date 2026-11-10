// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { useAppNavigation } from './useAppNavigation';

const globalWithAct = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
globalWithAct.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;
let container: HTMLDivElement;

function NavigationHarness() {
  const currentNavigation = useAppNavigation(true);
  return createElement(
    'div',
    {
      'data-screen': currentNavigation.screen,
      'data-view': currentNavigation.collectionView ? 'collection' : 'pitch',
    },
    createElement('button', { id: 'dashboard', onClick: () => currentNavigation.navigateToScreen('dashboard') }),
    createElement('button', { id: 'history', onClick: () => currentNavigation.navigateToScreen('history') }),
    createElement('button', { id: 'pitch', onClick: () => currentNavigation.navigateDashboardView(false) }),
    createElement('button', { id: 'collection', onClick: () => currentNavigation.navigateDashboardView(true) }),
    createElement('button', { id: 'restore', onClick: currentNavigation.restoreDashboard }),
  );
}

function mountNavigation(): void {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() => root?.render(createElement(NavigationHarness)));
}

async function clickButton(id: string): Promise<void> {
  await act(async () => {
    container.querySelector<HTMLButtonElement>(`#${id}`)?.click();
  });
}

async function goBackOrForward(direction: 'back' | 'forward'): Promise<void> {
  await act(async () => {
    await new Promise<void>((resolve) => {
      const finish = () => {
        window.removeEventListener('popstate', finish);
        window.clearTimeout(timeout);
        resolve();
      };
      const timeout = window.setTimeout(finish, 1000);
      window.addEventListener('popstate', finish, { once: true });
      window.history[direction]();
    });
  });
}

function resetBrowserHistory(): void {
  window.history.replaceState({ fc26Draft: { screen: 'home', collectionView: false } }, '', '/');
}

function expectNavigation(screen: string, view: string): void {
  const state = container.firstElementChild;
  expect(state?.getAttribute('data-screen')).toBe(screen);
  expect(state?.getAttribute('data-view')).toBe(view);
}

afterEach(() => {
  if (root) act(() => root?.unmount());
  container?.remove();
  root = undefined;
});

describe.each([
  ['desktop', 1280],
  ['mobile', 390],
])('%s browser history navigation', (_device, viewportWidth) => {
  it('updates Pitch and Collection on Back and Forward', async () => {
    resetBrowserHistory();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: viewportWidth });
    window.history.replaceState({ fc26Draft: { screen: 'home', collectionView: false } }, '', '/');
    mountNavigation();

    await clickButton('dashboard');
    await clickButton('collection');
    expectNavigation('dashboard', 'collection');

    await goBackOrForward('back');
    expectNavigation('dashboard', 'pitch');

    await goBackOrForward('forward');
    expectNavigation('dashboard', 'collection');
  });

  it('restores the selected dashboard view after a page refresh', async () => {
    resetBrowserHistory();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: viewportWidth });
    window.history.replaceState({ fc26Draft: { screen: 'home', collectionView: false } }, '', '/');
    mountNavigation();

    await clickButton('dashboard');
    await clickButton('collection');
    expectNavigation('dashboard', 'collection');

    act(() => root?.unmount());
    root = undefined;
    mountNavigation();
    expectNavigation('dashboard', 'collection');

    await clickButton('restore');
    expectNavigation('dashboard', 'collection');
  });

  it('navigates back to the previous app screen and forward to the dashboard', async () => {
    resetBrowserHistory();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: viewportWidth });
    window.history.replaceState({ fc26Draft: { screen: 'home', collectionView: false } }, '', '/');
    mountNavigation();

    await clickButton('history');
    await clickButton('dashboard');
    expectNavigation('dashboard', 'pitch');

    await goBackOrForward('back');
    expectNavigation('history', 'pitch');

    await goBackOrForward('forward');
    expectNavigation('dashboard', 'pitch');
  });
});
