import { toChecksumAddress } from '../handlers/web3';
import { EthereumAddress } from '@rainbow-me/entities';

export default function getUrlForTrustIconFallback(
  address: EthereumAddress
): string | null {
  if (!address) return null;
  const checksummedAddress = toChecksumAddress(address);
  return `https://raw.githubusercontent.com/rainbow-me/assets/master/blockchains/ethereum/assets/${checksummedAddress}/logo.png`;
}
