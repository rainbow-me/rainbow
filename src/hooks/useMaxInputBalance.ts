import { useCallback } from 'react';

import type { ParsedAddressAsset } from '@/entities/tokens';
import type { UniqueAsset } from '@/entities/uniqueAssets';
import useGas from '@/features/gas/hooks/useGas';
import { assetIsUniqueAsset } from '@/handlers/web3';
import ethereumUtils from '@/utils/ethereumUtils';

export function useMaxInputBalance() {
  const { selectedGasFee, l1GasFeeOptimism } = useGas();

  return useCallback(
    (inputCurrency: ParsedAddressAsset | UniqueAsset | undefined, options: { accountBalanceAmount?: string; ignoreGasFee?: boolean }) => {
      if (!inputCurrency || assetIsUniqueAsset(inputCurrency)) {
        return '0';
      }

      const ignoreGasFee = options.ignoreGasFee ?? false;
      const accountBalanceAmount = options.accountBalanceAmount ?? ethereumUtils.getAccountAsset(inputCurrency.uniqueId)?.balance?.amount;
      const newInputBalance = ignoreGasFee
        ? (accountBalanceAmount ?? inputCurrency.balance?.amount ?? '0')
        : ethereumUtils.getBalanceAmount(selectedGasFee, inputCurrency, l1GasFeeOptimism, accountBalanceAmount);

      return newInputBalance;
    },
    [l1GasFeeOptimism, selectedGasFee]
  );
}
