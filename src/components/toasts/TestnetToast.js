import React, { useEffect, useState } from 'react';
import networkTypes from '../../helpers/networkTypes';
import { Icon } from '../icons';
import { Nbsp, Text } from '../text';
import Toast from './Toast';
import { isHardHat } from '@/handlers/web3';
import { useInternetStatus } from '@/hooks';
import { getNetworkObj } from '@/networks';

const TestnetToast = ({ network, web3Provider }) => {
  const isConnected = useInternetStatus();
  const providerUrl = web3Provider?.connection?.url;
  const { name, colors: networkColors } = getNetworkObj(network);
  const [visible, setVisible] = useState(!network === networkTypes.mainnet);
  const [networkName, setNetworkName] = useState(name);

  useEffect(() => {
    if (network === networkTypes.mainnet) {
      if (isHardHat(providerUrl)) {
        setVisible(true);
        setNetworkName('Hardhat');
      } else {
        setVisible(false);
      }
    } else {
      setVisible(true);
      setNetworkName(name + (isConnected ? '' : ' (offline)'));
    }
  }, [name, network, providerUrl, isConnected]);

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
