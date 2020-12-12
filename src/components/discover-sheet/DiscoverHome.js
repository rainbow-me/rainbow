import React from 'react';
import PulseIndex from './PulseIndexSection';
import SearchHeader from './SearchHeader';
import Strategies from './StrategiesSection';
import TopMoversSection from './TopMoversSection';
import UniswapPools from './UniswapPoolsSection';

export default function DiscoverHome({ onSearchPress }) {
  return (
    <React.Fragment>
      <SearchHeader onPress={onSearchPress} />
      <TopMoversSection />
      <PulseIndex />
      <Strategies />
      <UniswapPools />
    </React.Fragment>
  );
}
