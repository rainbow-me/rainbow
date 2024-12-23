import React, { useEffect, useState } from 'react';
import { Icon } from '../icons';
import { Nbsp, Text } from '../text';
import Toast from './Toast';
import { useInternetStatus } from '@/hooks';
import { ChainId } from '@/state/backendNetworks/types';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

const TestnetToast = ({ chainId }) => {
  const { connectedToAnvil } = useConnectedToAnvilStore();
  const isConnected = useInternetStatus();
  const nativeAsset = useBackendNetworksStore.getState().getChainsNativeAsset()[chainId];
  const name = useBackendNetworksStore.getState().getChainsName()[chainId];
  const color = isDarkMode ? nativeAsset.colors.primary : nativeAsset.colors.fallback || nativeAsset.colors.primary;
  const [visible, setVisible] = useState(chainId !== ChainId.mainnet);
  const [networkName, setNetworkName] = useState(name);

  useEffect(() => {
    if (chainId === ChainId.mainnet) {
      if (connectedToAnvil) {
        setVisible(true);
        setNetworkName('Anvil');
      } else {
        setVisible(false);
      }
    } else {
      setVisible(true);
      setNetworkName(name + (isConnected ? '' : ' (offline)'));
    }
  }, [isConnected, chainId, connectedToAnvil, name]);

  const { colors, isDarkMode } = useTheme();

  return (
    <Toast isVisible={visible} testID={`testnet-toast-${networkName}`}>
      <Icon color={color} marginHorizontal={5} marginTop={1} name="dot" />
      <Text color={colors.white} size="smedium" weight="semibold">
        <Nbsp /> {networkName} <Nbsp />
      </Text>
    </Toast>
  );
};

export default TestnetToast;
