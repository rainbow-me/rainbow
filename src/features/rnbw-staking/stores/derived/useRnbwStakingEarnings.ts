import { convertRawAmountToDecimalFormat, isZero, truncateToDecimalsWithThreshold } from '@/helpers/utilities';
import { createDerivedStore, shallowEqual } from '@storesjs/stores';
import { useStakingPositionStore } from '../rnbwStakingPositionStore';
import { sumWorklet } from '@/framework/core/safeMath';
import { formatNumber } from '@/helpers/strings';

type StakingEarnings = {
  totalEarnings: string;
  cashbackEarnings: string;
  exitRewardsEarnings: string;
};

const EMPTY_EARNINGS: StakingEarnings = {
  totalEarnings: '0',
  cashbackEarnings: '0',
  exitRewardsEarnings: '0',
};

export const useRnbwStakingEarnings = createDerivedStore<StakingEarnings>(
  $ => {
    const data = $(useStakingPositionStore, state => state.getData());

    if (!data) return EMPTY_EARNINGS;

    const tokenDecimals = data.decimals;
    const lifetimePnl = data.pnl;
    const cashbackRaw = lifetimePnl.totalCashbackReceived;
    const exitRewardsRaw = lifetimePnl.exchangeRateGain;
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
