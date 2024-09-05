import { ChainId } from '@/chains/types';
import { EthereumAddress } from '@/entities';
import { chainsName } from '@/chains/chains';

export default function getUrlForTrustIconFallback(address: EthereumAddress, chainId: ChainId): string | null {
  if (!address) return null;
  let networkPath = 'ethereum';
  switch (chainId) {
    case ChainId.mainnet:
      networkPath = 'ethereum';
      break;
    case ChainId.bsc:
      networkPath = 'smartchain';
      break;
    default:
      networkPath = chainsName[chainId];
  }
  return `https://rainbowme-res.cloudinary.com/image/upload/assets/${networkPath}/${address}.png`;
}
