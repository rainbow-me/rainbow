import { useCallback, useState } from 'react';
import useGas from './useGas';
import { ethereumUtils } from '@/utils';

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
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string | number' is not assignab... Remove this comment to see the full error message
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
