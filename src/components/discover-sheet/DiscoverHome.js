import React from 'react';
import GasSection from './GasSection';
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
      <GasSection />
      <UniswapPools />
    </React.Fragment>
  );
}
