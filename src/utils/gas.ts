import { colors } from '@rainbow-me/styles';

const CUSTOM = 'custom';
const URGENT = 'urgent';
const FAST = 'fast';
const NORMAL = 'normal';
const SLOW = 'slow';

const GasSpeedOrder = [NORMAL, FAST, URGENT, CUSTOM];

const GAS_ICONS = {
  [CUSTOM]: 'gear',
  [FAST]: 'rocket',
  [NORMAL]: 'stopwatch',
  [URGENT]: 'policeCarLight',
};

const GAS_TRENDS = {
  falling: { color: colors.green, label: '􀄱 Falling' },
  rising: { color: colors.orange, label: '􀰾 Rising' },
  stable: { color: colors.yellowFavorite, label: '􀆮 Stable' },
  surging: { color: colors.red, label: '􀇿 Surging' },
};

export default {
  CUSTOM,
  FAST,
  GAS_ICONS,
  GAS_TRENDS,
  GasSpeedOrder,
  NORMAL,
  SLOW,
  URGENT,
};
