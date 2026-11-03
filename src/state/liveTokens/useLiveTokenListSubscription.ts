import { useCallback, useEffect, useRef } from 'react';

import { useRoute } from '@/navigation/RouteContext';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';

const EMPTY_TOKENS: ReadonlySet<string> = new Set();

/**
 * Subscribes a list to live token prices. The returned function replaces its token set.
 * Releases the set when the route changes or the list unmounts.
 */
export function useLiveTokenListSubscription(): (tokenIds: readonly string[]) => void {
  const { name: route } = useRoute();
  const tokensRef = useRef(EMPTY_TOKENS);

  useEffect(
    () => () => {
      const previous = tokensRef.current;
      tokensRef.current = EMPTY_TOKENS;
      useLiveTokensStore.getState().replaceSubscribedTokens(route, previous, EMPTY_TOKENS);
    },
    [route]
  );

  return useCallback(
    tokenIds => {
      const previous = tokensRef.current;
      const next = tokenIds.length ? new Set(tokenIds) : EMPTY_TOKENS;
      tokensRef.current = next;
      useLiveTokensStore.getState().replaceSubscribedTokens(route, previous, next);
    },
    [route]
  );
}
