import { gasUtils } from '@rainbow-me/utils';

const { GasTrends } = gasUtils;
const { FALLING, RISING, SURGING, STABLE, NO_TREND } = GasTrends;

const PRIORITY_FEE_INCREMENT = 0.5;
const PRIORITY_FEE_THRESHOLD = 0.15;

export const getTrendKey = (trend: number) => {
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
};

export const calculateMinerTipAddDifference = (maxPriorityFee: string) => {
  const diff =
    Math.round((Number(maxPriorityFee) % PRIORITY_FEE_INCREMENT) * 100) / 100;
  if (diff > PRIORITY_FEE_INCREMENT - PRIORITY_FEE_THRESHOLD) {
    return 2 * PRIORITY_FEE_INCREMENT - diff;
  } else {
    return PRIORITY_FEE_INCREMENT - diff;
  }
};

export const calculateMinerTipSubstDifference = (maxPriorityFee: string) => {
  const diff =
    Math.round((Number(maxPriorityFee) % PRIORITY_FEE_INCREMENT) * 100) / 100;
  if (diff < PRIORITY_FEE_THRESHOLD) {
    return PRIORITY_FEE_INCREMENT + diff;
  } else {
    return diff || PRIORITY_FEE_INCREMENT;
  }
};
