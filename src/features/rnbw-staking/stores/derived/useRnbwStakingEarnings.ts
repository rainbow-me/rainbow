import { convertRawAmountToDecimalFormat, isZero } from '@/helpers/utilities';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { shallowEqual } from '@/worklets/comparisons';
import { useStakingPositionStore } from '../rnbwStakingPositionStore';
import { divWorklet, sumWorklet, toFixedWorklet, toPercentageWorklet, truncateToDecimals } from '@/framework/core/safeMath';
import { formatNumber } from '@/helpers/strings';

type StakingEarnings = {
  totalEarnings: string;
  cashbackEarnings: string;
  cashbackShare: string;
  exitRewardsEarnings: string;
  exitRewardsShare: string;
};

const EMPTY_EARNINGS: StakingEarnings = {
  totalEarnings: formatNumber('0', { decimals: 4 }),
  cashbackEarnings: formatNumber('0'),
  cashbackShare: '0%',
  exitRewardsEarnings: formatNumber('0'),
  exitRewardsShare: '0%',
};

export const useRnbwStakingEarnings = createDerivedStore<StakingEarnings>(
  $ => {
    const data = $(useStakingPositionStore, state => state.getData());

    if (!data) return EMPTY_EARNINGS;

    const tokenDecimals = data.decimals;
    const sessionPnl = data.sessionPnl;
    const cashbackRaw = sessionPnl.totalCashbackReceived;
    const exitRewardsRaw = sessionPnl.exchangeRateGain;
    const totalRaw = sumWorklet(cashbackRaw, exitRewardsRaw);
    const totalIsZero = isZero(totalRaw);
    const totalEarnings = convertRawAmountToDecimalFormat(totalRaw, tokenDecimals);
    const cashbackEarnings = convertRawAmountToDecimalFormat(cashbackRaw, tokenDecimals);
    const exitRewardsEarnings = convertRawAmountToDecimalFormat(exitRewardsRaw, tokenDecimals);
    const cashbackRatio = totalIsZero ? '0' : toFixedWorklet(divWorklet(cashbackRaw, totalRaw), 2);
    const exitRewardsRatio = totalIsZero ? '0' : toFixedWorklet(divWorklet(exitRewardsRaw, totalRaw), 2);

    return {
      totalEarnings: formatNumber(totalEarnings, { decimals: 4 }),
      cashbackEarnings: isZero(cashbackEarnings) ? '0' : formatNumber(truncateToDecimals(cashbackEarnings, 2), { decimals: 2 }),
      cashbackShare: totalIsZero ? '0%' : `${toPercentageWorklet(cashbackRatio)}%`,
      exitRewardsEarnings: isZero(exitRewardsEarnings) ? '0' : formatNumber(truncateToDecimals(exitRewardsEarnings, 2), { decimals: 2 }),
      exitRewardsShare: totalIsZero ? '0%' : `${toPercentageWorklet(exitRewardsRatio)}%`,
    };
  },
  { equalityFn: shallowEqual, fastMode: true }
);
