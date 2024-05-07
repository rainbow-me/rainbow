import { isValidDomainFormat } from '../helpers/validators';
import { EthereumAddress } from '@/entities';

const defaultNumCharsPerSection = 6;

export function address(currentAddress: EthereumAddress, truncationLength = defaultNumCharsPerSection, firstSectionLength: number): string {
  if (!currentAddress) return '';

  return [
    currentAddress.substring(0, firstSectionLength || truncationLength),
    currentAddress.substring(currentAddress.length - truncationLength),
  ].join('...');
}

export function formatAddressForDisplay(text: string, truncationLength = 4, firstSectionLength = 10): string {
  return isValidDomainFormat(text) ? text : address(text, truncationLength, firstSectionLength);
}

export function abbreviateEnsForDisplay(text: string, truncationLength = 20, truncationLengthBuffer = 2): string | null {
  if (typeof text !== 'string' || !isValidDomainFormat(text)) {
    return text;
  }
  const pieces = text.split('.');
  if (pieces[0].length > truncationLength + truncationLengthBuffer) {
    return [pieces[0].slice(0, truncationLength - 4), '...', pieces[0].slice(-4), `.${pieces[1]}`].join('');
  } else {
    return text;
  }
}

export function isAddress(currentAddress: string): boolean {
  return (currentAddress || '').substring(0, 2) === '0x' && (currentAddress || '').indexOf('...') > -1;
}

export default {
  abbreviateEnsForDisplay,
  address,
  defaultNumCharsPerSection,
  formatAddressForDisplay,
  isAddress,
};
