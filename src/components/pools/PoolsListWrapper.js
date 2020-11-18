import { map } from 'lodash';
import React, { Fragment } from 'react';
import { useOpenInvestmentCards } from '../../hooks';
import { OpacityToggler } from '../animations';
import { UniswapInvestmentRow } from '../investment-cards';
import SavingsListHeader from '../savings/SavingsListHeader';

const renderInvestmentsListRow = item => (
  <UniswapInvestmentRow assetType="uniswap" item={item} key={item.uniqueId} />
);

export default function PoolsListWrapper({ data, totalValue = '0' }) {
  const {
    isInvestmentCardsOpen,
    toggleOpenInvestmentCards,
  } = useOpenInvestmentCards();

  return (
    <Fragment>
      <SavingsListHeader
        emoji="whale"
        isOpen={!!isInvestmentCardsOpen}
        onPress={toggleOpenInvestmentCards}
        savingsSumValue={totalValue}
        showSumValue
        title="Pools"
      />
      <OpacityToggler
        isVisible={!isInvestmentCardsOpen}
        pointerEvents={isInvestmentCardsOpen ? 'auto' : 'none'}
      >
        {map(data, renderInvestmentsListRow)}
      </OpacityToggler>
    </Fragment>
  );
}
