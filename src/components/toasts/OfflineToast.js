import lang from 'i18n-js';
import React from 'react';
import { web3Provider } from '../../handlers/web3';
import networkTypes from '../../helpers/networkTypes';
import Toast from './Toast';
import { useAccountSettings, useInternetStatus } from '@/hooks';

const OfflineToast = () => {
  const isConnected = useInternetStatus();
  const { network } = useAccountSettings();
  const providerUrl = web3Provider?.connection?.url;
  const isMainnet = network === networkTypes.mainnet && !providerUrl?.startsWith('http://');
  return <Toast icon="offline" isVisible={!isConnected && isMainnet} text={lang.t('button.offline')} />;
};

const neverRerender = () => true;
export default React.memo(OfflineToast, neverRerender);
