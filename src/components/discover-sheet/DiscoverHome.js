import React from 'react';
import BottomSpacer from './BottomSpacer';
import Lists from './ListsSection';
import PulseIndex from './PulseIndexSection';
// import Strategies from './StrategiesSection';
import TopMoversSection from './TopMoversSection';
import UniswapPools from './UniswapPoolsSection';

export default function DiscoverHome() {
  return (
    <React.Fragment>
      <TopMoversSection />
      <Lists />
      <PulseIndex />
      {/* <Strategies /> */}
      <UniswapPools />
      <BottomSpacer />
    </React.Fragment>
  );
}
