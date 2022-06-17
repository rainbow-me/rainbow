import React from 'react';
import useExperimentalFlag, { PROFILES } from '../../config/experimentalHooks';
import BottomSpacer from './BottomSpacer';
import DPICard from './DPICard';
import ENSCreateProfileCard from './ENSCreateProfileCard';
import ENSSearchCard from './ENSSearchCard';
import GasCard from './GasCard';
import Lists from './ListsSection';
import PulseIndex from './PulseIndexSection';
import TopMoversSection from './TopMoversSection';
import UniswapPools from './UniswapPoolsSection';
import { Columns, Inset, Stack } from '@rainbow-me/design-system';
import { useAccountSettings } from '@rainbow-me/hooks';

export default function DiscoverHome() {
  const { accountAddress } = useAccountSettings();
  const profilesEnabled = useExperimentalFlag(PROFILES);
  return (
    <React.Fragment>
      <Inset top={{ custom: 16 }}>
        <Stack space="30px">
          {profilesEnabled ? (
            <Inset horizontal="19px">
              <Stack space="19px">
                <Columns space="19px">
                  <GasCard />
                  <ENSSearchCard />
                </Columns>
                <ENSCreateProfileCard />
                <DPICard />
              </Stack>
            </Inset>
          ) : (
            <Stack space={{ custom: 21 }}>
              <TopMoversSection />
              <PulseIndex />
            </Stack>
          )}
          <Stack space="30px">
            <Lists />
            {accountAddress ? <UniswapPools /> : null}
          </Stack>
        </Stack>
      </Inset>
      <BottomSpacer />
    </React.Fragment>
  );
}
