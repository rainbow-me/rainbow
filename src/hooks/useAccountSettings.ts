import { useCallback } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { type AppState } from '@/redux/store';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';

import { settingsChangeTestnetsEnabled as changeTestnetsEnabled } from '../redux/settings';

export default function useAccountSettings() {
  const dispatch = useDispatch();

  const testnetsEnabled = useConnectedToAnvilStore(state => state.connectedToAnvil);

  const settingsData = useSelector(({ settings: { chainId, network } }: AppState) => ({
    chainId,
    network,
    testnetsEnabled,
  }));

  const settingsChangeTestnetsEnabled = useCallback(
    (testnetsEnabled: boolean) => dispatch(changeTestnetsEnabled(testnetsEnabled)),
    [dispatch]
  );

  return {
    settingsChangeTestnetsEnabled,
    ...settingsData,
  };
}
