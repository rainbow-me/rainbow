import { GasSpeedOption } from '@rainbow-me/entities';

const GAS_PRICE_SOURCES = {
  ARBITRUM_NODE: 'arbitrumNode',
  ETH_GAS_STATION: 'ethGasStation',
  ETHERSCAN: 'etherscan',
  MATIC_GAS_STATION: 'maticGasStation',
  OPTIMISM_NODE: 'optimismNode',
};

const GasSpeedOrder = [
  GasSpeedOption.SLOW,
  GasSpeedOption.NORMAL,
  GasSpeedOption.FAST,
  GasSpeedOption.CUSTOM,
];

export default {
  GAS_PRICE_SOURCES,
  GasSpeedOrder,
};
