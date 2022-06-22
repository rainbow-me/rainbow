import { AssetType, EthereumAddress } from '@rainbow-me/entities';

export default function getUrlForTrustIconFallback(
  address: EthereumAddress,
  type?: AssetType
): string | null {
  if (!address) return null;
  let network = 'ethereum';
  if (type && type !== AssetType.token) {
    network = type;
  }
  return `https://rainbowme-res.cloudinary.com/image/upload/assets/${network}/${address}.png`;
}
