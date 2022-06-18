import { AssetType, EthereumAddress } from '@rainbow-me/entities';

export default function getUrlForTrustIconFallback(
  address: EthereumAddress,
  type?: AssetType
): string | null {
  if (!address) return null;
  const lowercasedAddress = address.toLowerCase();
  let network = 'ethereum';
  if (type && type !== AssetType.token) {
    network = type;
  }
  return `https://raw.githubusercontent.com/rainbow-me/assets/lowercase/blockchains/${network}/assets/${lowercasedAddress}/logo.png`;
}
