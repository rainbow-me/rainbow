import {
  divWorklet,
  greaterThanWorklet,
  isPositive,
  mulWorklet,
  subWorklet,
  toFixedWorklet,
  toPercentageWorklet,
} from '@/framework/core/safeMath';
import { convertRawAmountToDecimalFormatWorklet, formatNumber } from '@/helpers/utilities';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { shallowEqual } from '@/worklets/comparisons';
import { useStakingPositionStore } from '../rnbwStakingPositionStore';
import { UNSTAKE_PENALTY_PERCENTAGE } from '@/features/rnbw-staking/constants';

type StakingPositionPnl = {
  exitFeeOffsetRatio: string;
  netPnl: string;
  isPositivePnl: boolean;
  earnedFromExitFees: string;
  earningsRequiredToBreakEven: string;
};

const EMPTY_VALUE: StakingPositionPnl = {
  exitFeeOffsetRatio: '0%',
  netPnl: '0',
  isPositivePnl: false,
  earnedFromExitFees: '0',
  earningsRequiredToBreakEven: '0',
};

export const useRnbwStakingPositionPnl = createDerivedStore<StakingPositionPnl>(
  $ => {
    const data = $(useStakingPositionStore, state => state.getData());

    if (!data || data?.stakedRnbw === '0') return EMPTY_VALUE;

    const { stakedRnbw, sessionPnl, decimals } = data;

    const exchangeRateGain = sessionPnl?.exchangeRateGain ?? '0';
    const exitFee = mulWorklet(stakedRnbw, UNSTAKE_PENALTY_PERCENTAGE / 100);
    const exitFeeOffsetRatio = toFixedWorklet(divWorklet(exchangeRateGain, exitFee), 4);
    const exitFeeOffsetRatioFormatted = !greaterThanWorklet(exitFeeOffsetRatio, '0')
      ? '0%'
      : `${toPercentageWorklet(exitFeeOffsetRatio, 0.001)}%`;

    const netPnl = subWorklet(exchangeRateGain, exitFee);
    const isPositivePnl = isPositive(netPnl);
    const netPnlFormatted = toFixedWorklet(convertRawAmountToDecimalFormatWorklet(netPnl, decimals), 4);

    return {
      exitFeeOffsetRatio: exitFeeOffsetRatioFormatted,
      netPnl: isPositivePnl ? `+${netPnlFormatted}` : netPnlFormatted,
      earnedFromExitFees: formatNumber(convertRawAmountToDecimalFormatWorklet(exchangeRateGain, decimals)),
      earningsRequiredToBreakEven: formatNumber(convertRawAmountToDecimalFormatWorklet(subWorklet(exitFee, exchangeRateGain), decimals)),
      isPositivePnl,
    };
  },
  { equalityFn: shallowEqual, fastMode: true }
);
