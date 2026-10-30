import type { EthereumAddress } from '@/entities/wallet';

import { getNameService } from './address';

/**
 * Shortens an address to its leading and trailing characters.
 */
export function abbreviateAddress(currentAddress: EthereumAddress, truncationLength = 6, firstSectionLength = truncationLength): string {
  'worklet';
  if (!currentAddress) return '';

  return [
    currentAddress.substring(0, firstSectionLength || truncationLength),
    currentAddress.substring(currentAddress.length - truncationLength),
  ].join('...');
}

/**
 * Preserves names and shortens literal addresses.
 */
export function formatAddressForDisplay(text: string, truncationLength = 4, firstSectionLength = 10): string {
  return getNameService(text) ? text : abbreviateAddress(text, truncationLength, firstSectionLength);
}

/**
 * Shortens a name's first label while preserving every parent label. Other input is returned unchanged.
 */
export function abbreviateName(text: string | undefined, truncationLength = 20, truncationLengthBuffer = 2): string | undefined {
  if (!text || !getNameService(text)) return text;

  const [label, ...parents] = text.split('.');
  if (label.length <= truncationLength + truncationLengthBuffer) return text;

  return `${label.slice(0, truncationLength - 4)}...${label.slice(-4)}.${parents.join('.')}`;
}
