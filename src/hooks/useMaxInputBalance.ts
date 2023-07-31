import { useCallback, useState } from 'react';
import useGas from './useGas';
import { ethereumUtils } from '@/utils';
import { ParsedAddressAsset } from '@/entities';

export default function useMaxInputBalance() {
  const [maxInputBalance, setMaxInputBalance] = useState(0);

  const { selectedGasFee, l1GasFeeOptimism } = useGas();

  const updateMaxInputBalance = useCallback(
    (inputCurrency: ParsedAddressAsset) => {
      // Update current balance
      const newInputBalance = ethereumUtils.getBalanceAmount(
        selectedGasFee,
        inputCurrency,
        l1GasFeeOptimism
      );
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string | number' is not assignab... Remove this comment to see the full error message
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
