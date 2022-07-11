import { EventEmitter } from 'events';
import { captureException } from '@sentry/react-native';
import { keyBy } from 'lodash';
// @ts-ignore
import { RAINBOW_LEAN_TOKEN_LIST_URL } from 'react-native-dotenv';
import { MMKV } from 'react-native-mmkv';
import { rainbowFetch } from '../../rainbow-fetch';
import { ETH_ADDRESS } from '../index';
import RAINBOW_TOKEN_LIST_DATA from './rainbow-token-list.json';
import { RainbowToken } from '@rainbow-me/entities';
import { STORAGE_IDS } from '@rainbow-me/model/mmkv';
import logger from 'logger';

export const rainbowListStorage = new MMKV({
  id: STORAGE_IDS.RAINBOW_TOKEN_LIST,
});

export const RB_TOKEN_LIST_CACHE = 'lrb-token-list';
export const RB_TOKEN_LIST_ETAG = 'lrb-token-list-etag';

type TokenListData = typeof RAINBOW_TOKEN_LIST_DATA;
type ETagData = { etag: string | null };

const ethWithAddress: RainbowToken = {
  address: ETH_ADDRESS,
  decimals: 18,
  isRainbowCurated: true,
  isVerified: true,
  name: 'Ethereum',
  symbol: 'ETH',
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
      uniqueId: address,
      ...extensions,
    };
  });

  const tokenListWithEth = [ethWithAddress, ...tokenList];
  const curatedRainbowTokenList = tokenListWithEth.filter(
    t => t.isRainbowCurated
  );

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
    logger.sentry('Error parsing token-list-cache data');
    logger.error(error);
    captureException(error);

    return null;
  }
}

function writeJson<T>(key: string, data: T) {
  try {
    rainbowListStorage.set(key, JSON.stringify(data));
  } catch (error) {
    logger.sentry(`Token List: Error saving ${key}`);
    logger.error(error);
    captureException(error);
  }
}

async function getTokenListUpdate(
  currentTokenListData: TokenListData
): Promise<{
  newTokenList?: TokenListData;
  status?: Response['status'];
}> {
  const etagData = readJson<ETagData>(RB_TOKEN_LIST_ETAG);
  const etag = etagData?.etag;
  const commonHeaders = {
    Accept: 'application/json',
  };

  try {
    const { data, status, headers } = await rainbowFetch(
      RAINBOW_LEAN_TOKEN_LIST_URL,
      {
        headers: etag
          ? { ...commonHeaders, 'If-None-Match': etag }
          : { ...commonHeaders },
        method: 'get',
      }
    );
    const currentDate = new Date(currentTokenListData?.timestamp);
    const freshDate = new Date((data as TokenListData)?.timestamp);

    if (freshDate > currentDate) {
      writeJson<TokenListData>(RB_TOKEN_LIST_CACHE, data as TokenListData);

      if ((headers as Headers).get('etag')) {
        writeJson<ETagData>(RB_TOKEN_LIST_ETAG, {
          etag: (headers as Headers).get('etag'),
        });
      }

      return { newTokenList: data as TokenListData, status };
    } else {
      return { newTokenList: undefined, status };
    }
  } catch (error) {
    // @ts-ignore
    if (error?.response?.status !== 304) {
      // Log errors that are not 304 no change errors
      logger.sentry('Error fetching token list');
      logger.error(error);
      captureException(error);
    }
    return {
      newTokenList: undefined,
      // @ts-ignore
      status: error?.response?.status,
    };
  }
}

class RainbowTokenList extends EventEmitter {
  #tokenListDataStorage = RAINBOW_TOKEN_LIST_DATA;
  #derivedData = generateDerivedData(RAINBOW_TOKEN_LIST_DATA);
  #updateJob: Promise<void> | null = null;

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

    logger.debug('Token list initialized');
  }

  // Wrapping #tokenListDataStorage so we can add events around updates.
  get _tokenListData() {
    return this.#tokenListDataStorage;
  }

  set _tokenListData(val) {
    this.#tokenListDataStorage = val;
    this.#derivedData = generateDerivedData(RAINBOW_TOKEN_LIST_DATA);
    this.emit('update');
    logger.debug('Token list data replaced');
  }

  update() {
    // deduplicate calls to update.
    if (!this.#updateJob) {
      this.#updateJob = this._updateJob();
    }

    return this.#updateJob;
  }

  async _updateJob(): Promise<void> {
    try {
      logger.debug('Token list checking for update');
      const { newTokenList, status } = await getTokenListUpdate(
        this._tokenListData
      );

      newTokenList
        ? logger.debug(
            `Token list update: new update loaded, generated on ${newTokenList?.timestamp}`
          )
        : status === 304
        ? logger.debug(
            `Token list update: no change since last update, skipping update.`
          )
        : logger.debug(
            `Token list update: Token list did not update. (Status: ${status}, CurrentListDate: ${this._tokenListData?.timestamp})`
          );

      if (newTokenList) {
        this._tokenListData = newTokenList;
      }
    } catch (error) {
      logger.sentry(`Token list update error: ${(error as Error).message}`);
      logger.error(error);
      captureException(error);
    } finally {
      this.#updateJob = null;
      logger.debug('Token list completed update check.');
    }
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
