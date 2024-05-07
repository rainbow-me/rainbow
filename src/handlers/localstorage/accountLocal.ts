import { MMKV } from 'react-native-mmkv';
import { getAccountLocal, getKey, saveAccountLocal } from './common';
import { ENSRegistrations } from '@/entities';
import { STORAGE_IDS } from '@/model/mmkv';

const assetsVersion = '0.3.0';

const ACCOUNT_INFO = 'accountInfo';
const ACCOUNT_EMPTY = 'accountEmpty';
const ASSETS = 'assets';
const SHOWCASE_TOKENS = 'showcaseTokens';
const HIDDEN_TOKENS = 'hiddenTokens';
const TRANSACTIONS = 'transactions';
const UNIQUE_TOKENS = 'uniquetokens';
const PINNED_COINS = 'pinnedCoins';
const HIDDEN_COINS = 'hiddenCoins';
const WEB_DATA_ENABLED = 'webDataEnabled';
const ENS_REGISTRATIONS = 'ensRegistrations';

const storage = new MMKV({
  id: STORAGE_IDS.ACCOUNT,
});

export const accountLocalKeys = [
  ACCOUNT_INFO,
  ASSETS,
  ENS_REGISTRATIONS,
  SHOWCASE_TOKENS,
  TRANSACTIONS,
  UNIQUE_TOKENS,
  PINNED_COINS,
  HIDDEN_COINS,
  WEB_DATA_ENABLED,
];

/**
 * @desc get account empty state
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Boolean}
 */
export const getAccountEmptyState = (accountAddress: any, network: any) =>
  storage.getBoolean(getKey(ACCOUNT_EMPTY, accountAddress, network));

/**
 * @desc save account empty state
 * @param  {Boolean}    [val]
 * @param  {String}   [address]
 * @param  {String}   [network]
 */
export const saveAccountEmptyState = (val: any, accountAddress: any, network: any) =>
  storage.set(getKey(ACCOUNT_EMPTY, accountAddress, network), val);

/**
 * @desc get assets
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Array}
 */
export const getAssets = (accountAddress: any, network: any) => getAccountLocal(ASSETS, accountAddress, network, [], assetsVersion);

/**
 * @desc get ENS registrations
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getLocalENSRegistrations = (accountAddress: any, network: any): Promise<ENSRegistrations> =>
  // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{}' is not assignable to paramet... Remove this comment to see the full error message
  getAccountLocal(ENS_REGISTRATIONS, accountAddress, network, {});

/**
 * @desc save ENS registrations
 * @param  {String}   [address]
 * @param  {Array}    [assets]
 * @param  {String}   [network]
 */
export const saveLocalENSRegistrations = (ensRegistrations: ENSRegistrations, accountAddress: any, network: any) =>
  saveAccountLocal(ENS_REGISTRATIONS, ensRegistrations, accountAddress, network);

/**
 * @desc get profile info
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Object}
 */
export const getAccountInfo = (accountAddress: any, network: any) =>
  // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{}' is not assignable to paramet... Remove this comment to see the full error message
  getAccountLocal(ACCOUNT_INFO, accountAddress, network, {});

/**
 * @desc save profile info
 * @param  {String}   [address]
 * @param  {Object}    [profile info]
 * @param  {String}   [network]
 */
export const saveAccountInfo = (profileInfo: any, accountAddress: any, network: any) =>
  saveAccountLocal(ACCOUNT_INFO, profileInfo, accountAddress, network);

/**
 * @desc get pinned coins
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Array}
 */
export const getPinnedCoins = (accountAddress: any, network: any) =>
  // @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
  getAccountLocal(PINNED_COINS, accountAddress, network, ['eth']);

/**
 * @desc save pinned coins
 * @param  {Array}    [pinned coins]
 * @param  {String}   [address]
 * @param  {String}   [network]
 */
export const savePinnedCoins = (pinnedCoins: any, accountAddress: any, network: any) =>
  saveAccountLocal(PINNED_COINS, pinnedCoins, accountAddress, network);

/**
 * @desc get hidden coins
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Array}
 */
export const getHiddenCoins = (accountAddress: any, network: any) => getAccountLocal(HIDDEN_COINS, accountAddress, network, []);

/**
 * @desc save hidden coins
 * @param  {Array}    [hidden coins]
 * @param  {String}   [address]
 * @param  {String}   [network]
 */
export const saveHiddenCoins = (hiddenCoins: any, accountAddress: any, network: any) =>
  saveAccountLocal(HIDDEN_COINS, hiddenCoins, accountAddress, network);

/**
 * @desc get showcase tokens
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Afray}
 */
export const getShowcaseTokens = (accountAddress: any, network: any) => getAccountLocal(SHOWCASE_TOKENS, accountAddress, network, []);

/**
 * @desc save showcase tokens
 * @param  {String}   [address]
 * @param  {Array}    [Showcase tokens]
 * @param  {String}   [network]
 */
export const saveShowcaseTokens = (showcaseTokens: any, accountAddress: any, network: any) =>
  saveAccountLocal(SHOWCASE_TOKENS, showcaseTokens, accountAddress, network);

/**
 * @desc get web data enabled preference
 * @param  {String}   [address]
 * @param  {String}   [network]
 * @return {Array}
 */
export const getWebDataEnabled = (accountAddress: any, network: any) =>
  // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'null' is not assignable to param... Remove this comment to see the full error message
  getAccountLocal(WEB_DATA_ENABLED, accountAddress, network, null);

/**
 * @desc save web showcase enabled preference
 * @param  {Boolean}  [value]
 * @param  {String}   [address]
 * @param  {String}   [network]
 */
export const saveWebDataEnabled = (preference: any, accountAddress: any, network: any) =>
  saveAccountLocal(WEB_DATA_ENABLED, preference, accountAddress, network);

/**
 * Get hidden tokens
 */
export const getHiddenTokens = (accountAddress: string, network: string) => getAccountLocal(HIDDEN_TOKENS, accountAddress, network, []);

/**
 * Save hidden tokens
 */
export const saveHiddenTokens = (hiddenTokens: string[], accountAddress: string, network: string) =>
  saveAccountLocal(HIDDEN_TOKENS, hiddenTokens, accountAddress, network);
