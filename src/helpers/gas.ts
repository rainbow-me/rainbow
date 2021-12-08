const PRIORITY_FEE_INCREMENT = 1;
const PRIORITY_FEE_THRESHOLD = 0.15;

export const getTrendKey = (trend: number) => {
  if (trend === -1) {
    return 'falling';
  } else if (trend === 1) {
    return 'rising';
  } else if (trend === 2) {
    return 'surging';
  } else {
    return 'stable';
  }
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
