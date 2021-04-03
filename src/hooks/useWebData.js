import GraphemeSplitter from 'grapheme-splitter';
import { useCallback, useEffect, useState } from 'react';
import { PreferenceActionType, useSetPreference } from '../model/preferences';
import { loadWallet } from '../model/wallet';
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
  const { accountAddress, network } = useAccountSettings();
  const { colors } = useTheme();
  const { accountSymbol, accountColor } = useAccountProfile();
  const [webDataEnabled, setWebDataEnabled] = useState(false);

  useEffect(() => {
    const init = async () => {
      const pref = await getWebDataEnabled(accountAddress, network);
      setWebDataEnabled(!!pref);
    };
    init();
  }, [accountAddress, network]);

  const setPreference = useSetPreference();
  const initWebData = useCallback(
    async showcaseTokens => {
      const wallet = await loadWallet();
      if (!wallet) return;
      await setPreference(
        PreferenceActionType.init,
        'showcase',
        wallet,
        showcaseTokens
      );

      await setPreference(PreferenceActionType.init, 'profile', wallet, {
        accountColor: colors.avatarColor[accountColor],
        accountSymbol: accountSymbol,
      });

      await saveWebDataEnabled(true, accountAddress, network);
      setWebDataEnabled(true);
    },
    [accountAddress, accountColor, accountSymbol, colors.avatarColor, network]
  );

  const wipeWebData = useCallback(async () => {
    const pref = await getWebDataEnabled(accountAddress, network);
    if (!pref) return;
    const wallet = await loadWallet(accountAddress);
    if (!wallet) return;
    await setPreference(PreferenceActionType.wipe, 'showcase', wallet);
    await setPreference(PreferenceActionType.wipe, 'profile', wallet);
    await saveWebDataEnabled(false, accountAddress, network);
    setWebDataEnabled(false);
  }, [accountAddress, network, setPreference]);

  const updateWebProfile = useCallback(
    async (address, name, color) => {
      const pref = await getWebDataEnabled(address, network);
      if (!pref) return;
      const wallet = await loadWallet(address);
      if (!wallet) return;
      const data = {
        accountColor: color || accountColor,
        accountSymbol: name ? getAccountSymbol(name) : accountSymbol,
      };
      await setPreference(PreferenceActionType.update, 'profile', wallet, data);
    },
    [accountColor, accountSymbol, network, setPreference]
  );

  const addAssetToWebShowcase = useCallback(
    async asset_id => {
      const pref = await getWebDataEnabled(accountAddress, network);
      if (!pref) return;
      const wallet = await loadWallet();
      if (!wallet) return;
      setPreference(PreferenceActionType.update, 'showcase', wallet, [
        asset_id,
      ]);
    },
    [accountAddress, network, setPreference]
  );

  const removeAssetFromWebShowcase = useCallback(
    async asset_id => {
      const pref = await getWebDataEnabled(accountAddress, network);
      if (!pref) return;
      const wallet = await loadWallet();
      if (!wallet) return;
      setPreference(PreferenceActionType.remove, 'showcase', wallet, asset_id);
    },
    [accountAddress, network, setPreference]
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
