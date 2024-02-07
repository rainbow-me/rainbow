import { Network } from '@/networks/types';

const RAINBOW_FEE_ADDRESS_MAINNET = '0x69d6d375de8c7ade7e44446df97f49e661fdad7d';
const RAINBOW_FEE_ADDRESS_POLYGON = '0xfb9af3db5e19c4165f413f53fe3bbe6226834548';
const RAINBOW_FEE_ADDRESS_OPTIMISM = '0x0d9b71891dc86400acc7ead08c80af301ccb3d71';
const RAINBOW_FEE_ADDRESS_ARBITRUM = '0x0f9259af03052c96afda88add62eb3b5cbc185f1';
const RAINBOW_FEE_ADDRESS_BASE = '0x1bbe055ad3204fa4468b4e6d3a3c59b9d9ac8c19';
const RAINBOW_FEE_ADDRESS_BSC = '0x9670271ec2e2937a2e9df536784344bbff2bbea6';
const RAINBOW_FEE_ADDRESS_ZORA = '0x7a3d05c70581bd345fe117c06e45f9669205384f';

export function getRainbowFeeAddress(network: Network) {
  switch (network) {
    case Network.mainnet:
      return RAINBOW_FEE_ADDRESS_MAINNET;
    case Network.polygon:
      return RAINBOW_FEE_ADDRESS_POLYGON;
    case Network.optimism:
      return RAINBOW_FEE_ADDRESS_OPTIMISM;
    case Network.arbitrum:
      return RAINBOW_FEE_ADDRESS_ARBITRUM;
    case Network.base:
      return RAINBOW_FEE_ADDRESS_BASE;
    case Network.bsc:
      return RAINBOW_FEE_ADDRESS_BSC;
    case Network.zora:
      return RAINBOW_FEE_ADDRESS_ZORA;
    default:
      return undefined;
  }
}
