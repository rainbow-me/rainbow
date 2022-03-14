import React from 'react';
import BottomSpacer from './BottomSpacer';
import Lists from './ListsSection';
import PulseIndex from './PulseIndexSection';
import RegisterENS from './RegisterENSSection';
// import Strategies from './StrategiesSection';
import TopMoversSection from './TopMoversSection';
import UniswapPools from './UniswapPoolsSection';
import { useAccountSettings } from '@rainbow-me/hooks';

export default function DiscoverHome() {
  const { accountAddress } = useAccountSettings();
  return (
    <React.Fragment>
      <TopMoversSection />
      <RegisterENS />
      <PulseIndex />
      <Lists />
      {/* <Strategies /> */}
      {accountAddress ? <UniswapPools /> : null}
      <BottomSpacer />
    </React.Fragment>
  );
}
