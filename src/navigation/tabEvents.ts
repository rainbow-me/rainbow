import { useLayoutEffect } from 'react';

import useLatestCallback from '@/hooks/useLatestCallback';
import { useRoute } from '@/navigation/RouteContext';
import { createEventBus } from '@/state/internal/events/createEventBus';

export const tabReselectEvents = createEventBus<Record<string, undefined>>();

/**
 * Runs when the current route's tab is selected again, after the tab press is accepted.
 * Keeps the callback current and removes the listener when the component unmounts.
 */
export function useOnTabReselect(onReselect: () => void): void {
  const routeKey = useRoute().key;
  const callback = useLatestCallback(onReselect);

  useLayoutEffect(() => tabReselectEvents.on(routeKey, callback), [callback, routeKey]);
}
