import lang from 'i18n-js';
import React from 'react';
import Toast from './Toast';
import { useAccountSettings, useIsOffline } from '@/hooks';
import { ChainId } from '@/state/backendNetworks/types';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';
import { time } from '@/utils';

const OfflineToast = () => {
  "use no memo";
  
  const isOffline = useIsOffline({ debounceMs: time.seconds(0.5) });
  const { chainId } = useAccountSettings();
  const connectedToAnvil = useConnectedToAnvilStore(state => state.connectedToAnvil);
  const isMainnet = chainId === ChainId.mainnet && !connectedToAnvil;
  return <Toast icon="offline" isVisible={isOffline && isMainnet} text={lang.t('button.offline')} />;
};

const neverRerender = () => true;
export default React.memo(OfflineToast, neverRerender);
