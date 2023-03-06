import React from 'react';
import useExperimentalFlag, {
  OP_REWARDS,
  PROFILES,
  HARDWARE_WALLETS,
} from '@rainbow-me/config/experimentalHooks';
import Lists from './ListsSection';
import { isTestnetNetwork } from '@/handlers/web3';
import { Inline, Inset, Stack } from '@/design-system';
import { useAccountSettings } from '@/hooks';
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
import { LedgerCard } from '@/components/cards/LedgerCard';
import config from '@/model/config';

export default function DiscoverHome() {
  const { network } = useAccountSettings();
  const profilesEnabledLocalFlag = useExperimentalFlag(PROFILES);
  const profilesEnabledRemoteFlag = config.profiles_enabled;
  const hardwareWalletsEnabled = useExperimentalFlag(HARDWARE_WALLETS);
  const opRewardsLocalFlag = useExperimentalFlag(OP_REWARDS);
  const opRewardsRemoteFlag = config.op_rewards_enabled;
  const testNetwork = isTestnetNetwork(network);
  const isProfilesEnabled =
    profilesEnabledLocalFlag && profilesEnabledRemoteFlag;

  return (
    <Inset top="20px" bottom={{ custom: 150 }}>
      <Stack space="20px">
        <Inset horizontal="20px">
          {!testNetwork ? (
            <Stack space="20px">
              <Inline space="20px">
                <GasCard />
                {isProfilesEnabled && <ENSSearchCard />}
              </Inline>
              {/* We have both flags here to be able to override the remote flag and show the card anyway in Dev*/}
              {(opRewardsRemoteFlag || opRewardsLocalFlag) && <OpRewardsCard />}
              {hardwareWalletsEnabled && <LedgerCard />}
              {isProfilesEnabled && <ENSCreateProfileCard />}
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
