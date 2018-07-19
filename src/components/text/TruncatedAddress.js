import PropTypes from 'prop-types';
import React from 'react';
import { Dimensions } from 'react-native';
import Monospace from './Monospace';

const buildAddressAbbreviation = (address, truncationLength) => {
  const isSmallPhone = (Dimensions.get('window').width < 375);
  const numCharsPerSection = truncationLength || (isSmallPhone ? 8 : 10);

  const sections = [
    address.substring(0, numCharsPerSection),
    address.substring(address.length - numCharsPerSection),
  ];

  return sections.join('...');
};

const TruncatedAddress = ({ address, truncationLength, ...props }) => (
  <Monospace {...props}>
    {buildAddressAbbreviation(address, truncationLength)}
  </Monospace>
);

TruncatedAddress.propTypes = {
  address: PropTypes.string,
  truncationLength: PropTypes.number,
};

export default TruncatedAddress;
