import { useEffect, useLayoutEffect, useMemo } from 'react';

import { memoizeLast } from '@/framework/core/utils/memoizeLast';
import { useRoute } from '@/navigation/RouteContext';
import { useStoreSharedValue, type ReadOnlySharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';
import { type LiveTokensData, type TokenData } from '@/state/liveTokens/types';
import { toUnixTime } from '@/worklets/dates';

export type LiveTokenValueOptions = {
  tokenId: string | undefined;
  /** Selects a string from the quote. Defaults to its price. */
  selector?: (token: TokenData) => string;
  /** Formats the selected live value. The fallback is already in returned form. */
  format?: (value: string) => string;
  /** Returned when the quote is absent or older than the fallback. */
  fallback: string;
  /** Unix seconds; defaults to zero. Live quotes win equal timestamps. */
  fallbackUpdatedAt?: number;
  /** Requests prices on this route by default. False still observes cached and incoming quotes. */
  autoSubscribe?: boolean;
};

const LISTEN_OPTIONS = Object.freeze({ returnListenHandle: true });

/**
 * Reads a live value as React state and requests prices by default.
 */
export function useLiveTokenValue(options: LiveTokenValueOptions): string {
  return useLiveTokensStore(useLiveTokenSelector(options));
}

/** Returns a shared live value; quote updates do not trigger React renders. */
export function useLiveTokenSharedValue(options: LiveTokenValueOptions): ReadOnlySharedValue<string> {
  const selector = useLiveTokenSelector(options);
  const [value, listenHandle] = useStoreSharedValue(useLiveTokensStore, selector, LISTEN_OPTIONS);

  useLayoutEffect(() => {
    listenHandle.current.refresh();
  }, [listenHandle, selector]);

  return value;
}

function useLiveTokenSelector({
  tokenId,
  selector = selectPrice,
  format,
  fallback,
  fallbackUpdatedAt = 0,
  autoSubscribe = true,
}: LiveTokenValueOptions): (state: { tokens: LiveTokensData }) => string {
  const route = useRoute().name;

  useEffect(() => {
    if (!autoSubscribe || !tokenId) return;
    return useLiveTokensStore.getState().subscribeToToken(route, tokenId);
  }, [autoSubscribe, route, tokenId]);

  const formatValue = useMemo(() => (format ? memoizeLast(format) : undefined), [format]);

  return useMemo(() => {
    let previousToken: TokenData | undefined;
    let value = fallback;

    return (state: { tokens: LiveTokensData }) => {
      const token = tokenId ? state.tokens[tokenId] : undefined;
      if (token === previousToken) return value;

      if (token && toUnixTime(token.updateTime) >= fallbackUpdatedAt) {
        const selected = selector(token);
        value = formatValue ? formatValue(selected) : selected;
      } else {
        value = fallback;
      }

      previousToken = token;
      return value;
    };
  }, [fallback, fallbackUpdatedAt, formatValue, selector, tokenId]);
}

function selectPrice(token: TokenData): string {
  return token.price;
}
