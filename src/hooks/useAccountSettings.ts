import { useCallback } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { type AppState } from '@/redux/store';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';

import { settingsChangeAppIcon as changeAppIcon, settingsChangeTestnetsEnabled as changeTestnetsEnabled } from '../redux/settings';

export default function useAccountSettings() {
  const dispatch = useDispatch();

  const testnetsEnabled = useConnectedToAnvilStore(state => state.connectedToAnvil);

  const settingsData = useSelector(({ settings: { appIcon, chainId, network } }: AppState) => ({
    appIcon,
    chainId,
    network,
    testnetsEnabled,
  }));

  const settingsChangeAppIcon = useCallback((appIcon: string) => dispatch(changeAppIcon(appIcon)), [dispatch]);

  const settingsChangeTestnetsEnabled = useCallback(
    (testnetsEnabled: boolean) => dispatch(changeTestnetsEnabled(testnetsEnabled)),
    [dispatch]
  );

  return {
    settingsChangeAppIcon,
    settingsChangeTestnetsEnabled,
    ...settingsData,
  };
}
