import { isString } from 'lodash';
import { useCallback, useMemo } from 'react';
import { Linking } from 'react-native';
import useAccountSettings from './useAccountSettings';
import { ethereumUtils } from '@rainbow-me/utils';

export default function useEtherscan() {
  const { network } = useAccountSettings();
  const etherscanHost = useMemo(
    () => ethereumUtils.getEtherscanHostFromNetwork(network),
    [network]
  );

  const openTokenEtherscanURL = useCallback(
    address => {
      if (!isString(address)) return;
      Linking.openURL(`https://${etherscanHost}/token/${address}`);
    },
    [etherscanHost]
  );

  const openTransactionEtherscanURL = useCallback(
    hash => {
      if (!isString(hash)) return;
      const normalizedHash = hash.replace(/-.*/g, '');
      Linking.openURL(`https://${etherscanHost}/tx/${normalizedHash}`);
    },
    [etherscanHost]
  );

  return {
    openTokenEtherscanURL,
    openTransactionEtherscanURL,
  };
}
