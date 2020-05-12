import { useCallback, useState } from 'react';
import { ethereumUtils } from '../utils';
import useGas from './useGas';

export default function useMaxInputBalance() {
  const [maxInputBalance, setMaxInputBalance] = useState(0);

  const { selectedGasPrice } = useGas();

  const updateMaxInputBalance = useCallback(
    async inputCurrency => {
      // Update current balance
      const newInputBalance = await ethereumUtils.getBalanceAmount(
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
