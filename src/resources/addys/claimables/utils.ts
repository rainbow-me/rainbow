import { NativeCurrencyKey } from '@/entities';
import { AddysClaimable, Claimable } from './types';
import { convertRawAmountToBalance, convertRawAmountToNativeDisplay, greaterThan } from '@/helpers/utilities';

export const parseClaimables = (claimables: AddysClaimable[], currency: NativeCurrencyKey): Claimable[] => {
  return claimables
    .map(claimable => ({
      asset: {
        iconUrl: claimable.asset.icon_url,
        name: claimable.asset.name,
        symbol: claimable.asset.symbol,
      },
      chainId: claimable.network,
      name: claimable.name,
      uniqueId: claimable.unique_id,
      iconUrl: claimable.dapp.icon_url,
      value: {
        claimAsset: convertRawAmountToBalance(claimable.amount, claimable.asset),
        nativeAsset: convertRawAmountToNativeDisplay(claimable.amount, claimable.asset.decimals, claimable.asset.price.value, currency),
      },
    }))
    .sort((a, b) => (greaterThan(a.value.claimAsset.amount ?? '0', b.value.claimAsset.amount ?? '0') ? -1 : 1));
};
