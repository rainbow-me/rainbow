import * as i18n from '@/languages';
import React from 'react';
import Toast from './Toast';
import { useAccountSettings, useIsOffline } from '@/hooks';
import { ChainId } from '@/state/backendNetworks/types';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';
import { time } from '@/utils';

const OfflineToast = () => {
  const isOffline = useIsOffline({ debounceMs: time.seconds(0.5) });
  const { chainId } = useAccountSettings();
  const connectedToAnvil = useConnectedToAnvilStore(state => state.connectedToAnvil);
  const isMainnet = chainId === ChainId.mainnet && !connectedToAnvil;
  return <Toast icon="offline" isVisible={isOffline && isMainnet} text={i18n.t(i18n.l.button.offline)} />;
};

const neverRerender = () => true;
export default React.memo(OfflineToast, neverRerender);
