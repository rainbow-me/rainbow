import React from 'react';
import { walletConnectDisconnectAllSessions } from '../../model/walletConnect';
import ButtonPressAnimation from '../animations/ButtonPressAnimation/ButtonPressAnimation';
import { Text } from '../text';
import BottomSpacer from './BottomSpacer';
import Lists from './ListsSection';
import PulseIndex from './PulseIndexSection';
// import Strategies from './StrategiesSection';
import TopMoversSection from './TopMoversSection';
import UniswapPools from './UniswapPoolsSection';
import { useAccountSettings } from '@rainbow-me/hooks';

export default function DiscoverHome() {
  const { accountAddress } = useAccountSettings();
  return (
    <React.Fragment>
      <TopMoversSection />
      <PulseIndex />
      <ButtonPressAnimation
        onPress={() => walletConnectDisconnectAllSessions()}
      >
        <Text>Disconnect all wallet connect</Text>
      </ButtonPressAnimation>
      <Lists />
      {/* <Strategies /> */}
      {accountAddress ? <UniswapPools /> : null}
      <BottomSpacer />
    </React.Fragment>
  );
}
