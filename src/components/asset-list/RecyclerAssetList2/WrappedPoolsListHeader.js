import React from 'react';

import SavingsListHeader from '../../savings/SavingsListHeader';
import { useOpenInvestmentCards } from '@rainbow-me/hooks';

export default function WrappedPoolsListHeader({ value }) {
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
}
