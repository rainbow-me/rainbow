import path from 'path';
import { keyBy, memoize } from 'lodash';
import RNFS from 'react-native-fs';
import RAINBOW_TOKEN_LIST_DATA from './rainbow-token-list.json';
import { RainbowToken } from '@rainbow-me/entities';

memoize.Cache = WeakMap;

const RB_TOKEN_LIST_CACHE = 'rb-token-list.json';

const ethWithAddress: RainbowToken = {
  address: 'eth',
  decimals: 18,
  isRainbowCurated: true,
  isVerified: true,
  name: 'Ethereum',
  symbol: 'ETH',
  uniqueId: 'eth',
};

type TokenListData = typeof RAINBOW_TOKEN_LIST_DATA;

class RainbowTokenList {
  #tokenListData = RAINBOW_TOKEN_LIST_DATA;

  constructor() {
    // Load in the cached list maybe.
    this.#readCachedData()
      .then(data => {
        const bundledDate = new Date(this.tokenListData?.timestamp);
        const cachedDate = new Date(this.tokenListData?.timestamp);

        if (cachedDate > bundledDate) this.tokenListData = data;
      })
      .catch((/* err */) => {
        // Log it somehow?
      });
  }

  get tokenListData() {
    return this.#tokenListData;
  }

  set tokenListData(val) {
    this.#tokenListData = val;
  }

  async #readCachedData() {
    const data = await RNFS.readFile(
      path.join(RNFS.CachesDirectoryPath, RB_TOKEN_LIST_CACHE),
      'utf8'
    );

    return JSON.parse(data);
  }

  #generateTokenList = memoize(
    (tokenListData: TokenListData): RainbowToken[] => {
      return tokenListData.tokens.map(token => {
        const {
          address: rawAddress,
          decimals,
          name,
          symbol,
          extensions,
        } = token;
        const address = rawAddress.toLowerCase();
        return {
          address,
          decimals,
          name,
          symbol,
          uniqueId: address,
          ...extensions,
        };
      });
    }
  );

  get #tokenList() {
    return this.#generateTokenList(this.tokenListData);
  }

  #generateTokenListWithEth = memoize(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (tokenListData: TokenListData): RainbowToken[] => {
      return [ethWithAddress, ...this.#tokenList];
    }
  );

  get #tokenListWithEth() {
    return this.#generateTokenListWithEth(this.tokenListData);
  }

  #generateRainbowTokenList = memoize(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (tokenListData: TokenListData): Record<string, RainbowToken> => {
      return keyBy(this.#tokenListWithEth, 'address');
    }
  );

  get RAINBOW_TOKEN_LIST() {
    return this.#generateRainbowTokenList(this.tokenListData);
  }

  #generateCuratedRainbowTokenList = memoize(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (tokenListData: TokenListData): RainbowToken[] => {
      return this.#tokenListWithEth.filter(t => t.isRainbowCurated);
    }
  );

  get #curatedRainbowTokenList() {
    return this.#generateCuratedRainbowTokenList(this.tokenListData);
  }

  #generateTokenSafeList = memoize(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (tokenListData: TokenListData): Record<string, string> => {
      return keyBy(
        this.#curatedRainbowTokenList.flatMap(({ name, symbol }) => [
          name,
          symbol,
        ]),
        id => id.toLowerCase()
      );
    }
  );

  get TOKEN_SAFE_LIST() {
    return this.#generateTokenSafeList(this.tokenListData);
  }

  #generateCuratedTokens = memoize(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (tokenListData: TokenListData): Record<string, RainbowToken> => {
      return keyBy(this.#curatedRainbowTokenList, 'address');
    }
  );

  get CURATED_TOKENS() {
    return this.#generateCuratedTokens(this.tokenListData);
  }
}

export const rainbowTokenList = new RainbowTokenList();
