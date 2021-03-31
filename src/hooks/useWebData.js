import { useCallback, useEffect, useState } from 'react';
import { PreferenceActionType, setPreference } from '../model/preferences';
import { loadWallet } from '../model/wallet';
import useAccountProfile from './useAccountProfile';
import useAccountSettings from './useAccountSettings';
// eslint-disable-next-line import/no-cycle
import useShowcaseTokens from './useShowcaseTokens';
import {
  getWebDataEnabled,
  saveWebDataEnabled,
} from '@rainbow-me/handlers/localstorage/accountLocal';

export default function useWebData() {
  const { showcaseTokens } = useShowcaseTokens();
  const { accountAddress, network } = useAccountSettings();
  const { colors } = useTheme();
  const { accountName, accountSymbol, accountColor } = useAccountProfile();
  const [webDataEnabled, setWebDataEnabled] = useState(false);

  useEffect(() => {
    const init = async () => {
      const pref = await getWebDataEnabled(accountAddress, network);
      setWebDataEnabled(!!pref);
    };
    init();
  }, [accountAddress, network]);

  const initWebData = useCallback(
    async address => {
      const wallet = await loadWallet(address);
      if (!wallet) return;
      await setPreference(
        PreferenceActionType.init,
        'showcase',
        wallet,
        showcaseTokens
      );

      await setPreference(PreferenceActionType.init, 'profile', wallet, {
        accountColor: colors.avatarColor[accountColor],
        accountName: accountName,
        accountSymbol: accountSymbol,
      });

      await saveWebDataEnabled(true, address, network);
      setWebDataEnabled(true);
    },
    [
      accountColor,
      accountName,
      accountSymbol,
      colors.avatarColor,
      network,
      showcaseTokens,
    ]
  );

  const wipeWebData = useCallback(
    async address => {
      const pref = await getWebDataEnabled(address, network);
      if (!pref) return;
      const wallet = await loadWallet(address);
      if (!wallet) return;
      await setPreference(PreferenceActionType.wipe, 'showcase', wallet);
      await setPreference(PreferenceActionType.wipe, 'profile', wallet);
      await saveWebDataEnabled(false, address, network);
      setWebDataEnabled(false);
    },
    [network]
  );

  const updateWebProfile = useCallback(
    async address => {
      const pref = await getWebDataEnabled(address, network);
      if (!pref) return;
      const wallet = await loadWallet(address);
      if (!wallet) return;
      await setPreference(PreferenceActionType.update, 'profile', wallet, {
        accountColor: colors.avatarColor[accountColor],
        accountName: accountName,
        accountSymbol: accountSymbol,
      });
    },
    [accountColor, accountName, accountSymbol, colors.avatarColor, network]
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
    [accountAddress, network]
  );

  const removeAssetFromWebShowcase = useCallback(
    async asset_id => {
      const pref = await getWebDataEnabled(accountAddress, network);
      if (!pref) return;
      const wallet = await loadWallet();
      if (!wallet) return;
      setPreference(PreferenceActionType.remove, 'showcase', wallet, asset_id);
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
