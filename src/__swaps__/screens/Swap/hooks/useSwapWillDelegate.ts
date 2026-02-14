import { useEffect, useRef, useState } from 'react';
import { willDelegate } from '@rainbow-me/delegation';
import { logger, RainbowError } from '@/logger';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { ATOMIC_SWAPS, DELEGATION, getExperimentalFlag } from '@/config';
import { getRemoteConfig } from '@/model/remoteConfig';

export function useSwapWillDelegate(): boolean {
  const quote = useSwapsStore(state => state.quote);
  const [result, setResult] = useState(false);
  const requestKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const delegationEnabled = getRemoteConfig().delegation_enabled || getExperimentalFlag(DELEGATION);
    const atomicSwapsEnabled = getRemoteConfig().atomic_swaps_enabled || getExperimentalFlag(ATOMIC_SWAPS);

    if (!delegationEnabled || !atomicSwapsEnabled || !quote || 'error' in quote) {
      requestKeyRef.current = null;
      setResult(false);
      return;
    }

    const nextKey = `${quote.from}-${quote.chainId}`;
    if (nextKey === requestKeyRef.current) return;
    requestKeyRef.current = nextKey;

    const abortController = new AbortController();

    willDelegate({ address: quote.from, chainId: quote.chainId })
      .then(res => {
        if (abortController.signal.aborted || requestKeyRef.current !== nextKey) return;
        setResult(res.willDelegate);
      })
      .catch(error => {
        if (abortController.signal.aborted || requestKeyRef.current !== nextKey) return;
        logger.error(new RainbowError('[useSwapWillDelegate]: Failed to check delegation status', error));
        setResult(false);
      });

    return () => {
      abortController.abort();
    };
  }, [quote]);

  return result;
}
