import React from 'react';
import { web3Provider } from '../../handlers/web3';
import networkTypes from '../../helpers/networkTypes';
// @ts-expect-error ts-migrate(6142) FIXME: Module './Toast' was resolved to '/Users/nickbytes... Remove this comment to see the full error message
import Toast from './Toast';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAccountSettings, useInternetStatus } from '@rainbow-me/hooks';

const OfflineToast = () => {
  const isConnected = useInternetStatus();
  const { network } = useAccountSettings();
  const providerUrl = web3Provider?.connection?.url;
  const isMainnet =
    network === networkTypes.mainnet && !providerUrl?.startsWith('http://');
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Toast
      icon="offline"
      isVisible={!isConnected && isMainnet}
      text="Offline"
    />
  );
};

const neverRerender = () => true;
export default React.memo(OfflineToast, neverRerender);
