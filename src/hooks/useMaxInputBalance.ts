import { useCallback, useState } from 'react';
import useGas from './useGas';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { ethereumUtils } from '@rainbow-me/utils';

export default function useMaxInputBalance() {
  const [maxInputBalance, setMaxInputBalance] = useState(0);

  const { selectedGasFee } = useGas();

  const updateMaxInputBalance = useCallback(
    inputCurrency => {
      // Update current balance
      const newInputBalance = ethereumUtils.getBalanceAmount(
        selectedGasFee,
        inputCurrency
      );
      setMaxInputBalance(newInputBalance);
      return newInputBalance;
    },
    [selectedGasFee]
  );

  return {
    maxInputBalance,
    updateMaxInputBalance,
  };
}
