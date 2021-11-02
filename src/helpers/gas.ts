const PRIORITY_FEE_INCREMENT = 0.5;
const PRIORITY_FEE_THRESHOLD = 0.15;

export const getTrendKey = (trend: number) => {
  if (trend < -0.25) {
    return 'falling';
  } else if (trend >= -0.25 && trend <= 0.25) {
    return 'stable';
  } else if (trend > 0.25 && trend <= 0.6) {
    return 'rising';
  } else if (trend > 0.6) {
    return 'surging';
  }
};

export const calculateMinerTipAddDifference = (maxPriorityFee: number) => {
  const diff =
    Math.round((maxPriorityFee % PRIORITY_FEE_INCREMENT) * 100) / 100;
  if (diff > PRIORITY_FEE_INCREMENT - PRIORITY_FEE_THRESHOLD) {
    return 2 * PRIORITY_FEE_INCREMENT - diff;
  } else {
    return PRIORITY_FEE_INCREMENT - diff;
  }
};

export const calculateMinerTipSubstDifference = (maxPriorityFee: number) => {
  const diff =
    Math.round((maxPriorityFee % PRIORITY_FEE_INCREMENT) * 100) / 100;
  if (diff < PRIORITY_FEE_THRESHOLD) {
    return PRIORITY_FEE_INCREMENT + diff;
  } else {
    return diff || PRIORITY_FEE_INCREMENT;
  }
};
