import lang from 'i18n-js';
import React from 'react';
import networkTypes from '../../helpers/networkTypes';
import Toast from './Toast';
import {
  useAccountSettings,
  useInternetStatus,
  useProviderWithNetwork,
} from '@rainbow-me/hooks';

const OfflineToast = () => {
  const isConnected = useInternetStatus();
  const { network } = useAccountSettings();
  const provider = useProviderWithNetwork(network);
  const providerUrl = provider?.connection?.url;
  const isMainnet =
    network === networkTypes.mainnet && !providerUrl?.startsWith('http://');
  return (
    <Toast
      icon="offline"
      isVisible={!isConnected && isMainnet}
      text={lang.t('button.offline')}
    />
  );
};

const neverRerender = () => true;
export default React.memo(OfflineToast, neverRerender);
