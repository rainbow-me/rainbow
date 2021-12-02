import {useOpenInvestmentCards, useOpenSavings} from "@rainbow-me/hooks";
import React, { Fragment } from 'react';


import SavingsListHeader from "../../savings/SavingsListHeader";

export default function WrappedPoolsListHeader({ value }) {
  const { isSavingsOpen, toggleOpenSavings } = useOpenSavings();
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
  )
}
