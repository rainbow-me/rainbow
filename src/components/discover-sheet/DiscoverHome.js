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
import { isTestnetNetwork } from '@/handlers/web3';
import { Columns, Inset, Stack } from '@/design-system';
import { useAccountSettings } from '@/hooks';

export default function DiscoverHome() {
  const { accountAddress, network } = useAccountSettings();
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const testNetwork = isTestnetNetwork(network);
  return (
    <React.Fragment>
      <Inset top={{ custom: 16 }}>
        <Stack space="30px">
          {profilesEnabled && !testNetwork ? (
            <Inset horizontal={ios && '19px'}>
              <Stack space={ios && '19px'}>
                <Columns space={ios && '19px'}>
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
