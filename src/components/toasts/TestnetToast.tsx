import React, { useEffect, useState } from 'react';

import { useNetInfo } from '@react-native-community/netinfo';

import { useColorMode } from '@/design-system';
import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import { ChainId } from '@/features/network/types/backendNetworks';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';
import { useTheme } from '@/theme/ThemeContext';

import { Icon } from '../icons';
import { Nbsp, Text } from '../text';
import Toast from './Toast';

const TestnetToast = ({ chainId }: { chainId: ChainId }) => {
  const { colors } = useTheme();
  const { isDarkMode } = useColorMode();
  const connectedToAnvil = useConnectedToAnvilStore(state => state.connectedToAnvil);
  const { isConnected } = useNetInfo();
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

  return (
    <Toast isVisible={visible} testID={`testnet-toast-${networkName}`} text={networkName}>
      <Icon color={color} marginHorizontal={5} marginTop={1} name="dot" />
      <Text color={colors.white} size="smedium" weight="semibold">
        <Nbsp /> {networkName} <Nbsp />
      </Text>
    </Toast>
  );
};

export default TestnetToast;
