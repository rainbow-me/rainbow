import {
  isENSAddressFormat,
  isUnstoppableAddressFormat,
} from '../helpers/validators';

const defaultNumCharsPerSection = 6;

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
  return isENSAddressFormat(text) || isUnstoppableAddressFormat(text)
    ? text
    : address(text, truncationLength, firstSectionLength);
}

export function abbreviateEnsForDisplay(text, truncationLength = 20) {
  if (typeof text !== 'string' || !isENSAddressFormat(text)) {
    return null;
  }
  const pieces = text.split('.');
  if (pieces[0].length > truncationLength) {
    return [pieces[0].slice(0, truncationLength), '(...).', pieces[1]].join('');
  } else {
    return text;
  }
}

export function isAddress(currentAddress) {
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
