import { convertAmountToNativeDisplayWorklet, convertRawAmountToDecimalFormat, truncateToDecimalsWithThreshold } from '@/helpers/utilities';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { shallowEqual } from '@/worklets/comparisons';
import { useStakingPositionStore } from '../rnbwStakingPositionStore';

type StakingBalance = {
  tokenAmount: string;
  nativeCurrencyAmount: string;
  hasStakedPosition: boolean;
};

export const useStakingBalance = createDerivedStore<StakingBalance>(
  $ => {
    const data = $(useStakingPositionStore, state => state.getData());
    const currency = $(userAssetsStoreManager, state => state.currency);

    const rawStakedRnbw = data?.stakedRnbw ?? '0';
    const stakedValueInCurrency = data?.stakedValueInCurrency ?? '0';
    const decimals = data?.decimals ?? 18;
    const isZero = rawStakedRnbw === '0';

    const decimalAmount = convertRawAmountToDecimalFormat(rawStakedRnbw, decimals);
    const formattedTokenAmount = truncateToDecimalsWithThreshold({ value: decimalAmount, decimals: 1, threshold: '0.01' });

    return {
      tokenAmount: isZero ? '0' : formattedTokenAmount,
      nativeCurrencyAmount: convertAmountToNativeDisplayWorklet(stakedValueInCurrency, currency, !isZero),
      hasStakedPosition: !isZero,
    };
  },
  { equalityFn: shallowEqual, fastMode: true }
);
