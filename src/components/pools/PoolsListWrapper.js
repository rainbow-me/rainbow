import React, { Fragment } from 'react';
import { useOpenInvestmentCards } from '../../hooks';
import { OpacityToggler } from '../animations';
import SavingsListHeader from '../savings/SavingsListHeader';

export default function PoolsListWrapper({ assets, totalValue = '0' }) {
  const {
    isInvestmentCardsOpen,
    toggleOpenInvestmentCards,
  } = useOpenInvestmentCards();

  console.log(assets);
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
        {/* {assets.map(renderSavingsListRow)} */}
      </OpacityToggler>
    </Fragment>
  );
}
