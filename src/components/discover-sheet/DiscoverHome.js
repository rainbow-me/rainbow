import React from 'react';
import URL from 'url-parse';
import { walletConnectDisconnectAllSessions } from '../../model/walletConnect';
import ButtonPressAnimation from '../animations/ButtonPressAnimation/ButtonPressAnimation';
import ConnectedDapps from '../qrcode-scanner/ConnectedDapps';
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

  const pars = new URL(
    'wc:c21721b1-6f87-42c3-8f45-b1ed7f82cf9f@1?bridge=https%3A%2F%2Fbridge.walletconnect.org&key=ccc668510955f8defa664335267a8d4f404dad4592ef587214ba636e40f341ae'
  );
  console.log('pars', pars.pathname);
  return (
    <React.Fragment>
      <TopMoversSection />
      <PulseIndex />
      <ConnectedDapps />
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
