import { useCallback, useState } from 'react';
import useGas from './useGas';
import { ethereumUtils } from '@rainbow-me/utils';

export default function useMaxInputBalance() {
  const [maxInputBalance, setMaxInputBalance] = useState(0);

  const { selectedGasPrice } = useGas();

  const updateMaxInputBalance = useCallback(
    inputCurrency => {
      // Update current balance
      const newInputBalance = ethereumUtils.getBalanceAmount(
        selectedGasPrice,
        inputCurrency
      );
      setMaxInputBalance(newInputBalance);
      return newInputBalance;
    },
    [selectedGasPrice]
  );

  return {
    maxInputBalance,
    updateMaxInputBalance,
  };
}
