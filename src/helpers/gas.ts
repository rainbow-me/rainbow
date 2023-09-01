import { Network } from '@/networks/types';
import { memoFn } from '../utils/memoFn';
import { gasUtils } from '@/utils';
import { getNetworkObj } from '@/networks';

const { GasTrends } = gasUtils;
const { FALLING, NO_TREND, RISING, STABLE, SURGING } = GasTrends;

const PRIORITY_FEE_INCREMENT = 1;
const PRIORITY_FEE_L2_INCREMENT = 0.01;

const PRIORITY_FEE_THRESHOLD = 0.15;
const PRIORITY_FEE_L2_THRESHOLD = 0.01;

export const getTrendKey = memoFn((trend: number) => {
  if (trend === -1) {
    return FALLING;
  } else if (trend === 1) {
    return RISING;
  } else if (trend === 2) {
    return SURGING;
  } else if (trend === 0) {
    return STABLE;
  }
  return NO_TREND;
});

export const calculateMinerTipAddDifference = memoFn(
  (maxPriorityFee: string, txNetwork: Network) => {
    const networkObject = getNetworkObj(txNetwork);
    const isL2 = networkObject.networkType === 'layer2';
    const FEE_INCREMENT = isL2
      ? PRIORITY_FEE_L2_INCREMENT
      : PRIORITY_FEE_INCREMENT;
    const FEE_THRESHOLD = isL2
      ? PRIORITY_FEE_L2_THRESHOLD
      : PRIORITY_FEE_THRESHOLD;
    const diff =
      Math.round((Number(maxPriorityFee) % FEE_INCREMENT) * 100) / 100;
    if (diff > FEE_INCREMENT - FEE_THRESHOLD) {
      return 2 * FEE_INCREMENT - diff;
    } else {
      return FEE_INCREMENT - diff;
    }
  }
);

export const calculateMinerTipSubstDifference = memoFn(
  (maxPriorityFee: string, txNetwork: Network) => {
    const networkObject = getNetworkObj(txNetwork);
    const isL2 = networkObject.networkType === 'layer2';
    const FEE_INCREMENT = isL2
      ? PRIORITY_FEE_L2_INCREMENT
      : PRIORITY_FEE_INCREMENT;
    const FEE_THRESHOLD = isL2
      ? PRIORITY_FEE_L2_THRESHOLD
      : PRIORITY_FEE_THRESHOLD;
    const diff =
      Math.round((Number(maxPriorityFee) % FEE_INCREMENT) * 100) / 100;
    if (diff < FEE_THRESHOLD) {
      return FEE_INCREMENT + diff;
    } else {
      return diff || FEE_INCREMENT;
    }
  }
);
