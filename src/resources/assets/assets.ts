import lang from 'i18n-js';
import { AssetType, ParsedAddressAsset } from '@/entities';
import { isNativeAsset } from '@/handlers/assets';
import { Network } from '@/helpers/networkTypes';
import { convertRawAmountToBalance } from '@/helpers/utilities';
import { ethereumUtils } from '@/utils';
import { AddysAddressAsset, AddysAsset, ParsedAsset } from './types';

const MAINNET_CHAIN_ID = ethereumUtils.getChainIdFromNetwork(Network.mainnet);

export function parseAsset({
  address,
  asset,
}: {
  address: string;
  asset: AddysAsset;
}): ParsedAsset {
  const chainName = asset?.network;
  const network = chainName;
  const chainId = ethereumUtils.getChainIdFromNetwork(chainName);
  const mainnetAddress = asset?.networks?.[MAINNET_CHAIN_ID]?.address;
  const uniqueId =
    network && network !== Network.mainnet ? `${address}_${network}` : address;

  const nonMainnetNetwork = network !== Network.mainnet ? network : undefined;
  const assetType = asset?.type ?? nonMainnetNetwork ?? AssetType.token;

  const parsedAsset = {
    address,
    color: asset?.colors?.primary,
    colors: asset?.colors,
    chainId,
    chainName,
    decimals: asset?.decimals,
    id: address,
    icon_url: asset?.icon_url,
    isNativeAsset: isNativeAsset(address, chainName),
    name: asset?.name || lang.t('account.unknown_token'),
    mainnet_address: mainnetAddress,
    // mainnetAddress,
    network,
    // networks: asset?.networks,
    price: asset?.price,
    symbol: asset?.symbol,
    type: assetType,
    uniqueId,
  };

  return parsedAsset;
}

export function parseAddressAsset({
  assetData,
}: {
  assetData: AddysAddressAsset;
}): ParsedAddressAsset {
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
