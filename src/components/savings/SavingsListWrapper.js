import { map } from 'lodash';
import React, { Fragment } from 'react';
import { OpacityToggler } from '../animations';
import SavingsListHeader from './SavingsListHeader';
import SavingsListRow from './SavingsListRow';
import { useFrameDelayedValue, useOpenSavings } from '@rainbow-me/hooks';

const renderSavingsListRow = item =>
  item?.underlying ? (
    <SavingsListRow key={item?.underlying.symbol} {...item} />
  ) : null;

export default function SavingsListWrapper({ assets, totalValue = '0' }) {
  const { isSavingsOpen, toggleOpenSavings } = useOpenSavings();
  // wait until refresh of RLV
  const delayedIsSavingsOpen =
    useFrameDelayedValue(isSavingsOpen) && isSavingsOpen;
  return (
    <Fragment>
      <SavingsListHeader
        isOpen={isSavingsOpen}
        onPress={toggleOpenSavings}
        savingsSumValue={totalValue}
        showSumValue
      />
      <OpacityToggler
        isVisible={!delayedIsSavingsOpen}
        pointerEvents={isSavingsOpen ? 'auto' : 'none'}
      >
        {map(assets, renderSavingsListRow)}
      </OpacityToggler>
    </Fragment>
  );
}
