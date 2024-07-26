import { useCallback } from 'react';
import { Address } from 'viem';

import { selectUserAssetsBalance, selectorFilterByUserChains } from '@/__swaps__/screens/Swap/resources/_selectors/assets';
import { useUserAssets } from '@/__swaps__/screens/Swap/resources/assets';
import { EthereumAddress, ParsedAddressAsset } from '@/entities';
import useAccountSettings from './useAccountSettings';
import { convertAmountToNativeDisplay } from '@/helpers/utilities';
import useCoinListEditOptions from './useCoinListEditOptions';

export function useAssetsBalanceForAddress(address: EthereumAddress) {
  const { nativeCurrency } = useAccountSettings();
  const { hiddenCoinsObj: hidden } = useCoinListEditOptions();
  const isHidden = useCallback(
    (asset: ParsedAddressAsset) => {
      return !!hidden[asset.address];
    },
    [hidden]
  );

  const { data: totalAssetsBalance, isLoading } = useUserAssets(
    {
      address: address as Address,
      currency: nativeCurrency,
    },
    {
      select: data =>
        selectorFilterByUserChains({
          data,
          selector: data => selectUserAssetsBalance(data, asset => isHidden(asset as unknown as ParsedAddressAsset)),
        }),
    }
  );

  return {
    amount: totalAssetsBalance,
    display: totalAssetsBalance ? convertAmountToNativeDisplay(totalAssetsBalance, nativeCurrency) : undefined,
    isLoading,
  };
}
