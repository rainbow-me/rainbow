import deviceUtils from './deviceUtils';

export function address(currentAddress, truncationLength) {
  const defaultNumCharsPerSection = deviceUtils.isSmallPhone ? 8 : 10;
  const numCharsPerSection = truncationLength || defaultNumCharsPerSection;

  const sections = [
    currentAddress.substring(0, numCharsPerSection),
    currentAddress.substring(currentAddress.length - numCharsPerSection),
  ];

  return sections.join('...');
}

export function isAddress(currentAddress) {
  return (currentAddress || '').substring(0, 2) === '0x' && (currentAddress || '').indexOf('...') > -1;
}

export default {
  address,
  isAddress,
};
