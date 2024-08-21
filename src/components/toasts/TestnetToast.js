import React, { useEffect, useState } from 'react';
import { Icon } from '../icons';
import { Nbsp, Text } from '../text';
import Toast from './Toast';
import { useInternetStatus } from '@/hooks';
import { ChainId } from '@/networks/types';
import { useConnectedToHardhatStore } from '@/state/connectedToHardhat';
import { networkObjects } from '@/networks';
import { SUPPORTED_CHAINS } from '@/networks/chains';

const TestnetToast = ({ chainId }) => {
  const { connectedToHardhat } = useConnectedToHardhatStore();
  const isConnected = useInternetStatus();
  const networkObject = networkObjects[chainId || ChainId.mainnet];
  const { name, colors: networkColors } = networkObject;
  const [visible, setVisible] = useState(true);
  const [networkName, setNetworkName] = useState(name);
  const chain = SUPPORTED_CHAINS[chainId || ChainId.mainnet];

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
  }, [name, isConnected, chainId, connectedToHardhat, chain.rpcUrls.default.http, networkObject.rpc]);

  const { colors, isDarkMode } = useTheme();

  return (
    <Toast isVisible={visible} testID={`testnet-toast-${networkName}`}>
      <Icon color={isDarkMode ? networkColors.dark : networkColors.light} marginHorizontal={5} marginTop={1} name="dot" />
      <Text color={colors.white} size="smedium" weight="semibold">
        <Nbsp /> {networkName} <Nbsp />
      </Text>
    </Toast>
  );
};

export default TestnetToast;
