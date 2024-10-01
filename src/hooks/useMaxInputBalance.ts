import { useCallback, useState } from 'react';
import useGas from './useGas';
import { ethereumUtils } from '@/utils';
import { ParsedAddressAsset, UniqueAsset } from '@/entities';

export default function useMaxInputBalance() {
  const [maxInputBalance, setMaxInputBalance] = useState<string>('0');

  const { selectedGasFee, l1GasFeeOptimism } = useGas();

  const updateMaxInputBalance = useCallback(
    (inputCurrency: ParsedAddressAsset | UniqueAsset | undefined) => {
      const isUniqueAssetOrUndefined = typeof inputCurrency === 'undefined' || 'collection' in inputCurrency;
      if (isUniqueAssetOrUndefined) {
        return '0';
      }
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
