import { useCallback, useState } from 'react';

import type { ParsedAddressAsset } from '@/entities/tokens';
import type { UniqueAsset } from '@/entities/uniqueAssets';
import useGas from '@/features/gas/hooks/useGas';
import { assetIsUniqueAsset } from '@/handlers/web3';
import ethereumUtils from '@/utils/ethereumUtils';

export function useMaxSendableBalance({ ignoreGasFee = false }: { ignoreGasFee?: boolean } = {}) {
  const [maxSendableBalance, setMaxSendableBalance] = useState<string>('0');

  const { selectedGasFee, l1GasFeeOptimism } = useGas();

  const updateMaxSendableBalance = useCallback(
    (asset: ParsedAddressAsset | UniqueAsset | undefined) => {
      if (!asset || assetIsUniqueAsset(asset)) {
        return '0';
      }

      const accountAsset = ethereumUtils.getAccountAsset(asset.uniqueId);
      const newBalance = ignoreGasFee
        ? (asset.balance?.amount ?? accountAsset?.balance?.amount ?? '0')
        : ethereumUtils.getBalanceAmount(selectedGasFee, asset, l1GasFeeOptimism);

      setMaxSendableBalance(newBalance);
      return newBalance;
    },
    [ignoreGasFee, l1GasFeeOptimism, selectedGasFee]
  );

  return {
    maxSendableBalance,
    updateMaxSendableBalance,
  };
}
