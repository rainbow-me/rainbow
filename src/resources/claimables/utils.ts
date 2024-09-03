import { NativeCurrencyKey } from '@/entities';
import { Claimable, RainbowClaimable } from './types';
import { convertRawAmountToBalance, convertRawAmountToNativeDisplay } from '@/helpers/utilities';

export const parseClaimables = (claimables: Claimable[], currency: NativeCurrencyKey): RainbowClaimable[] => {
  return claimables
    .map(claimable => ({
      name: claimable.name,
      uniqueId: claimable.unique_id,
      iconUrl: claimable.dapp.icon_url,
      value: {
        claimAsset: convertRawAmountToBalance(claimable.amount, claimable.asset),
        nativeAsset: convertRawAmountToNativeDisplay(claimable.amount, claimable.asset.decimals, claimable.asset.price.value, currency),
      },
    }))
    .sort((a, b) => (a.value.claimAsset.amount < b.value.claimAsset.amount ? -1 : 1)); // FIXME
};
