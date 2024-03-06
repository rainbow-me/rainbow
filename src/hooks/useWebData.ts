import GraphemeSplitter from 'grapheme-splitter';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getPreference, PreferenceActionType, setPreference } from '../model/preferences';
import useAccountProfile from './useAccountProfile';
import useAccountSettings from './useAccountSettings';
import useWallets from './useWallets';
import { findWalletWithAccount } from '@/helpers/findWalletWithAccount';
import { containsEmoji } from '@/helpers/strings';
import WalletTypes from '@/helpers/walletTypes';
import { updateWebDataEnabled } from '@/redux/showcaseTokens';
import { AppState } from '@/redux/store';
import logger from '@/utils/logger';
import { useTheme } from '@/theme';

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
  const { accountAddress } = useAccountSettings();
  const dispatch = useDispatch();
  const { wallets } = useWallets();

  const { showcaseTokens, webDataEnabled, hiddenTokens } = useSelector(
    ({ hiddenTokens: { hiddenTokens }, showcaseTokens: { webDataEnabled, showcaseTokens } }: AppState) => ({
      hiddenTokens,
      showcaseTokens,
      webDataEnabled,
    })
  );

  const { colors } = useTheme();
  const { accountSymbol, accountColor } = useAccountProfile();

  const initWebData = useCallback(
    async (showcaseTokens: any) => {
      await setPreference(PreferenceActionType.init, 'showcase', accountAddress, showcaseTokens);

      await setPreference(PreferenceActionType.init, 'hidden', accountAddress, hiddenTokens);

      await setPreference(PreferenceActionType.init, 'profile', accountAddress, {
        accountColor: colors.avatarBackgrounds[accountColor],
        accountSymbol: wipeNotEmoji(accountSymbol as string),
      });

      dispatch(updateWebDataEnabled(true, accountAddress));
    },
    [accountAddress, accountColor, accountSymbol, colors.avatarBackgrounds, dispatch, hiddenTokens]
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
      const wallet = findWalletWithAccount(wallets!, address);
      // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
      if (wallet.type === WalletTypes.readOnly) return;
      const data = {
        accountColor: color || accountColor,
        accountSymbol: wipeNotEmoji(name ? getAccountSymbol(name)! : (accountSymbol as string)),
      };
      await setPreference(PreferenceActionType.update, 'profile', address, data);
    },
    [accountColor, accountSymbol, wallets, webDataEnabled]
  );

  const getWebProfile = useCallback(async (address: string) => {
    const response = address && (await getPreference('profile', address));
    return response?.profile;
  }, []);

  const updateWebShowcase = useCallback(
    async (assetIds: any) => {
      if (!webDataEnabled) return;
      const response = await getPreference('showcase', accountAddress);
      // If the showcase is populated, just updated it
      if (response?.ids?.length > 0) {
        setPreference(PreferenceActionType.update, 'showcase', accountAddress, assetIds);
      } else {
        // Initialize showcase and profiles
        await initWebData(assetIds);
        logger.log('showcase initialized!');
      }
    },
    [accountAddress, initWebData, webDataEnabled]
  );

  const updateWebHidden = useCallback(
    async (assetIds: any) => {
      const response = await getPreference('hidden', accountAddress);
      // If the showcase is populated, just updated it
      if (response?.ids?.length > 0) {
        setPreference(PreferenceActionType.update, 'hidden', accountAddress, assetIds);
      } else {
        await setPreference(PreferenceActionType.init, 'hidden', accountAddress, assetIds);

        logger.log('hidden initialized!');
      }
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
          // If the showcase is populated, nothing to do
          if (response?.ids?.length > 0) {
            logger.log('showcase already initialized. skipping');
          } else {
            // Initialize
            await initWebData(showcaseTokens);
            logger.log('showcase initialized!');
          }
        }
      }
    } catch (e) {
      logger.log('Error trying to initiailze showcase');
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
