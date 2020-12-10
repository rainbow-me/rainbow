import { map } from 'lodash';
import React, { Fragment } from 'react';
import { useOpenSavings } from '../../hooks';
import { OpacityToggler } from '../animations';
import SavingsListHeader from './SavingsListHeader';
import SavingsListRow from './SavingsListRow';

const renderSavingsListRow = item =>
  item?.underlying ? (
    <SavingsListRow key={item?.underlying.symbol} {...item} />
  ) : null;

export default function SavingsListWrapper({ assets, totalValue = '0' }) {
  const { isSavingsOpen, toggleOpenSavings } = useOpenSavings();

  return (
    <Fragment>
      <SavingsListHeader
        isOpen={isSavingsOpen}
        onPress={toggleOpenSavings}
        savingsSumValue={totalValue}
        showSumValue
      />
      <OpacityToggler
        isVisible={!isSavingsOpen}
        pointerEvents={isSavingsOpen ? 'auto' : 'none'}
      >
        {map(assets, renderSavingsListRow)}
      </OpacityToggler>
    </Fragment>
  );
}
