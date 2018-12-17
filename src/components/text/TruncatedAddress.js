import PropTypes from 'prop-types';
import React from 'react';
import { abbreviations } from '../../utils';
import Monospace from './Monospace';

const TruncatedAddress = ({
  address,
  firstSectionLength,
  truncationLength,
  ...props
}) => (
  <Monospace
    {...props}
    adjustsFontSizeToFit={true}
    minimumFontScale={0.5}
    numberOfLines={1}
  >
    {address
      ? abbreviations.address(address, truncationLength, firstSectionLength)
      : 'Error displaying address'
    }
  </Monospace>
);

TruncatedAddress.propTypes = {
  address: PropTypes.string,
  firstSectionLength: PropTypes.number,
  truncationLength: PropTypes.number,
};

export default TruncatedAddress;
