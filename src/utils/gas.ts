import { colors } from '@rainbow-me/styles';

const CUSTOM = 'custom';
const URGENT = 'urgent';
const FAST = 'fast';
const NORMAL = 'normal';
const SLOW = 'slow';
const SLOWER = 'slower';

const GasSpeedOrder = [NORMAL, FAST, URGENT, CUSTOM];

const GAS_PRICE_SOURCES = {
  ARBITRUM_NODE: 'arbitrumNode',
  ETH_GAS_STATION: 'ethGasStation',
  ETHERSCAN: 'etherscan',
  OPTIMISM_NODE: 'optimismNode',
  POLYGON_GAS_STATION: 'polygonGasStation',
};

const GAS_CONFIDENCE: { [key: number]: string } = {
  70: SLOWER,
  80: SLOW,
  90: NORMAL,
  95: FAST,
  99: URGENT,
};

const GAS_ICONS = {
  [CUSTOM]: 'gear',
  [FAST]: 'rocket',
  [NORMAL]: 'stopwatch',
  [URGENT]: 'policeCarLight',
};

const getTrendKey = (trend: number) => {
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
  getTrendKey,
  NORMAL,
  SLOW,
  URGENT,
};
