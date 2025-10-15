import i18n from '@/languages';
import { isNativeAsset } from '@/handlers/assets';
import { convertRawAmountToBalance } from '@/helpers/utilities';
import { ParsedAddressAsset } from '@/entities';
import { AddysAddressAsset, AddysAsset, ParsedAsset } from './types';
import { getUniqueId } from '@/utils/ethereumUtils';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';

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
    name: asset?.name || i18n.account.unknown_token(),
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
