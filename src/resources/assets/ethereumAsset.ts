import { ETH_ADDRESS } from '@/references/constants';
import { ChainId } from '@/state/backendNetworks/types';

export const ETH_ICON_URL = 'https://rainbowme-res.cloudinary.com/image/upload/v1668565116/assets/ethereum/eth.png';

const MAINNET_ETH_ADDRESS_ALIASES = new Set([
  ETH_ADDRESS,
  'ethereum',
  'native',
  '0x0000000000000000000000000000000000000000',
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
]);

export function isMainnetEthAddress(address: string, chainId: ChainId): boolean {
  return chainId === ChainId.mainnet && MAINNET_ETH_ADDRESS_ALIASES.has(address.toLowerCase());
}

export function getMainnetEthFetchAddress({ address, chainId }: { address: string; chainId: ChainId }): string {
  return isMainnetEthAddress(address, chainId) ? ETH_ADDRESS : address;
}
