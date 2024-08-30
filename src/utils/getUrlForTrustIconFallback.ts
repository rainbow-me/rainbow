import { EthereumAddress } from '@/entities';
import { Network } from '@/networks/types';

export default function getUrlForTrustIconFallback(address: EthereumAddress, network: Network): string | null {
  if (!address) return null;
  let networkPath = 'ethereum';
  switch (network) {
    case Network.mainnet:
      networkPath = 'ethereum';
      break;
    case Network.bsc:
      networkPath = 'smartchain';
      break;
    default:
      networkPath = network;
  }
  return `https://rainbowme-res.cloudinary.com/image/upload/assets/${networkPath}/${address}.png`;
}
