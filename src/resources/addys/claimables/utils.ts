import { NativeCurrencyKey } from '@/entities';
import { AddysClaimable, Claimable } from './types';
import { convertRawAmountToBalance, convertRawAmountToNativeDisplay, greaterThan } from '@/helpers/utilities';

export const parseClaimables = (claimables: AddysClaimable[], currency: NativeCurrencyKey): Claimable[] => {
  return claimables
    .map(claimable => {
      if (
        !(claimable.claim_action_type === 'transaction' || claimable.claim_action_type === 'sponsored') ||
        !claimable.claim_action?.length
      ) {
        return undefined;
      }

      const baseClaimable = {
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
      };

      if (claimable.claim_action_type === 'transaction') {
        return {
          ...baseClaimable,
          type: 'transaction' as const,
          action: {
            to: claimable.claim_action[0].address_to,
            data: claimable.claim_action[0].calldata,
          },
        };
      } else if (claimable.claim_action_type === 'sponsored') {
        return {
          ...baseClaimable,
          type: 'sponsored' as const,
          action: { method: claimable.claim_action[0].method, url: claimable.claim_action[0].url },
        };
      }
    })
    .filter((c): c is Claimable => !!c)
    .sort((a, b) => (greaterThan(a.value.claimAsset.amount ?? '0', b.value.claimAsset.amount ?? '0') ? -1 : 1));
};
