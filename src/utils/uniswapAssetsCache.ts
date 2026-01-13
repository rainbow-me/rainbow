import type { EthereumAddress } from '@/entities/wallet';
import type { RainbowToken } from '@/entities/tokens';

const cache: Record<string, Record<EthereumAddress, RainbowToken>> = {};

const UniswapAssetsCache = {
  cache,
};

export default UniswapAssetsCache;
