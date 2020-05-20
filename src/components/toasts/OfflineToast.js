import React from 'react';
import { useInternetStatus } from '../../hooks';
import Toast from './Toast';

const OfflineToast = () => {
  const isConnected = useInternetStatus();
  return <Toast icon="offline" isVisible={isConnected} text="Offline" />;
};

const neverRerender = () => true;
export default React.memo(OfflineToast, neverRerender);
