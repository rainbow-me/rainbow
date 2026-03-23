import {
  convertAmountToNativeDisplayWorklet,
  convertRawAmountToDecimalFormat,
  divide,
  isPositive,
  multiply,
  truncateToDecimalsWithThreshold,
} from '@/helpers/utilities';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { shallowEqual } from '@/worklets/comparisons';
import { useStakingPositionStore } from '../rnbwStakingPositionStore';
import { UNSTAKE_PENALTY_PERCENTAGE } from '@/features/rnbw-staking/constants';
import { subWorklet, toPercentageWorklet } from '@/framework/core/safeMath';

type StakingBalance = {
  tokenAmount: string;
  nativeCurrencyAmount: string;
  hasStakedPosition: boolean;
  percentageOfExitFeeRecovered: string;
  stakeSessionPnl: string;
  isPositiveStakeSessionPnl: boolean;
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

    const exchangeRateGain = data?.sessionPnl?.exchangeRateGain ?? '0';
    const exitFee = multiply(rawStakedRnbw, UNSTAKE_PENALTY_PERCENTAGE / 100);
    const percentageOfExitFeeRecovered = isZero ? 0 : Number(divide(exchangeRateGain, exitFee));
    const percentageOfExitFeeRecoveredFormatted =
      percentageOfExitFeeRecovered === 0 ? '0%' : `${toPercentageWorklet(percentageOfExitFeeRecovered.toFixed(2), 0.001)}%`;

    const stakeSessionPnl = subWorklet(exchangeRateGain, exitFee);
    const isPositiveStakeSessionPnl = isPositive(stakeSessionPnl);
    const stakeSessionPnlFormatted = truncateToDecimalsWithThreshold({
      value: convertRawAmountToDecimalFormat(stakeSessionPnl, decimals),
      decimals: 2,
      threshold: '0.01',
    });

    return {
      tokenAmount: isZero ? '0' : formattedTokenAmount,
      nativeCurrencyAmount: convertAmountToNativeDisplayWorklet(stakedValueInCurrency, currency, !isZero),
      hasStakedPosition: !isZero,
      percentageOfExitFeeRecovered: percentageOfExitFeeRecoveredFormatted,
      stakeSessionPnl: isPositiveStakeSessionPnl ? `+${stakeSessionPnlFormatted}` : `-${stakeSessionPnlFormatted}`,
      isPositiveStakeSessionPnl,
    };
  },
  { equalityFn: shallowEqual, fastMode: true }
);
