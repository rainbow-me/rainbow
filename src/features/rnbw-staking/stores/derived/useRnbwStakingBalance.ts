import { createDerivedStore, shallowEqual } from '@storesjs/stores';

import { convertAmountToNativeDisplayWorklet } from '@/features/currency/utils/nativeDisplay';
import { RNBW_DECIMALS } from '@/features/rnbw-staking/constants';
import { convertRawAmountToDecimalFormat, truncateToDecimalsWithThreshold } from '@/helpers/utilities';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

import { useStakingPositionStore } from '../rnbwStakingPositionStore';

type StakingBalance = {
  tokenAmount: string;
  nativeCurrencyAmount: string;
  hasStakedPosition: boolean;
};

export const useRnbwStakingBalance = createDerivedStore<StakingBalance>(
  $ => {
    const rawStakedRnbw = $(useStakingPositionStore, state => state.getData()?.stakedRnbw ?? '0');
    const stakedValueInCurrency = $(useStakingPositionStore, state => state.getData()?.stakedValueInCurrency ?? '0');
    const decimals = $(useStakingPositionStore, state => state.getData()?.decimals ?? RNBW_DECIMALS);
    const currency = $(userAssetsStoreManager, state => state.currency);
    const isZero = rawStakedRnbw === '0';

    const decimalAmount = convertRawAmountToDecimalFormat(rawStakedRnbw, decimals);
    const formattedTokenAmount = truncateToDecimalsWithThreshold({ value: decimalAmount, decimals: 1, threshold: '0.01' });

    return {
      tokenAmount: isZero ? '0' : formattedTokenAmount,
      nativeCurrencyAmount: convertAmountToNativeDisplayWorklet(stakedValueInCurrency, currency, !isZero),
      hasStakedPosition: !isZero,
    };
  },
  { equalityFn: shallowEqual, lockDependencies: true }
);
