import { useCallback } from 'react';

import { useCleanup } from '@/hooks/useCleanup';
import { useStableValue } from '@/hooks/useStableValue';
import { useRoute } from '@/navigation/RouteContext';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';

/** Replaces this consumer's quote demand and releases it on unmount. */
export function useLiveTokenSubscription(): (tokenIds: string[]) => void {
  const { name: route } = useRoute();
  const owner = useStableValue(() => Symbol('liveTokens'));

  useCleanup(() => useLiveTokensStore.getState().removeSubscription(owner), [owner, route]);

  return useCallback(tokenIds => useLiveTokensStore.getState().setSubscription(owner, route, tokenIds), [owner, route]);
}
