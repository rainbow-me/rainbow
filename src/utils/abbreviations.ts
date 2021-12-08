import { isValidDomainFormat } from '../helpers/validators';
import { EthereumAddress } from '@rainbow-me/entities';

const defaultNumCharsPerSection = 6;

export function address(
  currentAddress: EthereumAddress,
  truncationLength = defaultNumCharsPerSection,
  firstSectionLength: any
): string | undefined {
  if (!currentAddress) return;

  return [
    currentAddress.substring(0, firstSectionLength || truncationLength),
    currentAddress.substring(currentAddress.length - truncationLength),
  ].join('...');
}

export function formatAddressForDisplay(
  text: string,
  truncationLength = 4,
  firstSectionLength = 10
): string | undefined {
  return isValidDomainFormat(text)
    ? text
    : address(text, truncationLength, firstSectionLength);
}

export function abbreviateEnsForDisplay(
  text: string,
  truncationLength = 20
): string | null {
  if (typeof text !== 'string' || !isValidDomainFormat(text)) {
    return null;
  }
  const pieces = text.split('.');
  if (pieces[0].length > truncationLength) {
    return [pieces[0].slice(0, truncationLength), '(...).', pieces[1]].join('');
  } else {
    return text;
  }
}

export function isAddress(currentAddress: any): boolean {
  return (
    (currentAddress || '').substring(0, 2) === '0x' &&
    (currentAddress || '').indexOf('...') > -1
  );
}

export default {
  abbreviateEnsForDisplay,
  address,
  defaultNumCharsPerSection,
  formatAddressForDisplay,
  isAddress,
};
