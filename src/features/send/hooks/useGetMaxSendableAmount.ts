import { useCallback } from 'react';

import type { ParsedAddressAsset } from '@/entities/tokens';
import type { UniqueAsset } from '@/entities/uniqueAssets';
import useGas from '@/features/gas/hooks/useGas';
import { assetIsUniqueAsset } from '@/handlers/web3';
import ethereumUtils from '@/utils/ethereumUtils';

export function useGetMaxSendableAmount() {
  const { selectedGasFee, l1GasFeeOptimism } = useGas();

  return useCallback(
    (
      asset: ParsedAddressAsset | UniqueAsset | undefined,
      { accountBalanceAmount, ignoreGasFee }: { accountBalanceAmount: string | undefined; ignoreGasFee: boolean }
    ) => {
      if (!asset || assetIsUniqueAsset(asset)) {
        return '0';
      }

      const currentBalanceAmount = accountBalanceAmount ?? ethereumUtils.getAccountAsset(asset.uniqueId)?.balance?.amount;
      const maxSendableAmount = ignoreGasFee
        ? (currentBalanceAmount ?? asset.balance?.amount ?? '0')
        : ethereumUtils.getBalanceAmount(selectedGasFee, asset, l1GasFeeOptimism, currentBalanceAmount);

      return maxSendableAmount;
    },
    [l1GasFeeOptimism, selectedGasFee]
  );
}
