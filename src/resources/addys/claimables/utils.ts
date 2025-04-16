import { NativeCurrencyKey } from '@/entities';
import { convertRawAmountToBalance, convertRawAmountToNativeDisplay } from '@/helpers/utilities';
import { parseAsset } from '@/resources/assets/assets';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { Network } from '@/state/backendNetworks/types';
import { acceptedClaimableTypes, AddysClaimable, BaseClaimable, Claimable, RainbowClaimable, AcceptedClaimableType } from './types';

function isAcceptedClaimableType(type: AddysClaimable['claim_action_type']): type is AcceptedClaimableType {
  if (!type || type === 'unknown') return false;
  return acceptedClaimableTypes.includes(type);
}

export const parseClaimables = <C extends Claimable>(
  claimables: AddysClaimable[],
  currency: NativeCurrencyKey,
  prune?: Record<string, number> | null
): C[] => {
  return claimables
    .map(claimable => {
      if (!isAcceptedClaimableType(claimable.claim_action_type) || !claimable.claim_action?.length || prune?.[claimable.unique_id]) {
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

      // Type is narrowed by the predicate above
      if (claimable.claim_action_type === 'transaction' || claimable.claim_action_type === 'multi_transaction') {
        // claimable is AddysTransactionClaimable or AddysRainbowClaimable
        const specificClaimable = claimable as Extract<AddysClaimable, { claim_action_type: 'transaction' }>;
        if ('creator_address' in specificClaimable) {
          Object.assign<BaseClaimable, Partial<RainbowClaimable>>(baseClaimable, { creatorAddress: specificClaimable.creator_address });
        }
        return {
          ...baseClaimable,
          actionType: claimable.claim_action_type,
          action: specificClaimable.claim_action.map(action => ({
            to: action.address_to,
            data: action.calldata,
          })),
        } as C; // Cast needed because specific return types depend on C
      } else if (claimable.claim_action_type === 'sponsored') {
        // claimable is AddysSponsoredClaimable
        const specificClaimable = claimable as Extract<AddysClaimable, { claim_action_type: 'sponsored' }>;
        return {
          ...baseClaimable,
          actionType: 'sponsored',
          action: { method: specificClaimable.claim_action[0].method, url: specificClaimable.claim_action[0].url },
        } as C;
      }

      return undefined;
    })
    .filter((c): c is C => !!c);
};
