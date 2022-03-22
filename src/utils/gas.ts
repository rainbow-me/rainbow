import { colors } from '@rainbow-me/styles';

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

const GAS_TRENDS = {
  [FALLING]: { color: colors.green, label: '􀄱 Falling' },
  [NO_TREND]: { color: colors.appleBlue, label: '' },
  [RISING]: { color: colors.orange, label: '􀰾 Rising' },
  [STABLE]: { color: colors.yellowFavorite, label: '􀆮 Stable' },
  [SURGING]: { color: colors.red, label: '􀇿 Surging' },
};

const FLASHBOTS_MIN_TIP = 5;

export default {
  CUSTOM,
  FAST,
  FLASHBOTS_MIN_TIP,
  GAS_ICONS,
  GAS_TRENDS,
  GasSpeedOrder,
  GasTrends,
  NORMAL,
  SLOW,
  URGENT,
};
