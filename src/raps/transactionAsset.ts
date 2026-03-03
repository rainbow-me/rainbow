import { type ParsedAsset as SwapParsedAsset } from '@/__swaps__/types/assets';
import { type TokenColors } from '@/graphql/__generated__/metadata';
import { type ParsedAsset as TransactionParsedAsset } from '@/resources/assets/types';

type TransactionAssetSource = (SwapParsedAsset | TransactionParsedAsset) & { nativePrice?: number };

function toTransactionColors(colors: TransactionAssetSource['colors']): TokenColors | undefined {
  if (!colors?.primary) return undefined;
  return {
    primary: colors.primary,
    fallback: colors.fallback,
    shadow: colors.shadow,
  };
}

function toTransactionNetworks(networks: TransactionAssetSource['networks']): TransactionParsedAsset['networks'] {
  if (!networks) return undefined;

  const nextNetworks: NonNullable<TransactionParsedAsset['networks']> = {};
  for (const [chainId, network] of Object.entries(networks)) {
    if (!network) continue;
    nextNetworks[chainId] = {
      address: network.address,
      decimals: network.decimals,
    };
  }
  return nextNetworks;
}

function resolveMainnetAddress(asset: TransactionAssetSource): TransactionParsedAsset['mainnet_address'] {
  if ('mainnet_address' in asset && asset.mainnet_address) return asset.mainnet_address;
  if ('mainnetAddress' in asset && asset.mainnetAddress) return asset.mainnetAddress;
  return undefined;
}

/**
 * Normalizes swap-like assets into the transaction asset shape used in pending tx state.
 */
export function toTransactionAsset({ asset, chainName }: { asset: TransactionAssetSource; chainName: string }): TransactionParsedAsset {
  const colors = toTransactionColors(asset.colors);
  const price = typeof asset.nativePrice === 'number' ? { value: asset.nativePrice } : asset.price;
  const mainnetAddress = resolveMainnetAddress(asset);

  return {
    ...asset,
    network: chainName,
    color: colors?.primary,
    mainnet_address: mainnetAddress,
    colors,
    networks: toTransactionNetworks(asset.networks),
    price,
  };
}
