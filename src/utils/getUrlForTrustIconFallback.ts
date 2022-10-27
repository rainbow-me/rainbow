import { AssetType, EthereumAddress } from '@/entities';
import { Network, NetworkTypes } from '@/helpers';

export default function getUrlForTrustIconFallback(
  address: EthereumAddress,
  type?: AssetType
): string | null {
  if (!address) return null;
  let network = 'ethereum';
  if (type && type !== AssetType.token) {
    network = type;
  }
  if (type && type === AssetType.bsc) {
    network = 'smartchain';
  }
  return `https://rainbowme-res.cloudinary.com/image/upload/assets/${network}/${address}.png`;
}
