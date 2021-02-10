import React from 'react';
import GasSection from './GasSection';
import Lists from './ListsSection';
import PulseIndex from './PulseIndexSection';
// import Strategies from './StrategiesSection';
import TopMoversSection from './TopMoversSection';
import UniswapPools from './UniswapPoolsSection';
import { web3Provider } from '@rainbow-me/handlers/web3';
import { useAccountSettings } from '@rainbow-me/hooks';
import networkTypes from '@rainbow-me/networkTypes';

export default function DiscoverHome() {
  const { network } = useAccountSettings();
  const providerUrl = web3Provider?.connection?.url;
  const isMainnet =
    network === networkTypes.mainnet && !providerUrl?.startsWith('http://');
  return (
    <React.Fragment>
      <TopMoversSection />
      <Lists />
      <PulseIndex />
      {/* <Strategies /> */}
      {isMainnet && <GasSection />}
      <UniswapPools />
    </React.Fragment>
  );
}
