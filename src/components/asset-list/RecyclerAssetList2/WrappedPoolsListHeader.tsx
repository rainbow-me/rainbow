import React from 'react';

import { SavingsListHeader } from '../../savings';
import { useOpenInvestmentCards } from '@rainbow-me/hooks';

export default React.memo(function WrappedPoolsListHeader({
  value,
}: {
  value: string;
}) {
  const {
    isInvestmentCardsOpen,
    toggleOpenInvestmentCards,
  } = useOpenInvestmentCards();

  return (
    <SavingsListHeader
      emoji="whale"
      isOpen={!!isInvestmentCardsOpen}
      onPress={toggleOpenInvestmentCards}
      savingsSumValue={value}
      showSumValue
      title="Pools"
    />
  );
});
