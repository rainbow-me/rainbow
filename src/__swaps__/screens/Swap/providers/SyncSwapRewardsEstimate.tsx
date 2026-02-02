import { useCallback, useEffect, useRef } from 'react';
import { logger, RainbowError } from '@/logger';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { swapsStore, useSwapsStore } from '@/state/swaps/swapsStore';
import { buildEstimateRewardPayload, fetchEstimateReward } from '@/features/rnbw-rewards/utils/estimateReward';

export function SyncSwapRewardsEstimate() {
  const quote = useSwapsStore(state => state.quote);
  const currency = userAssetsStoreManager(state => state.currency);

  const requestKeyRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const resetEstimate = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (requestKeyRef.current) {
      requestKeyRef.current = null;
    }
    swapsStore.setState({
      rewardsEstimate: null,
    });
  }, []);

  useEffect(() => {
    if (!quote || 'error' in quote) {
      resetEstimate();
      return;
    }

    const payload = buildEstimateRewardPayload({ quote, currency });
    if (!payload) {
      resetEstimate();
      return;
    }

    const nextKey = JSON.stringify(payload);
    if (nextKey === requestKeyRef.current) return;

    requestKeyRef.current = nextKey;
    abortRef.current?.abort();

    const abortController = new AbortController();
    abortRef.current = abortController;

    const fetchRewardsEstimate = async () => {
      try {
        const result = await fetchEstimateReward({ payload, abortController });

        if (abortController.signal.aborted || requestKeyRef.current !== nextKey) return;

        swapsStore.setState({
          rewardsEstimate: result,
        });
      } catch (error) {
        if (abortController.signal.aborted || requestKeyRef.current !== nextKey) return;

        logger.error(new RainbowError('[SyncSwapRewardsEstimate]: Failed to fetch rewards estimate', error));
        swapsStore.setState({
          rewardsEstimate: null,
        });
      }
    };

    fetchRewardsEstimate();

    return () => {
      abortController.abort();
    };
  }, [currency, quote, resetEstimate]);

  return null;
}
