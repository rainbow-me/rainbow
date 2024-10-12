import lang from 'i18n-js';
import React from 'react';
import Toast from './Toast';
import { useAccountSettings, useInternetStatus } from '@/hooks';
import { ChainId } from '@/chains/types';
import { useConnectedToHardhatStore } from '@/state/connectedToHardhat';

const OfflineToast = () => {
  const isConnected = useInternetStatus();
  const { chainId } = useAccountSettings();
  const { connectedToHardhat } = useConnectedToHardhatStore;
  const isMainnet = chainId === ChainId.mainnet && !connectedToHardhat;
  return <Toast icon="offline" isVisible={!isConnected && isMainnet} text={lang.t('button.offline')} />;
};

const neverRerender = () => true;
export default React.memo(OfflineToast, neverRerender);
