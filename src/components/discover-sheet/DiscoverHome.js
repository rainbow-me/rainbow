import React from 'react';
import useExperimentalFlag, {
  UNISWAP_POOLS,
} from '../../config/experimentalHooks';
import Lists from './ListsSection';
import PulseIndex from './PulseIndexSection';
// import Strategies from './StrategiesSection';
import TopMoversSection from './TopMoversSection';
import UniswapPools from './UniswapPoolsSection';

export default function DiscoverHome() {
  const showUniswapPools = useExperimentalFlag(UNISWAP_POOLS);
  return (
    <React.Fragment>
      <TopMoversSection />
      <Lists />
      <PulseIndex />
      {/* <Strategies /> */}
      {showUniswapPools && <UniswapPools />}
    </React.Fragment>
  );
}
