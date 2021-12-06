import React, { useEffect, useState } from 'react';
import networkInfo from '../../helpers/networkInfo';
import networkTypes from '../../helpers/networkTypes';
import { Icon } from '../icons';
import { Nbsp, Text } from '../text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './Toast' was resolved to '/Users/nickbytes... Remove this comment to see the full error message
import Toast from './Toast';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/web3' or ... Remove this comment to see the full error message
import { isHardHat, web3Provider } from '@rainbow-me/handlers/web3';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAccountSettings, useInternetStatus } from '@rainbow-me/hooks';

const TestnetToast = () => {
  const isConnected = useInternetStatus();
  const { network } = useAccountSettings();
  const providerUrl = web3Provider?.connection?.url;
  const { name, color } = networkInfo[network];
  // @ts-expect-error ts-migrate(2367) FIXME: This condition will always return 'false' since th... Remove this comment to see the full error message
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

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Toast isVisible={visible} testID={`testnet-toast-${networkName}`}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Icon color={color} marginHorizontal={5} marginTop={5} name="dot" />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Text color={colors.white} size="smedium" weight="semibold">
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Nbsp /> {networkName} <Nbsp />
      </Text>
    </Toast>
  );
};

export default TestnetToast;
