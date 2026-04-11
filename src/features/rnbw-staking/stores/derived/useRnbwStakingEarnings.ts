import { createDerivedStore, shallowEqual } from '@storesjs/stores';

import { RNBW_DECIMALS } from '@/features/rnbw-staking/constants';
import { sumWorklet } from '@/framework/core/safeMath';
import { formatNumber } from '@/helpers/strings';
import { convertRawAmountToDecimalFormat, isZero, truncateToDecimalsWithThreshold } from '@/helpers/utilities';

import { useStakingPositionStore } from '../rnbwStakingPositionStore';

type StakingEarnings = {
  totalEarnings: string;
  cashbackEarnings: string;
  exitRewardsEarnings: string;
};

export const useRnbwStakingEarnings = createDerivedStore<StakingEarnings>(
  $ => {
    const tokenDecimals = $(useStakingPositionStore, state => state.getData()?.decimals ?? RNBW_DECIMALS);
    const cashbackRaw = $(useStakingPositionStore, state => state.getData()?.pnl.totalCashbackReceived ?? '0');
    const exitRewardsRaw = $(useStakingPositionStore, state => state.getData()?.pnl.exchangeRateGain ?? '0');
    const totalRaw = sumWorklet(cashbackRaw, exitRewardsRaw);
    const totalEarnings = convertRawAmountToDecimalFormat(totalRaw, tokenDecimals);
    const cashbackEarnings = convertRawAmountToDecimalFormat(cashbackRaw, tokenDecimals);
    const exitRewardsEarnings = convertRawAmountToDecimalFormat(exitRewardsRaw, tokenDecimals);

    return {
      totalEarnings: isZero(totalEarnings) ? '0' : formatNumber(totalEarnings, { decimals: 4 }),
      cashbackEarnings: isZero(cashbackEarnings)
        ? '0'
        : truncateToDecimalsWithThreshold({ value: cashbackEarnings, decimals: 2, threshold: '0.01' }),
      exitRewardsEarnings: isZero(exitRewardsEarnings)
        ? '0'
        : truncateToDecimalsWithThreshold({ value: exitRewardsEarnings, decimals: 2, threshold: '0.01' }),
    };
  },
  { equalityFn: shallowEqual, lockDependencies: true }
);
