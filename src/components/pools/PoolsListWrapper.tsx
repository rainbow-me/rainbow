import { map } from 'lodash';
import React, { Fragment } from 'react';
import { OpacityToggler } from '../animations';
import { UniswapInvestmentRow } from '../investment-cards';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../savings/SavingsListHeader' was resolved... Remove this comment to see the full error message
import SavingsListHeader from '../savings/SavingsListHeader';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useOpenInvestmentCards } from '@rainbow-me/hooks';

const renderInvestmentsListRow = (item: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <UniswapInvestmentRow assetType="uniswap" item={item} key={item.uniqueId} />
);

export default function PoolsListWrapper({
  data,
  totalValue = '0',
  isCoinListEdited,
}: any) {
  const {
    isInvestmentCardsOpen,
    toggleOpenInvestmentCards,
  } = useOpenInvestmentCards();

  if (isCoinListEdited) {
    return null;
  }
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Fragment>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SavingsListHeader
        emoji="whale"
        isOpen={!!isInvestmentCardsOpen}
        onPress={toggleOpenInvestmentCards}
        savingsSumValue={totalValue}
        showSumValue
        title="Pools"
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <OpacityToggler
        isVisible={!isInvestmentCardsOpen}
        pointerEvents={isInvestmentCardsOpen ? 'auto' : 'none'}
      >
        {map(data, renderInvestmentsListRow)}
      </OpacityToggler>
    </Fragment>
  );
}
