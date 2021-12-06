import { EventEmitter } from 'events';
import path from 'path';
import { captureException } from '@sentry/react-native';
import { keyBy } from 'lodash';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { RAINBOW_TOKEN_LIST_URL } from 'react-native-dotenv';
import RNFS from 'react-native-fs';
import { rainbowFetch } from '../../rainbow-fetch';
import { ETH_ADDRESS } from '../index';
// @ts-expect-error ts-migrate(2732) FIXME: Cannot find module './rainbow-token-list.json'. Co... Remove this comment to see the full error message
import RAINBOW_TOKEN_LIST_DATA from './rainbow-token-list.json';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/entities' or its c... Remove this comment to see the full error message
import { RainbowToken } from '@rainbow-me/entities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

const RB_TOKEN_LIST_CACHE = 'rb-token-list.json';
const RB_TOKEN_LIST_ETAG = 'rb-token-list-etag.json';

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
  const tokenList: RainbowToken[] = tokenListData.tokens.map((token: any) => {
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

async function readRNFSJsonData<T>(filename: string): Promise<T | null> {
  try {
    const data = await RNFS.readFile(
      path.join(RNFS.CachesDirectoryPath, filename),
      'utf8'
    );

    return JSON.parse(data);
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      logger.sentry('Error parsing token-list-cache data');
      logger.error(error);
      captureException(error);
    }
    return null;
  }
}

async function writeRNFSJsonData<T>(filename: string, data: T) {
  try {
    await RNFS.writeFile(
      path.join(RNFS.CachesDirectoryPath, filename),
      JSON.stringify(data),
      'utf8'
    );
  } catch (error) {
    logger.sentry(`Token List: Error saving ${filename}`);
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
  const etagData = await readRNFSJsonData<ETagData>(RB_TOKEN_LIST_ETAG);
  const etag = etagData?.etag;
  const commonHeaders = {
    Accept: 'application/json',
  };

  try {
    const { data, status, headers } = await rainbowFetch(
      RAINBOW_TOKEN_LIST_URL,
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
      const work = [
        writeRNFSJsonData<TokenListData>(
          RB_TOKEN_LIST_CACHE,
          data as TokenListData
        ),
      ];

      if ((headers as Headers).get('etag')) {
        work.push(
          writeRNFSJsonData<ETagData>(RB_TOKEN_LIST_ETAG, {
            etag: (headers as Headers).get('etag'),
          })
        );
      }

      await Promise.all(work);
      return { newTokenList: data as TokenListData, status };
    } else {
      return { newTokenList: undefined, status };
    }
  } catch (error) {
    if (error?.response?.status !== 304) {
      // Log errors that are not 304 no change errors
      logger.sentry('Error fetching token list');
      logger.error(error);
      captureException(error);
    }
    return {
      newTokenList: undefined,
      status: error?.response?.status,
    };
  }
}

class RainbowTokenList extends EventEmitter {
  // @ts-expect-error ts-migrate(18028) FIXME: Private identifiers are only available when target... Remove this comment to see the full error message
  #tokenListDataStorage = RAINBOW_TOKEN_LIST_DATA;
  // @ts-expect-error ts-migrate(18028) FIXME: Private identifiers are only available when target... Remove this comment to see the full error message
  #derivedData = generateDerivedData(RAINBOW_TOKEN_LIST_DATA);
  // @ts-expect-error ts-migrate(18028) FIXME: Private identifiers are only available when target... Remove this comment to see the full error message
  #updateJob: Promise<void> | null = null;

  constructor() {
    super();

    readRNFSJsonData<TokenListData>(RB_TOKEN_LIST_CACHE)
      .then(cachedData => {
        if (cachedData?.timestamp) {
          const bundledDate = new Date(this._tokenListData?.timestamp);
          const cachedDate = new Date(cachedData?.timestamp);

          if (cachedDate > bundledDate) this._tokenListData = cachedData;
        }
      })
      .catch(error => {
        logger.sentry('Error initializing token-list cache data');
        logger.error(error);
        captureException(error);
      })
      .finally(() => {
        logger.debug('Token list initialized');
      });
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
