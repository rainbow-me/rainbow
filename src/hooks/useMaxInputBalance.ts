import { useCallback, useState } from 'react';

import type { ParsedAddressAsset } from '@/entities/tokens';
import type { UniqueAsset } from '@/entities/uniqueAssets';
import useGas from '@/features/gas/hooks/useGas';
import { assetIsUniqueAsset } from '@/handlers/web3';
import ethereumUtils from '@/utils/ethereumUtils';

export default function useMaxInputBalance() {
  const [maxInputBalance, setMaxInputBalance] = useState<string>('0');

  const { selectedGasFee, l1GasFeeOptimism } = useGas();

  const updateMaxInputBalance = useCallback(
    (inputCurrency: ParsedAddressAsset | UniqueAsset | undefined) => {
      if (!inputCurrency || assetIsUniqueAsset(inputCurrency)) {
        return '0';
      }

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
