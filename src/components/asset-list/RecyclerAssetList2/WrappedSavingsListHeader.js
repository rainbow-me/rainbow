import {useOpenSavings} from "@rainbow-me/hooks";
import React, { Fragment } from 'react';


import SavingsListHeader from "../../savings/SavingsListHeader";

export default function WrappedSavingsListHeader({ value }) {
  const { isSavingsOpen, toggleOpenSavings } = useOpenSavings();
  return (
    <SavingsListHeader
      isOpen={isSavingsOpen}
      onPress={toggleOpenSavings}
      savingsSumValue={value}
      showSumValue
    />
  )
}
