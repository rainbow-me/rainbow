import GraphemeSplitter from 'grapheme-splitter';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getPreference, PreferenceActionType, setPreference } from '../model/preferences';
import { containsEmoji } from '@/helpers/strings';
import WalletTypes from '@/helpers/walletTypes';
import { updateWebDataEnabled } from '@/redux/showcaseTokens';
import { AppState } from '@/redux/store';
import { logger, RainbowError } from '@/logger';
import { getWalletForAddress, useAccountAddress, useAccountProfileInfo } from '@/state/wallets/walletsStore';

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

export default function useWebData() {
  const accountAddress = useAccountAddress();
  const dispatch = useDispatch();

  const { showcaseTokens, webDataEnabled, hiddenTokens } = useSelector(
    ({ hiddenTokens: { hiddenTokens }, showcaseTokens: { webDataEnabled, showcaseTokens } }: AppState) => ({
      hiddenTokens,
      showcaseTokens,
      webDataEnabled,
    })
  );

  const { accountSymbol, accountColorHex } = useAccountProfileInfo();

  const initWebData = useCallback(
    async (showcaseTokens: any) => {
      await setPreference(PreferenceActionType.init, 'showcase', accountAddress, showcaseTokens);

      await setPreference(PreferenceActionType.init, 'hidden', accountAddress, hiddenTokens);

      await setPreference(PreferenceActionType.init, 'profile', accountAddress, {
        accountColor: accountColorHex,
        accountSymbol: wipeNotEmoji(accountSymbol as string),
      });

      dispatch(updateWebDataEnabled(true, accountAddress));
    },
    [accountAddress, accountColorHex, accountSymbol, dispatch, hiddenTokens]
  );

  const wipeWebData = useCallback(async () => {
    if (!webDataEnabled) return;
    await setPreference(PreferenceActionType.wipe, 'showcase', accountAddress);
    await setPreference(PreferenceActionType.wipe, 'profile', accountAddress);
    dispatch(updateWebDataEnabled(false, accountAddress));
  }, [accountAddress, dispatch, webDataEnabled]);

  const updateWebProfile = useCallback(
    async (address: string, name: string, color: string) => {
      if (!webDataEnabled) return;
      const wallet = getWalletForAddress(address);
      if (!wallet || wallet.type === WalletTypes.readOnly) return;
      const data = {
        accountColor: color || accountColorHex,
        accountSymbol: wipeNotEmoji(name ? getAccountSymbol(name)! : (accountSymbol as string)),
      };
      await setPreference(PreferenceActionType.update, 'profile', address, data);
    },
    [accountColorHex, accountSymbol, webDataEnabled]
  );

  const getWebProfile = useCallback(async (address: string) => {
    if (!address) return null;
    const response = await getPreference('profile', address);
    return response?.profile ?? null;
  }, []);

  const updateWebShowcase = useCallback(
    async (assetIds: string[]) => {
      // uniqueId[]
      if (!webDataEnabled) return;
      const response = await getPreference('showcase', accountAddress);
      if (!response || !response.showcase.ids.length) {
        await initWebData(assetIds);
        logger.debug('[useWebData]: showcase initialized!');
        return;
      }

      setPreference(PreferenceActionType.update, 'showcase', accountAddress, assetIds);
    },
    [accountAddress, initWebData, webDataEnabled]
  );

  const updateWebHidden = useCallback(
    async (assetIds: string[]) => {
      // fullUniqueId[]
      const response = await getPreference('hidden', accountAddress);
      if (!response || !response.hidden.ids.length) {
        await setPreference(PreferenceActionType.init, 'hidden', accountAddress, assetIds);
        logger.debug('[useWebData]: hidden initialized!');
        return;
      }

      setPreference(PreferenceActionType.update, 'hidden', accountAddress, assetIds);
    },
    [accountAddress]
  );

  const initializeShowcaseIfNeeded = useCallback(async () => {
    try {
      // If local showcase is not empty
      if (showcaseTokens?.length > 0) {
        // If webdata is enabled
        if (webDataEnabled) {
          const response = await getPreference('showcase', accountAddress);
          if (!response || !response.showcase.ids.length) {
            await initWebData(showcaseTokens);
            logger.debug('[useWebData]: showcase initialized!');
            return;
          }

          logger.debug('[useWebData]: showcase already initialized. skipping');
        }
      }
    } catch (e) {
      logger.error(new RainbowError(`[useWebData]: error while trying to initialize showcase: ${e}`));
    }
  }, [accountAddress, initWebData, showcaseTokens, webDataEnabled]);

  return {
    getWebProfile,
    initializeShowcaseIfNeeded,
    initWebData,
    updateWebHidden,
    updateWebProfile,
    updateWebShowcase,
    webDataEnabled,
    wipeWebData,
  };
}
