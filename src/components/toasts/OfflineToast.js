import lang from 'i18n-js';
import React from 'react';
import Toast from './Toast';
import { useAccountSettings, useInternetStatus } from '@/hooks';
import { ChainId } from '@/state/backendNetworks/types';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';

const OfflineToast = () => {
  const isConnected = useInternetStatus();
  const { chainId } = useAccountSettings();
  const { connectedToAnvil } = useConnectedToAnvilStore();
  const isMainnet = chainId === ChainId.mainnet && !connectedToAnvil;
  return <Toast icon="offline" isVisible={!isConnected && isMainnet} text={lang.t('button.offline')} />;
};

const neverRerender = () => true;
export default React.memo(OfflineToast, neverRerender);
