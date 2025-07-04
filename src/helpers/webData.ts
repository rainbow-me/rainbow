import { getFirstEmoji, getValidatedEmoji } from './emojiHandler';
import { getPreference, PreferenceActionType, setPreference } from '../model/preferences';
import WalletTypes from '@/helpers/walletTypes';
import { logger, RainbowError } from '@/logger';
import { getWalletWithAccount } from '@/state/wallets/walletsStore';

export const getWebProfile = async (address: string) => {
  if (!address) return null;
  const response = await getPreference('profile', address);
  return response?.profile ?? null;
};

export const initWebData = async (
  address: string,
  showcaseTokens: string[],
  hiddenTokens: string[],
  accountColorHex: string,
  accountSymbol: string | null
) => {
  return Promise.all([
    setPreference(PreferenceActionType.init, 'showcase', address, showcaseTokens),
    setPreference(PreferenceActionType.init, 'hidden', address, hiddenTokens),
    setPreference(PreferenceActionType.init, 'profile', address, {
      accountColor: accountColorHex,
      accountSymbol: getValidatedEmoji(accountSymbol as string),
    }),
  ]);
};

export const updateWebHidden = async (address: string, assetIds: string[], forceInit = false) => {
  const response = await getPreference('hidden', address);
  if (forceInit || !response || !response.hidden.ids.length) {
    await setPreference(PreferenceActionType.init, 'hidden', address, assetIds);
    logger.debug('[webData]: hidden initialized!');
    return;
  }

  setPreference(PreferenceActionType.update, 'hidden', address, assetIds);
};

export const updateWebShowcase = async (address: string, assetIds: string[], forceInit = false) => {
  const response = await getPreference('showcase', address);
  if (forceInit || !response || !response.showcase.ids.length) {
    await setPreference(PreferenceActionType.init, 'showcase', address, assetIds);
    logger.debug('[webData]: showcase initialized!');
    return;
  }

  setPreference(PreferenceActionType.update, 'showcase', address, assetIds);
};

export const wipeWebData = async (address: string) => {
  return Promise.all([
    setPreference(PreferenceActionType.wipe, 'showcase', address),
    setPreference(PreferenceActionType.wipe, 'profile', address),
  ]);
};

export const updateWebProfile = async (address: string, name: string, accountColorHex: string, accountSymbol: string | null) => {
  const wallet = getWalletWithAccount(address);
  if (!wallet || wallet.type === WalletTypes.readOnly) return;
  const data = {
    accountColor: accountColorHex,
    accountSymbol: (name ? getFirstEmoji(name) : accountSymbol ? getValidatedEmoji(accountSymbol) : null) || null,
  };
  await setPreference(PreferenceActionType.update, 'profile', address, data);
};

export const initializeShowcaseIfNeeded = async (
  address: string,
  showcaseTokens: string[],
  hiddenTokens: string[],
  accountColorHex: string,
  accountSymbol: string | null
) => {
  try {
    const response = await getPreference('showcase', address);
    if (!response || !response.showcase.ids.length) {
      await initWebData(address, showcaseTokens, hiddenTokens, accountColorHex, accountSymbol);
      logger.debug('[webData]: showcase initialized!');
      return;
    }

    logger.debug('[webData]: showcase already initialized. skipping');
  } catch (e) {
    logger.error(new RainbowError(`[webData]: error while trying to initialize showcase: ${e}`));
  }
};
