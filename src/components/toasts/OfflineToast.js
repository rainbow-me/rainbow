import React from 'react';
import { web3Provider } from '../../handlers/web3';
import networkTypes from '../../helpers/networkTypes';
import Toast from './Toast';
import { useAccountSettings, useInternetStatus } from '@rainbow-me/hooks';

const OfflineToast = () => {
  const isConnected = useInternetStatus();
  const { network } = useAccountSettings();
  const providerUrl = web3Provider?.connection?.url;
  const isMainnet =
    network === networkTypes.mainnet && !providerUrl?.startsWith('http://');
  return (
    <Toast
      icon="offline"
      isVisible={!isConnected && isMainnet}
      text="Offline"
    />
  );
};

const neverRerender = () => true;
export default React.memo(OfflineToast, neverRerender);
