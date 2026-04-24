import { createDerivedStore, shallowEqual } from '@storesjs/stores';

import { divWorklet, isPositive, mulWorklet, subWorklet, toFixedWorklet, toPercentageWorklet } from '@/framework/core/safeMath';
import { formatNumber } from '@/helpers/strings';
import { convertRawAmountToDecimalFormatWorklet, isZero } from '@/helpers/utilities';

import { useStakingPositionStore } from '../rnbwStakingPositionStore';

type StakingPositionPnl = {
  exitFeeOffsetRatio: string;
  exitFeeOffsetRatioDisplay: string;
  netPnl: string;
  isPositivePnl: boolean;
  earningsRequiredToBreakEven: string;
  rnbwAfterUnstake: string;
};

const EMPTY_VALUE: StakingPositionPnl = {
  exitFeeOffsetRatio: '0',
  exitFeeOffsetRatioDisplay: '0%',
  netPnl: '0',
  isPositivePnl: false,
  earningsRequiredToBreakEven: '0',
  rnbwAfterUnstake: '0',
};

export const useRnbwStakingPositionPnl = createDerivedStore<StakingPositionPnl>(
  $ => {
    const data = $(useStakingPositionStore, state => state.getData());

    if (!data || data?.stakedRnbw === '0') return EMPTY_VALUE;

    const { stakedRnbw, sessionPnl, decimals, exitFeePercentage } = data;

    const exchangeRateGain = sessionPnl?.exchangeRateGain ?? '0';
    const exitFee = mulWorklet(stakedRnbw, exitFeePercentage / 100);
    const exitFeeOffsetRatio = toFixedWorklet(divWorklet(exchangeRateGain, exitFee), 4);

    const netPnl = subWorklet(exchangeRateGain, exitFee);
    const isPositivePnl = isPositive(netPnl);
    const netPnlFormatted = formatNumber(toFixedWorklet(convertRawAmountToDecimalFormatWorklet(netPnl, decimals), 4));

    return {
      exitFeeOffsetRatio,
      exitFeeOffsetRatioDisplay: isZero(exitFeeOffsetRatio) ? '0%' : `${toPercentageWorklet(exitFeeOffsetRatio, 0.001)}%`,
      netPnl: isPositivePnl ? `+${netPnlFormatted}` : netPnlFormatted,
      earningsRequiredToBreakEven: formatNumber(convertRawAmountToDecimalFormatWorklet(subWorklet(exitFee, exchangeRateGain), decimals)),
      rnbwAfterUnstake: formatNumber(convertRawAmountToDecimalFormatWorklet(subWorklet(stakedRnbw, exitFee), decimals)),
      isPositivePnl,
    };
  },
  { equalityFn: shallowEqual, lockDependencies: true }
);
