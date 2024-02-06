import { useCallback, useState } from 'react';
import useGas from './useGas';
import { ethereumUtils } from '@/utils';
import { ParsedAddressAsset } from '@/entities';

export default function useMaxInputBalance() {
  const [maxInputBalance, setMaxInputBalance] = useState<string>('0');

  const { selectedGasFee, l1GasFeeOptimism } = useGas();

  const updateMaxInputBalance = useCallback(
    (inputCurrency: ParsedAddressAsset) => {
      // Update current balance
      const newInputBalance = ethereumUtils.getBalanceAmount(selectedGasFee, inputCurrency, l1GasFeeOptimism);

      setMaxInputBalance(newInputBalance);
      return newInputBalance;
    },
    [l1GasFeeOptimism, selectedGasFee]
  );

  return {
    maxInputBalance,
    updateMaxInputBalance,
  };
}
