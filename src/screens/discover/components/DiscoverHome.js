import React from 'react';
import useExperimentalFlag, {
  PROFILES,
} from '@rainbow-me/config/experimentalHooks';
import BottomSpacer from './BottomSpacer';
import Lists from './ListsSection';
import TopMoversSection from './TopMoversSection';
import UniswapPools from '@/components/discover/UniswapPoolsSection';
import { isTestnetNetwork } from '@/handlers/web3';
import { Inline, Inset, Stack } from '@/design-system';
import { useAccountAsset, useAccountSettings } from '@/hooks';
import { ETH_ADDRESS } from '@/references';
import { isZero } from '@/helpers/utilities';
import {
  ENSCreateProfileCard,
  ENSSearchCard,
  DPICard,
  GasCard,
} from '@/components/cards';

export default function DiscoverHome() {
  const { accountAddress, network } = useAccountSettings();
  const accountAsset = useAccountAsset(ETH_ADDRESS);
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const testNetwork = isTestnetNetwork(network);

  return (
    <React.Fragment>
      <Inset top="20px">
        <Stack space="30px (Deprecated)">
          {profilesEnabled &&
          !testNetwork &&
          !isZero(accountAsset.balance.amount) ? (
            <Inset horizontal="20px">
              <Stack space="20px">
                <Inline space="20px">
                  <GasCard />
                  <ENSSearchCard />
                </Inline>
                <ENSCreateProfileCard />
                <DPICard />
              </Stack>
            </Inset>
          ) : (
            <Stack>
              <TopMoversSection />
              <Inset top="20px" horizontal="20px">
                <DPICard />
              </Inset>
            </Stack>
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
