import * as React from 'react';

const MOBILE_QUERY = '(max-width: 767px)';

function subscribe(callback: () => void): () => void {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}

function getSnapshot(): boolean {
  return window.matchMedia(MOBILE_QUERY).matches;
}

export function useIsMobile(): boolean {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => false);
}
