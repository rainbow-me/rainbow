import React from 'react';
import Lists from './ListsSection';
import PulseIndex from './PulseIndexSection';
// import Strategies from './StrategiesSection';
import TopMoversSection from './TopMoversSection';
import UniswapPools from './UniswapPoolsSection';
import WalletConnectSection from './WalletConnectSection';

export default function DiscoverHome() {
  return (
    <React.Fragment>
      <TopMoversSection />
      <Lists />
      <PulseIndex />
      <WalletConnectSection />
      {/* <Strategies /> */}
      <UniswapPools />
    </React.Fragment>
  );
}
