import React from 'react';
import BottomSpacer from './BottomSpacer';
import { Inline, Inset, Stack } from '@/design-system';
import { learnCards } from '@/components/cards/utils/constants';
import {
  ActionCard,
  DPICard,
  ENSCreateProfileCard,
  ENSSearchCard,
  GasCard,
  LearnCard,
} from '@/components/cards';

export default function DiscoverHome() {
  return (
    <React.Fragment>
      <Inset space="20px">
        <Stack space="20px">
          <ENSCreateProfileCard />
          <Inline space="20px">
            <GasCard />
            <ENSSearchCard />
          </Inline>
          <DPICard />
          <LearnCard cardDetails={learnCards[0]} type="stretch" />
          <Inline space="20px">
            <ActionCard
              colorway="green"
              sfSymbolIcon="􀅼"
              title="Buy Crypto with Cash"
              onPress={() => {}}
            />
            <LearnCard cardDetails={learnCards[2]} type="square" />
          </Inline>
        </Stack>
      </Inset>
      <BottomSpacer />
    </React.Fragment>
  );
}
