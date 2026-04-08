import { divWorklet, isPositive, mulWorklet, subWorklet, toFixedWorklet, toPercentageWorklet } from '@/framework/core/safeMath';
import { convertRawAmountToDecimalFormatWorklet, formatNumber, isZero } from '@/helpers/utilities';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { shallowEqual } from '@/worklets/comparisons';
import { useStakingPositionStore } from '../rnbwStakingPositionStore';

type StakingPositionPnl = {
  exitFeeOffsetRatio: string;
  exitFeeOffsetRatioDisplay: string;
  netPnl: string;
  isPositivePnl: boolean;
  earnedFromExitFees: string;
  earningsRequiredToBreakEven: string;
  rnbwAfterUnstake: string;
};

const EMPTY_VALUE: StakingPositionPnl = {
  exitFeeOffsetRatio: '0',
  exitFeeOffsetRatioDisplay: '0%',
  netPnl: '0',
  isPositivePnl: false,
  earnedFromExitFees: '0',
  earningsRequiredToBreakEven: '0',
  rnbwAfterUnstake: '0',
};

export const useRnbwStakingPositionPnl = createDerivedStore<StakingPositionPnl>(
  $ => {
    const data = $(useStakingPositionStore, state => state.getData());
    const exitFeePercentage = $(useStakingPositionStore, state => state.getExitFeePercentage());

    if (!data || data?.stakedRnbw === '0') return EMPTY_VALUE;

    const { stakedRnbw, sessionPnl, decimals } = data;

    const exchangeRateGain = sessionPnl?.exchangeRateGain ?? '0';
    const exitFee = mulWorklet(stakedRnbw, exitFeePercentage / 100);
    const exitFeeOffsetRatio = toFixedWorklet(divWorklet(exchangeRateGain, exitFee), 4);

    const netPnl = subWorklet(exchangeRateGain, exitFee);
    const isPositivePnl = isPositive(netPnl);
    const netPnlFormatted = toFixedWorklet(convertRawAmountToDecimalFormatWorklet(netPnl, decimals), 4);

    return {
      exitFeeOffsetRatio,
      exitFeeOffsetRatioDisplay: isZero(exitFeeOffsetRatio) ? '0%' : `${toPercentageWorklet(exitFeeOffsetRatio, 0.001)}%`,
      netPnl: isPositivePnl ? `+${netPnlFormatted}` : netPnlFormatted,
      earnedFromExitFees: formatNumber(convertRawAmountToDecimalFormatWorklet(exchangeRateGain, decimals)),
      earningsRequiredToBreakEven: formatNumber(convertRawAmountToDecimalFormatWorklet(subWorklet(exitFee, exchangeRateGain), decimals)),
      rnbwAfterUnstake: formatNumber(convertRawAmountToDecimalFormatWorklet(subWorklet(stakedRnbw, exitFee), decimals)),
      isPositivePnl,
    };
  },
  { equalityFn: shallowEqual, fastMode: true }
);
