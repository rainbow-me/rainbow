import { isENSAddressFormat } from '../helpers/validators';
import deviceUtils from './deviceUtils';

const defaultNumCharsPerSection = deviceUtils.isNarrowPhone ? 8 : 10;

export function address(
  currentAddress,
  truncationLength = defaultNumCharsPerSection,
  firstSectionLength
) {
  if (!currentAddress) return;

  return [
    currentAddress.substring(0, firstSectionLength || truncationLength),
    currentAddress.substring(currentAddress.length - truncationLength),
  ].join('...');
}

export function formatAddressForDisplay(
  text,
  truncationLength = 4,
  firstSectionLength = 10
) {
  return isENSAddressFormat(text)
    ? text
    : address(text, truncationLength, firstSectionLength);
}

export function isAddress(currentAddress) {
  return (
    (currentAddress || '').substring(0, 2) === '0x' &&
    (currentAddress || '').indexOf('...') > -1
  );
}

export default {
  address,
  defaultNumCharsPerSection,
  formatAddressForDisplay,
  isAddress,
};
