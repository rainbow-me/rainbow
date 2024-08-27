import { EventEmitter } from 'events';
import { keyBy } from 'lodash';
import { MMKV } from 'react-native-mmkv';
import { ETH_ADDRESS } from '../index';
import RAINBOW_TOKEN_LIST_DATA from './rainbow-token-list.json';
import { RainbowToken } from '@/entities';
import { STORAGE_IDS } from '@/model/mmkv';
import { logger, RainbowError } from '@/logger';
import { Network } from '@/networks/types';
import { ChainId } from '@/__swaps__/types/chains';

export const rainbowListStorage = new MMKV({
  id: STORAGE_IDS.RAINBOW_TOKEN_LIST,
});

export const RB_TOKEN_LIST_CACHE = 'lrb-token-list';
export const RB_TOKEN_LIST_ETAG = 'lrb-token-list-etag';

type TokenListData = typeof RAINBOW_TOKEN_LIST_DATA;

const ethWithAddress: RainbowToken = {
  address: ETH_ADDRESS,
  decimals: 18,
  isRainbowCurated: true,
  isVerified: true,
  name: 'Ethereum',
  symbol: 'ETH',
  chainId: ChainId.mainnet,
  network: Network.mainnet,
  uniqueId: 'eth',
};

/**
 * generateDerivedData generates derived data lists from RAINBOW_TOKEN_LIST_DATA.
 */
function generateDerivedData(tokenListData: TokenListData) {
  const tokenList: RainbowToken[] = tokenListData.tokens.map(token => {
    const { address: rawAddress, decimals, name, symbol, extensions } = token;
    const address = rawAddress.toLowerCase();
    return {
      address,
      decimals,
      name,
      symbol,
      network: Network.mainnet,
      chainId: ChainId.mainnet,
      uniqueId: address,
      ...extensions,
    };
  });

  const tokenListWithEth = [ethWithAddress, ...tokenList];
  const curatedRainbowTokenList = tokenListWithEth.filter(t => t.isRainbowCurated);

  const derivedData: {
    RAINBOW_TOKEN_LIST: Record<string, RainbowToken>;
    CURATED_TOKENS: Record<string, RainbowToken>;
    TOKEN_SAFE_LIST: Record<string, string>;
  } = {
    CURATED_TOKENS: keyBy(curatedRainbowTokenList, 'address'),
    RAINBOW_TOKEN_LIST: keyBy(tokenListWithEth, 'address'),
    TOKEN_SAFE_LIST: keyBy(
      curatedRainbowTokenList.flatMap(({ name, symbol }) => [name, symbol]),
      id => id.toLowerCase()
    ),
  };

  return derivedData;
}

function readJson<T>(key: string): T | null {
  try {
    const data = rainbowListStorage.getString(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  } catch (error) {
    logger.error(new RainbowError(`[rainbow-token-list]: Error parsing token-list-cache data: ${error}`));
    return null;
  }
}

function writeJson<T>(key: string, data: T) {
  try {
    rainbowListStorage.set(key, JSON.stringify(data));
  } catch (error) {
    logger.error(new RainbowError(`[rainbow-token-list]: Error saving ${key}: ${error}`));
  }
}

class RainbowTokenList extends EventEmitter {
  #tokenListDataStorage = RAINBOW_TOKEN_LIST_DATA;
  #derivedData = generateDerivedData(RAINBOW_TOKEN_LIST_DATA);

  constructor() {
    super();

    const cachedData = readJson<TokenListData>(RB_TOKEN_LIST_CACHE);

    if (cachedData?.timestamp) {
      const bundledDate = new Date(this._tokenListData?.timestamp);
      const cachedDate = new Date(cachedData?.timestamp);

      if (cachedDate > bundledDate) {
        this._tokenListData = cachedData;
      }
    }

    logger.debug('[rainbow-token-list]: Token list initialized');
  }

  // Wrapping #tokenListDataStorage so we can add events around updates.
  get _tokenListData() {
    return this.#tokenListDataStorage;
  }

  set _tokenListData(val) {
    this.#tokenListDataStorage = val;
    this.#derivedData = generateDerivedData(RAINBOW_TOKEN_LIST_DATA);
    this.emit('update');
    logger.debug('[rainbow-token-list]: Token list data replaced');
  }

  get CURATED_TOKENS() {
    return this.#derivedData.CURATED_TOKENS;
  }

  get RAINBOW_TOKEN_LIST() {
    return this.#derivedData.RAINBOW_TOKEN_LIST;
  }

  get TOKEN_SAFE_LIST() {
    return this.#derivedData.TOKEN_SAFE_LIST;
  }
}

export const rainbowTokenList = new RainbowTokenList();
