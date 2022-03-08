import { map } from 'lodash';
import React, { Fragment } from 'react';
import { OpacityToggler } from '../animations';
import { UniswapInvestmentRow } from '../investment-cards';
import SavingsListHeader from '../savings/SavingsListHeader';
import { isTestnetNetwork } from '@rainbow-me/handlers/web3';
import { useAccountSettings, useOpenInvestmentCards } from '@rainbow-me/hooks';

const renderInvestmentsListRow = item => (
  <UniswapInvestmentRow assetType="uniswap" item={item} key={item.uniqueId} />
);

export default function PoolsListWrapper({
  data,
  totalValue = '0',
  isCoinListEdited,
}) {
  const {
    isInvestmentCardsOpen,
    toggleOpenInvestmentCards,
  } = useOpenInvestmentCards();

  const { network } = useAccountSettings();

  if (isCoinListEdited || isTestnetNetwork(network)) return null;
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
