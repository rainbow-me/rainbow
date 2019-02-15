import deviceUtils from './deviceUtils';

const defaultNumCharsPerSection = deviceUtils.isNarrowPhone ? 8 : 10;

export function address(currentAddress, truncationLength, firstSectionLength) {
  const numCharsPerSection = truncationLength || defaultNumCharsPerSection;

  return [
    currentAddress.substring(0, firstSectionLength || numCharsPerSection),
    currentAddress.substring(currentAddress.length - numCharsPerSection),
  ].join('...');
}

export function isAddress(currentAddress) {
  return (currentAddress || '').substring(0, 2) === '0x' && (currentAddress || '').indexOf('...') > -1;
}

export default {
  address,
  defaultNumCharsPerSection,
  isAddress,
};
