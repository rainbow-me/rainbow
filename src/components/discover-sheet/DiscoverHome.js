import React from 'react';
import useExperimentalFlag, { PROFILES } from '../../config/experimentalHooks';
import BottomSpacer from './BottomSpacer';
import { DPICard } from '../cards/DPICard';
import ENSCreateProfileCard from './ENSCreateProfileCard';
import ENSSearchCard from './ENSSearchCard';
import { ENSSearchCard as X } from '../cards/ENSSearchCard';
import GasCard from './GasCard';
import Lists from './ListsSection';
import TopMoversSection from './TopMoversSection';
import UniswapPools from './UniswapPoolsSection';
import { isTestnetNetwork } from '@/handlers/web3';
import { Columns, Inline, Inset, Stack } from '@/design-system';
import { useAccountAsset, useAccountSettings } from '@/hooks';
import { ETH_ADDRESS } from '@/references';
import { isZero } from '@/helpers/utilities';
import { LearnCard } from '../cards/LearnCard';
import { learnCards } from '../cards/utils/constants';
import { ActionCard } from '../cards/ActionCard';

export default function DiscoverHome() {
  const { accountAddress, network } = useAccountSettings();
  const accountAsset = useAccountAsset(ETH_ADDRESS);
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const testNetwork = isTestnetNetwork(network);
  return (
    <React.Fragment>
      <Inset top={{ custom: 16 }}>
        <Stack space="30px (Deprecated)">
          {false ? (
            <Inset horizontal={ios && '19px (Deprecated)'}>
              <Stack space={ios && '19px (Deprecated)'}>
                <Columns space={ios && '19px (Deprecated)'}>
                  <GasCard />
                  <ENSSearchCard />
                </Columns>
                <ENSCreateProfileCard />
                <LearnCard cardDetails={learnCards[0]} type="stretch" />
                <Inline space="20px">
                  <LearnCard cardDetails={learnCards[1]} type="square" />
                  <LearnCard cardDetails={learnCards[2]} type="square" />
                </Inline>
                <DPICard />
              </Stack>
            </Inset>
          ) : (
            <Inset horizontal="20px">
              <Stack space="20px">
                <TopMoversSection />
                <Inline space="20px">
                  <X />
                  <X />
                </Inline>
                <DPICard />
                <LearnCard cardDetails={learnCards[0]} type="stretch" />
                <Inline space="20px">
                  <LearnCard cardDetails={learnCards[1]} type="square" />
                  <LearnCard cardDetails={learnCards[2]} type="square" />
                </Inline>
              </Stack>
            </Inset>
          )}
          <Stack space="30px (Deprecated)">
            <Lists />
            {accountAddress ? <UniswapPools /> : null}
          </Stack>
        </Stack>
      </Inset>
      <BottomSpacer />
    </React.Fragment>
  );
}
