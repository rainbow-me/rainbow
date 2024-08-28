import React, { useEffect, useState } from 'react';
import { Icon } from '../icons';
import { Nbsp, Text } from '../text';
import Toast from './Toast';
import { isHardHat } from '@/handlers/web3';
import { useInternetStatus } from '@/hooks';
import { getNetworkObject } from '@/networks';
import { ChainId } from '@/networks/types';
import { useConnectedToHardhatStore } from '@/state/connectedToHardhat';

const TestnetToast = ({ chainId }) => {
  const { connectedToHardhat } = useConnectedToHardhatStore();
  const isConnected = useInternetStatus();
  const { name, colors: networkColors } = getNetworkObject({ chainId });
  const [visible, setVisible] = useState(chainId !== ChainId.mainnet);
  const [networkName, setNetworkName] = useState(name);

  useEffect(() => {
    if (connectedToHardhat && chainId === ChainId.mainnet) {
      const networkObject = getNetworkObject({ chainId });
      const providerUrl = networkObject.rpc();
      if (isHardHat(providerUrl)) {
        setVisible(true);
        setNetworkName('Hardhat');
      } else {
        setVisible(false);
      }
    } else {
      setVisible(false);
      setNetworkName(name + (isConnected ? '' : ' (offline)'));
    }
  }, [name, isConnected, chainId, connectedToHardhat]);

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
