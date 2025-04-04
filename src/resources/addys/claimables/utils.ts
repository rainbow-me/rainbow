import { NativeCurrencyKey } from '@/entities';
import { convertRawAmountToBalance, convertRawAmountToNativeDisplay } from '@/helpers/utilities';
import { parseAsset } from '@/resources/assets/assets';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { Network } from '@/state/backendNetworks/types';
import { AddysClaimable, BaseClaimable, Claimable, RainbowClaimable } from './types';

export const parseClaimables = <C extends Claimable>(
  claimables: AddysClaimable[],
  currency: NativeCurrencyKey,
  prune?: Record<string, number> | null
): C[] => {
  return claimables
    .map(claimable => {
      if (
        !(claimable.claim_action_type === 'transaction' || claimable.claim_action_type === 'sponsored') ||
        !claimable.claim_action?.length ||
        prune?.[claimable.unique_id]
      ) {
        return undefined;
      }

      const baseClaimable: BaseClaimable = {
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
        type: claimable.type,
        value: {
          claimAsset: convertRawAmountToBalance(claimable.amount, claimable.asset),
          nativeAsset: convertRawAmountToNativeDisplay(claimable.amount, claimable.asset.decimals, claimable.asset.price.value, currency),
          usd: claimable.total_usd_value,
        },
      };

      if (claimable.claim_action_type === 'transaction') {
        if ('creator_address' in claimable) {
          Object.assign<BaseClaimable, Partial<RainbowClaimable>>(baseClaimable, { creatorAddress: claimable.creator_address });
        }
        return {
          ...baseClaimable,
          actionType: 'transaction',
          action: {
            to: claimable.claim_action[0].address_to,
            data: claimable.claim_action[0].calldata,
          },
        };
      } else if (claimable.claim_action_type === 'sponsored') {
        return {
          ...baseClaimable,
          actionType: 'sponsored',
          action: { method: claimable.claim_action[0].method, url: claimable.claim_action[0].url },
        };
      }
    })
    .filter((c): c is C => !!c);
};
