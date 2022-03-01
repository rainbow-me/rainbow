import { EthereumAddress, RainbowToken } from '@rainbow-me/entities';

const cache: Record<string, Record<EthereumAddress, RainbowToken>> = {};

const UniswapAssetsCache = {
  cache,
};

export default UniswapAssetsCache;
