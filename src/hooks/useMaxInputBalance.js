import { useCallback, useState } from 'react';
import { ethereumUtils } from '../utils';

export default function useMaxInputBalance() {
  const [inputBalance, setInputBalance] = useState(null);

  const updateInputBalance = useCallback(
    async (inputCurrency, selectedGasPrice) => {
      // Update current balance
      const newInputBalance = await ethereumUtils.getBalanceAmount(
        selectedGasPrice,
        inputCurrency
      );
      setInputBalance(newInputBalance);
    },
    []
  );

  return {
    inputBalance,
    updateInputBalance,
  };
}
