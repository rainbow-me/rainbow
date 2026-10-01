import { useCallback } from 'react';

import { useCleanup } from '@/hooks/useCleanup';
import { useStableValue } from '@/hooks/useStableValue';
import { useRoute } from '@/navigation/RouteContext';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';

/**
 * Subscribes a component to live token prices. The returned function replaces its token list.
 * Unsubscribes when the route changes or the component unmounts.
 */
export function useLiveTokenSubscription(): (tokenIds: readonly string[]) => void {
  const { name: route } = useRoute();
  const owner = useStableValue(() => Symbol('liveTokens'));

  useCleanup(() => useLiveTokensStore.getState().removeSubscription(owner), [owner, route]);

  return useCallback(tokenIds => useLiveTokensStore.getState().setSubscription(owner, route, tokenIds), [owner, route]);
}
