import GraphemeSplitter from 'grapheme-splitter';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PreferenceActionType, setPreference } from '../model/preferences';
import useAccountProfile from './useAccountProfile';
import useAccountSettings from './useAccountSettings';
import { containsEmoji } from '@rainbow-me/helpers/strings';
import { updateWebDataEnabled } from '@rainbow-me/redux/showcaseTokens';

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
          accountSymbol: wipeNotEmoji(accountSymbol),
        }
      );

      dispatch(updateWebDataEnabled(true));
    },
    [accountAddress, accountColor, accountSymbol, colors.avatarColor, dispatch]
  );

  const wipeWebData = useCallback(async () => {
    if (!webDataEnabled) return;
    await setPreference(PreferenceActionType.wipe, 'showcase', accountAddress);
    await setPreference(PreferenceActionType.wipe, 'profile', accountAddress);
    dispatch(updateWebDataEnabled(false));
  }, [accountAddress, dispatch, webDataEnabled]);

  const updateWebProfile = useCallback(
    async (address, name, color) => {
      if (!webDataEnabled) return;
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
    [accountColor, accountSymbol, webDataEnabled]
  );

  const addAssetToWebShowcase = useCallback(
    async asset_id => {
      if (!webDataEnabled) return;
      setPreference(PreferenceActionType.update, 'showcase', accountAddress, [
        asset_id,
      ]);
    },
    [accountAddress, webDataEnabled]
  );

  const removeAssetFromWebShowcase = useCallback(
    async asset_id => {
      if (!webDataEnabled) return;
      setPreference(PreferenceActionType.remove, 'showcase', accountAddress, [
        asset_id,
      ]);
    },
    [accountAddress, webDataEnabled]
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
