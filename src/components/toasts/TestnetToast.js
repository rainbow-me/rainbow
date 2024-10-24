import React, { useEffect, useState } from 'react';
import { Icon } from '../icons';
import { Nbsp, Text } from '../text';
import Toast from './Toast';
import { useInternetStatus } from '@/hooks';
import { ChainId } from '@/chains/types';
import { useConnectedToHardhatStore } from '@/state/connectedToHardhat';
import { getChainsName, getChainsNativeAsset } from '@/chains';

const TestnetToast = ({ chainId }) => {
  const { connectedToHardhat } = useConnectedToHardhatStore();
  const isConnected = useInternetStatus();
  const nativeAsset = getChainsNativeAsset()[chainId];
  const name = getChainsName()[chainId];
  const color = isDarkMode ? nativeAsset.colors.primary : nativeAsset.colors.fallback || nativeAsset.colors.primary;
  const [visible, setVisible] = useState(chainId !== ChainId.mainnet);
  const [networkName, setNetworkName] = useState(name);

  useEffect(() => {
    if (chainId === ChainId.mainnet) {
      if (connectedToHardhat) {
        setVisible(true);
        setNetworkName('Hardhat');
      } else {
        setVisible(false);
      }
    } else {
      setVisible(true);
      setNetworkName(name + (isConnected ? '' : ' (offline)'));
    }
  }, [isConnected, chainId, connectedToHardhat, name]);

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
