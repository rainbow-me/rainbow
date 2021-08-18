const CUSTOM = 'custom';
const FAST = 'fast';
const NORMAL = 'normal';
const SLOW = 'slow';

const GasSpeedOrder = [SLOW, NORMAL, FAST, CUSTOM];

const GAS_PRICE_SOURCES = {
  ARBITRUM_NODE: 'arbitrumNode',
  ETH_GAS_STATION: 'ethGasStation',
  ETHERSCAN: 'etherscan',
  MATIC_GAS_STATION: 'maticGasStation',
  OPTIMISM_NODE: 'optimismNode',
};

export default {
  CUSTOM,
  FAST,
  GAS_PRICE_SOURCES,
  GasSpeedOrder,
  NORMAL,
  SLOW,
};
