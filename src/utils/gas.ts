import { colors } from '@/styles';
import { memoFn } from '@/utils/memoFn';

const CUSTOM = 'custom';
const URGENT = 'urgent';
const FAST = 'fast';
const NORMAL = 'normal';
const SLOW = 'slow';

const SURGING = 'surging';
const RISING = 'rising';
const STABLE = 'stable';
const FALLING = 'falling';
const NO_TREND = 'notrend';

const GasSpeedOrder = [NORMAL, FAST, URGENT, CUSTOM];
const GasTrends = { FALLING, NO_TREND, RISING, STABLE, SURGING };

const GAS_ICONS = {
  [CUSTOM]: 'gear',
  [FAST]: 'rocket',
  [NORMAL]: 'stopwatch',
  [URGENT]: 'policeCarLight',
};

const GAS_EMOJIS = {
  [CUSTOM]: '⚙️',
  [FAST]: '🚀',
  [NORMAL]: ios ? '⏱' : '🕘',
  [URGENT]: '🚨',
};

const GAS_TRENDS = {
  [FALLING]: { color: colors.green, label: '􀄱 Falling' },
  [NO_TREND]: { color: colors.appleBlue, label: '' },
  [RISING]: { color: colors.orange, label: '􀰾 Rising' },
  [STABLE]: { color: colors.yellowFavorite, label: '􀆮 Stable' },
  [SURGING]: { color: colors.red, label: '􀇿 Surging' },
};

const FLASHBOTS_MIN_TIP = 6;

const PRIORITY_FEE_INCREMENT = 1;

const PRIORITY_FEE_THRESHOLD = 0.15;

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
  (maxPriorityFee: string) => {
    const diff =
      Math.round((Number(maxPriorityFee) % PRIORITY_FEE_INCREMENT) * 100) / 100;
    if (diff > PRIORITY_FEE_INCREMENT - PRIORITY_FEE_THRESHOLD) {
      return 2 * PRIORITY_FEE_INCREMENT - diff;
    } else {
      return PRIORITY_FEE_INCREMENT - diff;
    }
  }
);

export const calculateMinerTipSubstDifference = memoFn(
  (maxPriorityFee: string) => {
    const diff =
      Math.round((Number(maxPriorityFee) % PRIORITY_FEE_INCREMENT) * 100) / 100;
    if (diff < PRIORITY_FEE_THRESHOLD) {
      return PRIORITY_FEE_INCREMENT + diff;
    } else {
      return diff || PRIORITY_FEE_INCREMENT;
    }
  }
);

export default {
  CUSTOM,
  FAST,
  FLASHBOTS_MIN_TIP,
  GAS_EMOJIS,
  GAS_ICONS,
  GAS_TRENDS,
  GasSpeedOrder,
  GasTrends,
  NORMAL,
  SLOW,
  URGENT,
};
