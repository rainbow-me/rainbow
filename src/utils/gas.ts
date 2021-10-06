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

const GAS_CONFIDENCE: { [key: number]: string } = {
  80: SLOW,
  90: NORMAL,
  95: FAST,
  99: URGENT,
};

const GAS_ICONS = {
  [CUSTOM]: 'gear',
  [FAST]: 'bolt',
  [NORMAL]: 'clock',
  [URGENT]: 'clock',
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
  GAS_CONFIDENCE,
  GAS_ICONS,
  GAS_PRICE_SOURCES,
  GAS_TRENDS,
  GasSpeedOrder,
  NORMAL,
  SLOW,
  URGENT,
};
