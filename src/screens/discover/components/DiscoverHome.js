import React from 'react';
import useExperimentalFlag, {
  OP_REWARDS,
  PROFILES,
} from '@rainbow-me/config/experimentalHooks';
import Lists from './ListsSection';
import { isTestnetNetwork } from '@/handlers/web3';
import { Inline, Inset, Stack } from '@/design-system';
import { useAccountAsset, useAccountSettings } from '@/hooks';
import { ETH_ADDRESS } from '@/references';
import { isZero } from '@/helpers/utilities';
import { ENSCreateProfileCard } from '@/components/cards/ENSCreateProfileCard';
import { ENSSearchCard } from '@/components/cards/ENSSearchCard';
import { DPICard } from '@/components/cards/DPICard';
import { GasCard } from '@/components/cards/GasCard';
import { LearnCard } from '@/components/cards/LearnCard';
import {
  avoidScamsCard,
  backupsCard,
  cryptoAndWalletsCard,
} from '@/components/cards/utils/constants';
import { OpRewardsCard } from '@/components/cards/OpRewardsCard';

export default function DiscoverHome() {
  const { network } = useAccountSettings();
  const accountAsset = useAccountAsset(ETH_ADDRESS);
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const optimismRewardsEnabled = useExperimentalFlag(OP_REWARDS);
  const testNetwork = isTestnetNetwork(network);

  return (
    <Inset top="20px" bottom={{ custom: 150 }}>
      <Stack space="20px">
        <Inset horizontal="20px">
          {profilesEnabled &&
          !testNetwork &&
          !isZero(accountAsset.balance.amount) ? (
            <Stack space="20px">
              <Inline space="20px">
                <GasCard />
                <ENSSearchCard />
              </Inline>
              {optimismRewardsEnabled && <OpRewardsCard />}
              <ENSCreateProfileCard />
              <Inline space="20px">
                <LearnCard cardDetails={backupsCard} type="square" />
                <LearnCard cardDetails={avoidScamsCard} type="square" />
              </Inline>
              <DPICard />
            </Stack>
          ) : (
            <Stack space="20px">
              <Inline space="20px">
                <GasCard />
                <LearnCard cardDetails={cryptoAndWalletsCard} type="square" />
              </Inline>
              <DPICard />
            </Stack>
          )}
        </Inset>
        <Lists />
      </Stack>
    </Inset>
  );
}
