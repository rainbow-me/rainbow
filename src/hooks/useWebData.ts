import GraphemeSplitter from 'grapheme-splitter';
import { useCallback } from 'react';
import { getPreference, PreferenceActionType, setPreference } from '../model/preferences';
import { containsEmoji } from '@/helpers/strings';
import WalletTypes from '@/helpers/walletTypes';
import { logger, RainbowError } from '@/logger';
import { getWalletWithAccount, useAccountAddress, useAccountProfileInfo } from '@/state/wallets/walletsStore';
import useShowcaseTokens from '@/hooks/useShowcaseTokens';
import useHiddenTokens from '@/hooks/useHiddenTokens';

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

export default function useWebData(address?: string) {
  const accountAddress = useAccountAddress();

  const addressToUse = address ?? accountAddress;

  const { showcaseTokens } = useShowcaseTokens(addressToUse);
  const { hiddenTokens } = useHiddenTokens(addressToUse);

  const { accountSymbol, accountColorHex } = useAccountProfileInfo();

  const initWebData = useCallback(
    async (showcaseTokens: string[]) => {
      await setPreference(PreferenceActionType.init, 'showcase', addressToUse, showcaseTokens);

      await setPreference(PreferenceActionType.init, 'hidden', addressToUse, hiddenTokens);

      await setPreference(PreferenceActionType.init, 'profile', addressToUse, {
        accountColor: accountColorHex,
        accountSymbol: wipeNotEmoji(accountSymbol as string),
      });
    },
    [addressToUse, accountColorHex, accountSymbol, hiddenTokens]
  );

  const wipeWebData = useCallback(async () => {
    await setPreference(PreferenceActionType.wipe, 'showcase', addressToUse);
    await setPreference(PreferenceActionType.wipe, 'profile', addressToUse);
  }, [addressToUse]);

  const updateWebProfile = useCallback(
    async (address: string, name: string, color: string) => {
      const wallet = getWalletWithAccount(address);
      if (!wallet || wallet.type === WalletTypes.readOnly) return;
      const data = {
        accountColor: color || accountColorHex,
        accountSymbol: wipeNotEmoji(name ? getAccountSymbol(name)! : (accountSymbol as string)),
      };
      await setPreference(PreferenceActionType.update, 'profile', address, data);
    },
    [accountColorHex, accountSymbol]
  );

  const getWebProfile = useCallback(async (address: string) => {
    if (!address) return null;
    const response = await getPreference('profile', address);
    return response?.profile ?? null;
  }, []);

  const updateWebShowcase = useCallback(
    async (address: string, assetIds: string[]) => {
      // uniqueId[]
      const response = await getPreference('showcase', address);
      if (!response || !response.showcase.ids.length) {
        await initWebData(assetIds);
        logger.debug('[useWebData]: showcase initialized!');
        return;
      }

      setPreference(PreferenceActionType.update, 'showcase', address, assetIds);
    },
    [initWebData]
  );

  const updateWebHidden = useCallback(async (address: string, assetIds: string[]) => {
    // fullUniqueId[]
    const response = await getPreference('hidden', address);
    if (!response || !response.hidden.ids.length) {
      await setPreference(PreferenceActionType.init, 'hidden', address, assetIds);
      logger.debug('[useWebData]: hidden initialized!');
      return;
    }

    setPreference(PreferenceActionType.update, 'hidden', address, assetIds);
  }, []);

  const initializeShowcaseIfNeeded = useCallback(async () => {
    try {
      // If local showcase is not empty
      if (showcaseTokens?.length > 0) {
        const response = await getPreference('showcase', addressToUse);
        if (!response || !response.showcase.ids.length) {
          await initWebData(showcaseTokens);
          logger.debug('[useWebData]: showcase initialized!');
          return;
        }

        logger.debug('[useWebData]: showcase already initialized. skipping');
      }
    } catch (e) {
      logger.error(new RainbowError(`[useWebData]: error while trying to initialize showcase: ${e}`));
    }
  }, [addressToUse, initWebData, showcaseTokens]);

  return {
    showcaseTokens,
    hiddenTokens,
    getWebProfile,
    initializeShowcaseIfNeeded,
    initWebData,
    updateWebHidden,
    updateWebProfile,
    updateWebShowcase,
    wipeWebData,
  };
}
