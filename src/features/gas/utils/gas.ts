import { Platform } from 'react-native';

import { type TextColor } from '@/design-system/color/palettes';
import type { NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import { convertAmountToNativeDisplay } from '@/helpers/utilities';
import * as i18n from '@/languages';
import { colors } from '@/styles';

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

const GAS_ICONS: {
  [key in (typeof GasSpeedOrder)[number]]: string;
} = {
  [CUSTOM]: 'gear',
  [FAST]: 'rocket',
  [NORMAL]: 'stopwatch',
  [URGENT]: 'policeCarLight',
};

interface SwapGasIcons {
  [key: string]: { color: TextColor; icon: string; symbolName: string };
}

const SWAP_GAS_ICONS: SwapGasIcons = {
  [CUSTOM]: {
    color: 'labelSecondary',
    icon: '􀣌',
    symbolName: 'gearshape',
  },
  [FAST]: {
    color: 'red',
    icon: '􀙭',
    symbolName: 'flame',
  },
  [NORMAL]: {
    color: 'blue',
    icon: '􀐫',
    symbolName: 'clock',
  },
  [URGENT]: {
    color: 'yellow',
    icon: '􀋦',
    symbolName: 'bolt',
  },
};

const GAS_EMOJIS: {
  [key in (typeof GasSpeedOrder)[number]]: string;
} = {
  [CUSTOM]: '⚙️',
  [FAST]: '🚀',
  [NORMAL]: Platform.OS === 'ios' ? '⏱' : '🕘',
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

const getGasFallback = (nativeCurrency: NativeCurrencyKey) => {
  const fallbackPrice = '0.01';
  return convertAmountToNativeDisplay(fallbackPrice, nativeCurrency);
};

export default {
  CUSTOM,
  FAST,
  getGasLabel,
  getGasFallback,
  GAS_EMOJIS,
  GAS_ICONS,
  GAS_TRENDS,
  GasSpeedOrder,
  GasTrends,
  NORMAL,
  SLOW,
  SWAP_GAS_ICONS,
  URGENT,
};
