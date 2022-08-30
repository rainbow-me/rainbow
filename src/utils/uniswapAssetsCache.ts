import { EthereumAddress, RainbowToken } from '@/entities';

const cache: Record<string, Record<EthereumAddress, RainbowToken>> = {};

const UniswapAssetsCache = {
  cache,
};

export default UniswapAssetsCache;
