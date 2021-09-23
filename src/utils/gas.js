/* eslint-disable sort-keys */
import { colors } from '@rainbow-me/styles';

const CUSTOM = 'custom';
const URGENT = 'urgent';
const FAST = 'fast';
const NORMAL = 'normal';
const SLOW = 'slow';

const GasSpeedOrder = [NORMAL, FAST, URGENT, CUSTOM];

const GAS_PRICE_SOURCES = {
  ARBITRUM_NODE: 'arbitrumNode',
  ETH_GAS_STATION: 'ethGasStation',
  ETHERSCAN: 'etherscan',
  MATIC_GAS_STATION: 'maticGasStation',
  OPTIMISM_NODE: 'optimismNode',
};

const GAS_ICONS = {
  [NORMAL]: 'clock',
  [FAST]: 'bolt',
  [URGENT]: 'clock',
  [CUSTOM]: 'gear',
};

const GAS_TRENDS = {
  falling: { color: colors.green, label: '􀄱 Falling' },
  rising: { color: colors.orange, label: '􀰾 Rising' },
  stable: { color: colors.yellowOrange, label: '􀆮 Stable' },
  surging: { color: colors.red, label: '􀇿 Surging' },
};

export default {
  CUSTOM,
  FAST,
  GAS_ICONS,
  GAS_PRICE_SOURCES,
  GAS_TRENDS,
  GasSpeedOrder,
  NORMAL,
  SLOW,
  URGENT,
};
