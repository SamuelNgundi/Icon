import { useEffect, useState } from 'react';

export type AppScreen = 'home' | 'setup' | 'reveal' | 'dashboard' | 'database' | 'history';
export type AppHistoryState = { screen: AppScreen; collectionView: boolean };

const APP_HISTORY_KEY = 'fc26Draft';
const APP_SCREENS: AppScreen[] = ['home', 'setup', 'reveal', 'dashboard', 'database', 'history'];

function readAppHistoryState(state: unknown): AppHistoryState | undefined {
  if (!state || typeof state !== 'object') return undefined;
  const appState = (state as Record<string, unknown>)[APP_HISTORY_KEY];
  if (!appState || typeof appState !== 'object') return undefined;
  const { screen, collectionView } = appState as Record<string, unknown>;
  if (typeof screen !== 'string' || !APP_SCREENS.includes(screen as AppScreen) || typeof collectionView !== 'boolean') return undefined;
  return { screen: screen as AppScreen, collectionView };
}

function writeHistoryState(appState: AppHistoryState, replace: boolean): void {
  const state = { ...window.history.state, [APP_HISTORY_KEY]: appState };
  if (replace) window.history.replaceState(state, '', window.location.href);
  else window.history.pushState(state, '', window.location.href);
}

export function useAppNavigation(tournamentAvailable: boolean) {
  const [screen, setScreen] = useState<AppScreen>(() => readAppHistoryState(window.history.state)?.screen ?? 'home');
  const [collectionView, setCollectionView] = useState(
    () => readAppHistoryState(window.history.state)?.collectionView ?? false,
  );

  function navigateToScreen(nextScreen: AppScreen, replace = false): void {
    const appState: AppHistoryState = { screen: nextScreen, collectionView: false };
    const currentAppState = readAppHistoryState(window.history.state);
    if (!replace && currentAppState?.screen === nextScreen && !currentAppState.collectionView) {
      setScreen(nextScreen);
      setCollectionView(false);
      return;
    }
    writeHistoryState(appState, replace);
    setScreen(nextScreen);
    setCollectionView(false);
  }

  function navigateDashboardView(nextCollectionView: boolean, replace = false): void {
    if (collectionView === nextCollectionView) return;
    writeHistoryState({ screen: 'dashboard', collectionView: nextCollectionView }, replace);
    setScreen('dashboard');
    setCollectionView(nextCollectionView);
  }

  function restoreDashboard(): void {
    const currentAppState = readAppHistoryState(window.history.state);
    if (currentAppState?.screen === 'dashboard') {
      setScreen('dashboard');
      setCollectionView(currentAppState.collectionView);
      return;
    }
    navigateToScreen('dashboard', true);
  }

  useEffect(() => {
    if (!readAppHistoryState(window.history.state)) {
      writeHistoryState({ screen: 'home', collectionView: false }, true);
    }

    const handlePopState = (event: PopStateEvent) => {
      const appState = readAppHistoryState(event.state);
      if (!appState || (appState.screen === 'dashboard' && !tournamentAvailable)) {
        setScreen('home');
        setCollectionView(false);
        return;
      }
      setScreen(appState.screen);
      setCollectionView(appState.screen === 'dashboard' && appState.collectionView);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [tournamentAvailable]);

  return { screen, collectionView, navigateToScreen, navigateDashboardView, restoreDashboard };
}
