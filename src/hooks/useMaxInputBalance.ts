import { useCallback, useState } from 'react';
import useGas from './useGas';
import { ethereumUtils } from '@/utils';
import { ParsedAddressAsset } from '@/entities';
import { convertStringToNumber } from '@/helpers/utilities';

export default function useMaxInputBalance() {
  const [maxInputBalance, setMaxInputBalance] = useState<number>(0);

  const { selectedGasFee, l1GasFeeOptimism } = useGas();

  const updateMaxInputBalance = useCallback(
    (inputCurrency: ParsedAddressAsset) => {
      // Update current balance
      const newInputBalance = ethereumUtils.getBalanceAmount(
        selectedGasFee,
        inputCurrency,
        l1GasFeeOptimism
      );

      const maxInputBalanceAsNumber = convertStringToNumber(newInputBalance);
      setMaxInputBalance(maxInputBalanceAsNumber);
      return maxInputBalanceAsNumber;
    },
    [l1GasFeeOptimism, selectedGasFee]
  );

  return {
    maxInputBalance,
    updateMaxInputBalance,
  };
}
