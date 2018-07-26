import PropTypes from 'prop-types';
import React from 'react';
import { deviceUtils } from '../../utils';
import Monospace from './Monospace';

const buildAddressAbbreviation = (address, truncationLength) => {
  const defaultNumCharsPerSection = deviceUtils.isSmallPhone ? 8 : 10;
  const numCharsPerSection = truncationLength || defaultNumCharsPerSection;

  const sections = [
    address.substring(0, numCharsPerSection),
    address.substring(address.length - numCharsPerSection),
  ];

  return sections.join('...');
};

const TruncatedAddress = ({ address, truncationLength, ...props }) => (
  <Monospace
    {...props}
    adjustsFontSizeToFit={true}
    minimumFontScale={0.5}
    numberOfLines={1}
  >
    {address
      ? buildAddressAbbreviation(address, truncationLength)
      : 'Error displaying address'
    }
  </Monospace>
);

TruncatedAddress.propTypes = {
  address: PropTypes.string,
  truncationLength: PropTypes.number,
};

export default TruncatedAddress;
