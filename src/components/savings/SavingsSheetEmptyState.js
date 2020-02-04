import { get } from 'lodash';
import React from 'react';
import { useNavigation } from 'react-navigation-hooks';
import { useQuery } from '@apollo/client';
import { COMPOUND_CDAI_SUPPLY_RATE } from '../../apollo/queries';
import { colors } from '../../styles';
import { Centered, Column, ColumnWithMargins } from '../layout';
import { Sheet, SheetButton, SheetButtonRow } from '../sheet';
import { CoinIcon } from '../coin-icon';
import Divider from '../Divider';

import { Br, Text } from '../text';
import { useSavingsAccount } from '../../hooks';

const SavingSheetEmptyState = () => {
  const supplyRate = useQuery(COMPOUND_CDAI_SUPPLY_RATE);

  console.log('supplyRate', supplyRate);

  return (
    <Centered direction="column">
      <CoinIcon symbol="DAI" />
      <Text>Get 7.5% on your dollars</Text>
      <Text>
        With digital dollars like Dai, saving <Br />
        earns you more than ever before
      </Text>
      <Divider />
      <ColumnWithMargins margin={10}>
        <Text>Deposit from wallet</Text>
        <Text>Deposit from apple pay bitchhhh</Text>
      </ColumnWithMargins>
    </Centered>
  );
}

SavingSheetEmptyState.propTypes = {
  //
};

export default SavingSheetEmptyState;
