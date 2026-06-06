import { useCallback } from 'react';

import type { ParsedAddressAsset } from '@/entities/tokens';
import type { UniqueAsset } from '@/entities/uniqueAssets';
import useGas from '@/features/gas/hooks/useGas';
import { assetIsUniqueAsset } from '@/handlers/web3';
import ethereumUtils from '@/utils/ethereumUtils';

export function useMaxInputBalance() {
  const { selectedGasFee, l1GasFeeOptimism } = useGas();

  return useCallback(
    (inputCurrency: ParsedAddressAsset | UniqueAsset | undefined, options: { ignoreGasFee?: boolean }) => {
      if (!inputCurrency || assetIsUniqueAsset(inputCurrency)) {
        return '0';
      }

      const ignoreGasFee = options?.ignoreGasFee ?? false;
      const accountAsset = ethereumUtils.getAccountAsset(inputCurrency.uniqueId);
      const newInputBalance = ignoreGasFee
        ? (inputCurrency.balance?.amount ?? accountAsset?.balance?.amount ?? '0')
        : ethereumUtils.getBalanceAmount(selectedGasFee, inputCurrency, l1GasFeeOptimism);

      return newInputBalance;
    },
    [l1GasFeeOptimism, selectedGasFee]
  );
}
