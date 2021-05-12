import GraphemeSplitter from 'grapheme-splitter';
import { useCallback } from 'react';
import { PreferenceActionType, setPreference } from '../model/preferences';
import useAccountProfile from './useAccountProfile';
import useAccountSettings from './useAccountSettings';
import {
  getWebDataEnabled,
  saveWebDataEnabled,
} from '@rainbow-me/handlers/localstorage/accountLocal';

const getAccountSymbol = name => {
  if (!name) {
    return null;
  }
  const accountSymbol = new GraphemeSplitter().splitGraphemes(name)[0];
  return accountSymbol;
};

export default function useWebData() {
  const { accountAddress, network, webDataEnabled } = useAccountSettings();
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
          accountColor: colors.avatarColor[accountColor],
          accountSymbol: accountSymbol,
        }
      );

      await saveWebDataEnabled(true, accountAddress, network);
    },
    [accountAddress, accountColor, accountSymbol, colors.avatarColor, network]
  );

  const wipeWebData = useCallback(async () => {
    const pref = await getWebDataEnabled(accountAddress, network);
    if (!pref) return;
    await setPreference(PreferenceActionType.wipe, 'showcase', accountAddress);
    await setPreference(PreferenceActionType.wipe, 'profile', accountAddress);
    await saveWebDataEnabled(false, accountAddress, network);
  }, [accountAddress, network]);

  const updateWebProfile = useCallback(
    async (address, name, color) => {
      const pref = await getWebDataEnabled(address, network);
      if (!pref) return;
      const data = {
        accountColor: color || accountColor,
        accountSymbol: name ? getAccountSymbol(name) : accountSymbol,
      };
      await setPreference(
        PreferenceActionType.update,
        'profile',
        address,
        data
      );
    },
    [accountColor, accountSymbol, network]
  );

  const addAssetToWebShowcase = useCallback(
    async asset_id => {
      const pref = await getWebDataEnabled(accountAddress, network);
      if (!pref) return;
      setPreference(PreferenceActionType.update, 'showcase', accountAddress, [
        asset_id,
      ]);
    },
    [accountAddress, network]
  );

  const removeAssetFromWebShowcase = useCallback(
    async asset_id => {
      const pref = await getWebDataEnabled(accountAddress, network);
      if (!pref) return;
      setPreference(PreferenceActionType.remove, 'showcase', accountAddress, [
        asset_id,
      ]);
    },
    [accountAddress, network]
  );

  return {
    addAssetToWebShowcase,
    initWebData,
    removeAssetFromWebShowcase,
    updateWebProfile,
    webDataEnabled,
    wipeWebData,
  };
}
