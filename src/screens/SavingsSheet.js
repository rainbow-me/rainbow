import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { Column, RowWithMargins } from '../components/layout';
import { borders, colors, padding, position } from '../styles';
import { SavingsCoinRow } from '../components/coin-row';
import { SavingsPredictionStepper, SavingsSheetHeader } from '../components/savings';
import { Sheet, SheetButton } from '../components/sheet';
import Divider from '../components/Divider';

const SavingsSheet = () => {
  return (
    <Sheet>
      <SavingsSheetHeader balance="$420.59" lifetimeAccruedInterest="$20.59" />
      <RowWithMargins css={padding(24, 15)} margin={15}>
        <SheetButton color={colors.dark} icon="minusCircled" label="Withdraw" />
        <SheetButton color={colors.dodgerBlue} icon="plusCircled" label="Deposit" />
      </RowWithMargins>
      <Divider />
      <Column paddingBottom={8}>
        <SavingsCoinRow item={{ name: 'Dai' }} />
        <SavingsCoinRow item={{ name: 'USD Coin' }} />
      </Column>
      <Divider />
      <SavingsPredictionStepper />
    </Sheet>
  );
};

SavingsSheet.propTypes = {

};

export default SavingsSheet;
