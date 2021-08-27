import React from 'react';
import BottomSpacer from './BottomSpacer';
import Lists from './ListsSection';
import PulseIndex from './PulseIndexSection';
// import Strategies from './StrategiesSection';
import TopMoversSection from './TopMoversSection';
import UniswapPools from './UniswapPoolsSection';
import { useAccountSettings } from '@rainbow-me/hooks';

const DiscoverHome = () => {
  const { accountAddress } = useAccountSettings();
  return (
    <React.Fragment>
      <TopMoversSection />
      <PulseIndex />
      <Lists />
      {/* <Strategies /> */}
      {accountAddress ? <UniswapPools /> : null}
      <BottomSpacer />
    </React.Fragment>
  );
};

export default React.memo(DiscoverHome);
