import type { RainbowToken } from '@/entities/tokens';
import type { EthereumAddress } from '@/entities/wallet';

const cache: Record<string, Record<EthereumAddress, RainbowToken>> = {};

const UniswapAssetsCache = {
  cache,
};

export default UniswapAssetsCache;
