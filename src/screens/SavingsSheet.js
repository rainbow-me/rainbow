import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { Column } from '../components/layout';
import { borders, colors, padding, position } from '../styles';
import { SavingsCoinRow } from '../components/coin-row';
import {
  SavingsPredictionStepper,
  SavingsSheetHeader,
} from '../components/savings';
import {
  FloatingEmojis,
  FloatingEmojisTapHandler,
} from '../components/floating-emojis';
import { Sheet, SheetButton, SheetButtonRow } from '../components/sheet';
import Divider from '../components/Divider';
import { useSavingsAccount } from '../hooks';

const SavingsSheet = () => {
  const savings = useSavingsAccount();
  console.log('savings', savings);

  return (
    <Sheet>
      <SavingsSheetHeader balance="$420.59" lifetimeAccruedInterest="$20.59" />
      <SheetButtonRow>
        <SheetButton color={colors.dark} icon="minusCircled" label="Withdraw" />
        <SheetButton
          color={colors.dodgerBlue}
          icon="plusCircled"
          label="Deposit"
        />
      </SheetButtonRow>
      <Divider zIndex={0} />
      <FloatingEmojis
        distance={350}
        duration={2000}
        emoji="money_mouth_face"
        size={36}
        wiggleFactor={1}
      >
        {({ onNewEmoji }) => (
          <FloatingEmojisTapHandler onNewEmoji={onNewEmoji}>
            <Column paddingBottom={8}>
              {savings.map(({ name, symbol, ...item }) => (
                <SavingsCoinRow
                  item={{
                    ...item,
                    name: name.replace('Compound ', ''),
                    symbol: symbol.substr(1),
                  }}
                  key={get(item, 'cTokenAddress')}
                />
              ))}
            </Column>
          </FloatingEmojisTapHandler>
        )}
      </FloatingEmojis>
      <Divider zIndex={0} />
      <SavingsPredictionStepper />
    </Sheet>
  );
};

SavingsSheet.propTypes = {
  //
};

export default SavingsSheet;
