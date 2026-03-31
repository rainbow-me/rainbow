import { convertAmountToNativeDisplayWorklet, truncateToDecimalsWithThreshold } from '@/helpers/utilities';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { shallowEqual } from '@/worklets/comparisons';
import { RNBW_TOKEN_UNIQUE_ID } from '@/features/rnbw-staking/constants';

type RnbwBalance = {
  tokenAmountFormatted: string;
  nativeCurrencyAmount: string;
  hasBalance: boolean;
};

export const useStakableRnbwBalance = createDerivedStore<RnbwBalance>(
  $ => {
    const asset = $(useUserAssetsStore, state => state.getUserAsset(RNBW_TOKEN_UNIQUE_ID));
    const currency = $(userAssetsStoreManager, state => state.currency);

    const amount = asset?.balance?.amount ?? '0';
    const nativeValue = asset?.native?.balance?.amount ?? '0';
    const hasBalance = amount !== '0';

    return {
      tokenAmountFormatted: truncateToDecimalsWithThreshold({ value: amount, decimals: 2, threshold: '0.01' }),
      nativeCurrencyAmount: convertAmountToNativeDisplayWorklet(nativeValue, currency, hasBalance),
      hasBalance,
    };
  },
  { equalityFn: shallowEqual, fastMode: true }
);
