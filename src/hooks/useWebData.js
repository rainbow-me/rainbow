import GraphemeSplitter from 'grapheme-splitter';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PreferenceActionType, setPreference } from '../model/preferences';
import useAccountProfile from './useAccountProfile';
import useAccountSettings from './useAccountSettings';
import { updateWebDataEnabled } from '@rainbow-me/redux/showcaseTokens';

const getAccountSymbol = name => {
  if (!name) {
    return null;
  }
  const accountSymbol = new GraphemeSplitter().splitGraphemes(name)[0];
  return accountSymbol;
};

export default function useWebData() {
  const { accountAddress } = useAccountSettings();
  const dispatch = useDispatch();

  const webDataEnabled = useSelector(
    ({ showcaseTokens: { webDataEnabled } }) => webDataEnabled
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
          accountColor: colors.avatarColor[accountColor],
          accountSymbol: accountSymbol,
        }
      );

      dispatch(updateWebDataEnabled(true, accountAddress));
    },
    [accountAddress, accountColor, accountSymbol, colors.avatarColor, dispatch]
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
    [accountColor, accountSymbol, webDataEnabled]
  );

  const updateWebShowcase = useCallback(
    async assetIds => {
      if (!webDataEnabled) return;
      setPreference(
        PreferenceActionType.update,
        'showcase',
        accountAddress,
        assetIds
      );
    },
    [accountAddress, webDataEnabled]
  );

  return {
    initWebData,
    updateWebProfile,
    updateWebShowcase,
    webDataEnabled,
    wipeWebData,
  };
}
