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

export default {
  address,
};
