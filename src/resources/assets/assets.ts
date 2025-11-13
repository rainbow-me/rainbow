import * as i18n from '@/languages';
import { isNativeAsset } from '@/handlers/assets';
import { convertRawAmountToBalance } from '@/helpers/utilities';
import { ParsedAddressAsset } from '@/entities';
import { AddysAddressAsset, AddysAsset, ParsedAsset } from './types';
import { getUniqueId } from '@/utils/ethereumUtils';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';
import { Asset, NetworkMapping } from '@/features/positions/types/generated/transaction/transaction';

function parseNetworks(networks: NetworkMapping[] | undefined) {
  if (!networks) return {};
  const parsedNetworks: Record<string, { address: string; decimals: number }> = {};
  for (const network of networks) {
    parsedNetworks[network.chainId] = {
      address: network.tokenMapping?.address || '',
      decimals: network.tokenMapping?.decimals || 0,
    };
  }
  return parsedNetworks;
}

// We are still using the Addys version for claimable
export function parseAsset({ address, asset }: { address: string; asset: AddysAsset }): ParsedAsset {
  const network = asset?.network;
  const chainId = useBackendNetworksStore.getState().getChainsIdByName()[network];
  const mainnetAddress = asset?.networks?.[ChainId.mainnet]?.address;
  const uniqueId = getUniqueId(address, chainId);

  const parsedAsset = {
    address,
    color: asset?.colors?.primary,
    colors: asset.colors,
    chainId,
    chainName: network,
    decimals: asset?.decimals,
    id: address,
    icon_url: asset?.icon_url,
    isNativeAsset: isNativeAsset(address, chainId),
    name: asset?.name || i18n.t(i18n.l.account.unknown_token),
    mainnet_address: mainnetAddress,
    mainnetAddress,
    network,
    networks: asset?.networks,
    price: asset?.price,
    symbol: asset?.symbol,
    type: asset?.type,
    uniqueId,
    transferable: asset?.transferable,
  };

  return parsedAsset;
}

export function parseGoldskyAsset({ address, asset }: { address: string; asset: Asset }): ParsedAsset {
  const network = asset?.network;
  const chainId = useBackendNetworksStore.getState().getChainsIdByName()[network];
  const mainnetAddress = asset?.networks?.[ChainId.mainnet]?.tokenMapping?.address;
  const uniqueId = getUniqueId(address, chainId);

  const parsedAsset = {
    address,
    color: asset?.colors?.primary,
    colors: asset.colors,
    chainId,
    chainName: network,
    decimals: asset?.decimals,
    id: address,
    icon_url: asset?.iconUrl,
    isNativeAsset: isNativeAsset(address, chainId),
    name: asset?.name || i18n.t(i18n.l.account.unknown_token),
    mainnet_address: mainnetAddress,
    mainnetAddress,
    network,
    networks: parseNetworks(asset?.networks),
    price: {
      value: parseFloat(asset?.price?.value || '0'),
      changed_at: asset?.price?.changedAt ? new Date(asset.price.changedAt).getTime() : undefined,
      relative_change_24h: asset?.price?.relativeChange24h ? Number(asset?.price?.relativeChange24h) : 0,
    },
    symbol: asset?.symbol,
    type: asset?.type,
    uniqueId,
    transferable: asset?.transferable,
  };

  return parsedAsset;
}

// We are still using the Addys version for claimable
export function parseAddressAsset({ assetData }: { assetData: AddysAddressAsset }): ParsedAddressAsset {
  const asset = assetData?.asset;
  const quantity = assetData?.quantity;
  const address = assetData?.asset?.asset_code;

  const parsedAsset = parseAsset({
    address,
    asset,
  });
  return {
    ...parsedAsset,
    balance: convertRawAmountToBalance(quantity, asset),
  };
}

export function parseGoldskyAddressAsset({ assetData }: { assetData: { asset: Asset; quantity: string } }): ParsedAddressAsset {
  const asset = assetData?.asset;
  const quantity = assetData?.quantity;
  const address = assetData?.asset?.assetCode;

  const parsedAsset = parseGoldskyAsset({
    address,
    asset,
  });
  return {
    ...parsedAsset,
    balance: convertRawAmountToBalance(quantity, asset),
  };
}
