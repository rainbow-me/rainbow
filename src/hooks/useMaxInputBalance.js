import { useCallback, useState } from 'react';
import useGas from './useGas';
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
