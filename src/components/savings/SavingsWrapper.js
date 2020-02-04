import { get } from 'lodash';
import React from 'react';
import { useNavigation } from 'react-navigation-hooks';
import { useSavingsAccount } from '../../hooks';
import { colors } from '../../styles';
import { Column } from '../layout';
import { SavingsCoinRow } from '../coin-row';
import { Sheet, SheetButton, SheetButtonRow } from '../sheet';
import Divider from '../Divider';

function SavingsWrapper() {
  const { navigate } = useNavigation();
  const savings = useSavingsAccount();

  console.log('savings', savings);

  return (
    <Column>
    </Column>
  );
}

export default React.memo(SavingsWrapper);
