import i18n from '@/languages';
import { NativeCurrencyKey } from '@/entities';
import { add, convertAmountToNativeDisplayWorklet, convertRawAmountToBalanceWorklet } from '@/helpers/utilities';
import { parseAsset } from '@/resources/assets/assets';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { Network } from '@/state/backendNetworks/types';
import {
  acceptedClaimableTypes,
  AddysClaimable,
  BaseClaimable,
  Claimable,
  RainbowClaimable,
  AcceptedClaimableType,
  ClaimableType,
} from './types';

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

      const totalCurrencyValue = claimable.assets.reduce((acc, curr) => add(acc, curr.usd_value), '0');

      const baseClaimable: BaseClaimable = {
        assets: claimable.assets.map(({ asset, amount, ...rest }) => ({
          ...rest,
          amount: convertRawAmountToBalanceWorklet(amount, asset),
          asset: parseAsset({
            address: asset.asset_code,
            asset: {
              ...asset,
              network: useBackendNetworksStore.getState().getChainsName()[claimable.network] as Network,
              transferable: asset.transferable ?? false,
            },
          }),
        })),
        asset: parseAsset({
          address: claimable.asset.asset_code,
          asset: {
            ...claimable.asset,
            network: useBackendNetworksStore.getState().getChainsName()[claimable.network] as Network,
            transferable: claimable.asset.transferable ?? false,
          },
        }),
        dapp: claimable.dapp,
        chainId: claimable.network,
        name: claimable.name,
        uniqueId: claimable.unique_id,
        iconUrl: claimable.dapp.icon_url,
        type: claimable.type,
        totalCurrencyValue: {
          amount: totalCurrencyValue,
          display: convertAmountToNativeDisplayWorklet(totalCurrencyValue, currency),
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
        };
      } else if (claimable.claim_action_type === 'sponsored') {
        // claimable is AddysSponsoredClaimable
        const specificClaimable = claimable as Extract<AddysClaimable, { claim_action_type: 'sponsored' }>;
        return {
          ...baseClaimable,
          actionType: 'sponsored',
          action: { method: specificClaimable.claim_action[0].method, url: specificClaimable.claim_action[0].url },
        };
      }

      return undefined;
    })
    .filter((c): c is C => !!c);
};

export const isRainbowEthRewards = (uniqueId: string) => uniqueId === 'rainbow-eth-rewards';

export const claimableTypeTransformation = (type: ClaimableType) => type?.replaceAll('_', '-');

export const getClaimableName = (claimable: Claimable) => {
  const transformedType = claimableTypeTransformation(claimable.type);
  if (transformedType === ClaimableType.RainbowSuperTokenCreatorFees) {
    return i18n.claimables.panel.creator_lp_fees();
  }

  if (transformedType === ClaimableType.merklClaimable && claimable.dapp) {
    return i18n.claimables.panel.merkl_claimable({ dappName: claimable.dapp.name });
  }

  if (isRainbowEthRewards(claimable.uniqueId)) {
    return i18n.claimables.panel.rainbow_eth_rewards();
  }

  return claimable.name;
};
