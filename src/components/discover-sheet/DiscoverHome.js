import React from 'react';
import useExperimentalFlag, { PROFILES } from '../../config/experimentalHooks';
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
  const profilesEnabled = useExperimentalFlag(PROFILES);
  return (
    <React.Fragment>
      <TopMoversSection />
      {profilesEnabled && <RegisterENS />}
      <PulseIndex />
      <Lists />
      {/* <Strategies /> */}
      {accountAddress ? <UniswapPools /> : null}
      <BottomSpacer />
    </React.Fragment>
  );
}
