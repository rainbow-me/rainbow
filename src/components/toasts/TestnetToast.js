import React, { useEffect, useState } from 'react';
import networkInfo from '../../helpers/networkInfo';
import networkTypes from '../../helpers/networkTypes';
import { Icon } from '../icons';
import { Nbsp, Text } from '../text';
import Toast from './Toast';
import { isHardHat } from '@rainbow-me/handlers/web3';
import { useInternetStatus } from '@rainbow-me/hooks';

const TestnetToast = ({ network, web3Provider }) => {
  const isConnected = useInternetStatus();
  const providerUrl = web3Provider?.connection?.url;
  const { name, color } = networkInfo[network];
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

  const { colors } = useTheme();

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
