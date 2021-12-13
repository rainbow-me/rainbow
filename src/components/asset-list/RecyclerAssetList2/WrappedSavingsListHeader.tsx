import React from 'react';

import { SavingsListHeader } from '../../savings';
import { useOpenSavings } from '@rainbow-me/hooks';

export default React.memo(function WrappedSavingsListHeader({
  value,
}: {
  value: string;
}) {
  const { isSavingsOpen, toggleOpenSavings } = useOpenSavings();
  return (
    <SavingsListHeader
      isOpen={isSavingsOpen}
      onPress={toggleOpenSavings}
      savingsSumValue={value}
      showSumValue
    />
  );
});
