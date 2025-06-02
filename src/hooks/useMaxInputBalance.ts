import { useCallback, useState } from 'react';
import useGas from './useGas';
import { ethereumUtils } from '@/utils';
import { AssetType, ParsedAddressAsset, UniqueAsset } from '@/entities';

const UniqueAssetTypes = [AssetType.nft, AssetType.ens, AssetType.poap];

const isUniqueAsset = (inputCurrency: ParsedAddressAsset | UniqueAsset | undefined) =>
  inputCurrency === undefined || (inputCurrency.type && UniqueAssetTypes.includes(inputCurrency.type as AssetType));

export default function useMaxInputBalance() {
  const [maxInputBalance, setMaxInputBalance] = useState<string>('0');

  const { selectedGasFee, l1GasFeeOptimism } = useGas();

  const updateMaxInputBalance = useCallback(
    (inputCurrency: ParsedAddressAsset | UniqueAsset | undefined) => {
      if (
        !inputCurrency ||
        isUniqueAsset(inputCurrency) ||
        !('address' in inputCurrency && 'decimals' in inputCurrency && 'symbol' in inputCurrency)
      ) {
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
