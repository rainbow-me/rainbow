import { useCallback, useEffect } from 'react';

import { useStableValue } from '@/hooks/useStableValue';
import { type Route } from '@/navigation/routesNames';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';

/** Replaces this consumer's quote demand and releases it on unmount. */
export function useLiveTokenSubscription(route: Route): (tokenIds: string[]) => void {
  const owner = useStableValue(() => Symbol('liveTokens'));

  useEffect(() => () => useLiveTokensStore.getState().removeSubscription(owner), [owner, route]);

  return useCallback(tokenIds => useLiveTokensStore.getState().setSubscription(owner, route, tokenIds), [owner, route]);
}
