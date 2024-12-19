import { NativeCurrencyKey } from '@/entities';
import { AddysClaimable, Claimable } from './types';
import { convertRawAmountToBalance, convertRawAmountToNativeDisplay } from '@/helpers/utilities';
import { parseAsset } from '@/resources/assets/assets';
import { Network } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

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
        asset: parseAsset({
          address: claimable.asset.asset_code,
          asset: {
            ...claimable.asset,
            network: useBackendNetworksStore.getState().getChainsName()[claimable.network] as Network,
            transferable: claimable.asset.transferable ?? false,
          },
        }),
        chainId: claimable.network,
        name: claimable.name,
        uniqueId: claimable.unique_id,
        analyticsId: claimable.type,
        iconUrl: claimable.dapp.icon_url,
        value: {
          claimAsset: convertRawAmountToBalance(claimable.amount, claimable.asset),
          nativeAsset: convertRawAmountToNativeDisplay(claimable.amount, claimable.asset.decimals, claimable.asset.price.value, currency),
          usd: claimable.total_usd_value,
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
    .filter((c): c is Claimable => !!c);
};
