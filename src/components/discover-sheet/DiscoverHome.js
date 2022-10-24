import React from 'react';
import BottomSpacer from './BottomSpacer';
import DPICard from './DPICard';
import ENSCreateProfileCard from './ENSCreateProfileCard';
import ENSSearchCard from './ENSSearchCard';
import GasCard from './GasCard';
import Lists from './ListsSection';
import UniswapPools from './UniswapPoolsSection';
import { isTestnetNetwork } from '@/handlers/web3';
import { Columns, Inset, Stack } from '@/design-system';
import { useAccountAsset, useAccountSettings, useDimensions } from '@/hooks';
import { ETH_ADDRESS } from '@/references';
import { isZero } from '@/helpers/utilities';
import LearnCard from '../cards/LearnCard';
import { learnCards } from '@/components/cards/constants';

export default function DiscoverHome() {
  const { accountAddress, network } = useAccountSettings();
  const accountAsset = useAccountAsset(ETH_ADDRESS);

  const isTestNetwork = isTestnetNetwork(network);

  const { width: deviceWidth } = useDimensions();

  const hasBalance = !isZero(accountAsset.balance.amount);
  return (
    <React.Fragment>
      <Inset top={{ custom: 16 }}>
        <Stack space="30px (Deprecated)">
          <Inset horizontal={ios && '19px (Deprecated)'}>
            <Stack space={ios && '19px (Deprecated)'}>
              <Columns space={ios && '19px (Deprecated)'}>
                <GasCard />
                {hasBalance && !isTestNetwork ? (
                  <ENSSearchCard />
                ) : (
                  <LearnCard
                    type="square"
                    cardDetails={learnCards(deviceWidth)[3]}
                  />
                )}
              </Columns>
              {hasBalance && !isTestNetwork && <ENSCreateProfileCard />}
              <DPICard />
            </Stack>
          </Inset>
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
