import { colors } from '@/styles';
import * as i18n from '@/languages';

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

// i18n
const GAS_TRENDS = {
  [FALLING]: {
    color: colors.green,
    label: `􀄱 ${i18n.t(i18n.l.gas.card.falling)}`,
  },
  [NO_TREND]: { color: colors.appleBlue, label: '' },
  [RISING]: {
    color: colors.orange,
    label: `􀰾  ${i18n.t(i18n.l.gas.card.rising)}`,
  },
  [STABLE]: {
    color: colors.yellowFavorite,
    label: `􀆮  ${i18n.t(i18n.l.gas.card.stable)}`,
  },
  [SURGING]: {
    color: colors.red,
    label: `􀇿  ${i18n.t(i18n.l.gas.card.surging)}`,
  },
};

const getGasLabel = (speed: string) => {
  switch (speed) {
    case CUSTOM:
      return i18n.t(i18n.l.gas.speeds.custom);
    case URGENT:
      return i18n.t(i18n.l.gas.speeds.urgent);
    case FAST:
      return i18n.t(i18n.l.gas.speeds.fast);
    case SLOW:
      return i18n.t(i18n.l.gas.speeds.slow);
    default:
      return i18n.t(i18n.l.gas.speeds.normal);
  }
};

const FLASHBOTS_MIN_TIP = 6;

export default {
  CUSTOM,
  FAST,
  FLASHBOTS_MIN_TIP,
  getGasLabel,
  GAS_EMOJIS,
  GAS_ICONS,
  GAS_TRENDS,
  GasSpeedOrder,
  GasTrends,
  NORMAL,
  SLOW,
  URGENT,
};
