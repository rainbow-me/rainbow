import GraphemeSplitter from 'grapheme-splitter';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getPreference,
  PreferenceActionType,
  setPreference,
} from '../model/preferences';
import useAccountProfile from './useAccountProfile';
import useAccountSettings from './useAccountSettings';
import useWallets from './useWallets';
import { findWalletWithAccount } from '@rainbow-me/helpers/findWalletWithAccount';
import { containsEmoji } from '@rainbow-me/helpers/strings';
import WalletTypes from '@rainbow-me/helpers/walletTypes';
import { updateWebDataEnabled } from '@rainbow-me/redux/showcaseTokens';
import logger from 'logger';

const getAccountSymbol = name => {
  if (!name) {
    return null;
  }
  const accountSymbol = new GraphemeSplitter().splitGraphemes(name)[0];
  return accountSymbol;
};

const wipeNotEmoji = text => {
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

  const { showcaseTokens, webDataEnabled } = useSelector(
    ({ showcaseTokens: { webDataEnabled, showcaseTokens } }) => ({
      showcaseTokens,
      webDataEnabled,
    })
  );

  const { colors } = useTheme();
  const { accountSymbol, accountColor } = useAccountProfile();

  const initWebData = useCallback(
    async showcaseTokens => {
      await setPreference(
        PreferenceActionType.init,
        'showcase',
        accountAddress,
        showcaseTokens
      );

      await setPreference(
        PreferenceActionType.init,
        'profile',
        accountAddress,
        {
          accountColor: colors.avatarBackgrounds[accountColor],
          accountSymbol: wipeNotEmoji(accountSymbol),
        }
      );

      dispatch(updateWebDataEnabled(true, accountAddress));
    },
    [
      accountAddress,
      accountColor,
      accountSymbol,
      colors.avatarBackgrounds,
      dispatch,
    ]
  );

  const wipeWebData = useCallback(async () => {
    if (!webDataEnabled) return;
    await setPreference(PreferenceActionType.wipe, 'showcase', accountAddress);
    await setPreference(PreferenceActionType.wipe, 'profile', accountAddress);
    dispatch(updateWebDataEnabled(false, accountAddress));
  }, [accountAddress, dispatch, webDataEnabled]);

  const updateWebProfile = useCallback(
    async (address, name, color) => {
      if (!webDataEnabled) return;
      const wallet = findWalletWithAccount(wallets, address);
      if (wallet.type === WalletTypes.readOnly) return;
      const data = {
        accountColor: color || accountColor,
        accountSymbol: wipeNotEmoji(
          name ? getAccountSymbol(name) : accountSymbol
        ),
      };
      await setPreference(
        PreferenceActionType.update,
        'profile',
        address,
        data
      );
    },
    [accountColor, accountSymbol, wallets, webDataEnabled]
  );

  const updateWebShowcase = useCallback(
    async assetIds => {
      if (!webDataEnabled) return;
      const response = await getPreference('showcase', accountAddress);
      // If the showcase is populated, just updated it
      if (response?.ids?.length > 0) {
        setPreference(
          PreferenceActionType.update,
          'showcase',
          accountAddress,
          assetIds
        );
      } else {
        // Initialize showcase and profiles
        await initWebData(assetIds);
        logger.log('showcase initialized!');
      }
    },
    [accountAddress, initWebData, webDataEnabled]
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
    initializeShowcaseIfNeeded,
    initWebData,
    updateWebProfile,
    updateWebShowcase,
    webDataEnabled,
    wipeWebData,
  };
}
