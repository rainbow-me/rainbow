import GraphemeSplitter from 'grapheme-splitter';
import { getPreference, PreferenceActionType, setPreference } from '../model/preferences';
import { containsEmoji } from '@/helpers/strings';
import WalletTypes from '@/helpers/walletTypes';
import { logger, RainbowError } from '@/logger';
import { getAccountProfileInfo, getWalletWithAccount } from '@/state/wallets/walletsStore';

const getAccountSymbol = (name: string) => {
  if (!name) {
    return null;
  }
  const accountSymbol = new GraphemeSplitter().splitGraphemes(name)[0];
  return accountSymbol;
};

const wipeNotEmoji = (text: string) => {
  const characters = new GraphemeSplitter().splitGraphemes(text);
  if (characters.length !== 1) {
    return null;
  }
  return containsEmoji(text) ? text : null;
};

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
  await setPreference(PreferenceActionType.init, 'showcase', address, showcaseTokens);

  await setPreference(PreferenceActionType.init, 'hidden', address, hiddenTokens);

  await setPreference(PreferenceActionType.init, 'profile', address, {
    accountColor: accountColorHex,
    accountSymbol: wipeNotEmoji(accountSymbol as string),
  });
};

export const updateWebHidden = async (address: string, assetIds: string[]) => {
  // fullUniqueId[]
  const response = await getPreference('hidden', address);
  if (!response || !response.hidden.ids.length) {
    await setPreference(PreferenceActionType.init, 'hidden', address, assetIds);
    logger.debug('[webData]: hidden initialized!');
    return;
  }

  setPreference(PreferenceActionType.update, 'hidden', address, assetIds);
};

export const updateWebShowcase = async (address: string, assetIds: string[]) => {
  // uniqueId[]
  const response = await getPreference('showcase', address);
  if (!response || !response.showcase.ids.length) {
    await setPreference(PreferenceActionType.init, 'showcase', address, assetIds);
    logger.debug('[webData]: showcase initialized!');
    return;
  }

  setPreference(PreferenceActionType.update, 'showcase', address, assetIds);
};

export const wipeWebData = async (address: string) => {
  await setPreference(PreferenceActionType.wipe, 'showcase', address);
  await setPreference(PreferenceActionType.wipe, 'profile', address);
};

export const updateWebProfile = async (address: string, name: string, accountColorHex: string, accountSymbol: string | null) => {
  const wallet = getWalletWithAccount(address);
  if (!wallet || wallet.type === WalletTypes.readOnly) return;
  const data = {
    accountColor: accountColorHex,
    accountSymbol: wipeNotEmoji(name ? getAccountSymbol(name)! : (accountSymbol as string)),
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
    // If local showcase is not empty
    if (showcaseTokens?.length > 0) {
      const response = await getPreference('showcase', address);
      if (!response || !response.showcase.ids.length) {
        await initWebData(address, showcaseTokens, hiddenTokens, accountColorHex, accountSymbol);
        logger.debug('[webData]: showcase initialized!');
        return;
      }

      logger.debug('[webData]: showcase already initialized. skipping');
    }
  } catch (e) {
    logger.error(new RainbowError(`[webData]: error while trying to initialize showcase: ${e}`));
  }
};
