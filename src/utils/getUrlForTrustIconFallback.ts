import { EthereumAddress } from '@rainbow-me/entities';

export default function getUrlForTrustIconFallback(
  address: EthereumAddress
): string | null {
  if (!address) return null;
  const lowercasedAddress = address.toLowerCase();
  return `https://raw.githubusercontent.com/rainbow-me/assets/lowercase/blockchains/ethereum/assets/${lowercasedAddress}/logo.png`;
}
