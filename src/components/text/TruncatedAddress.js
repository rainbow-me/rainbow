import PropTypes from 'prop-types';
import React from 'react';

import Monospace from './Monospace';
import { abbreviations } from '../../utils';

const TruncatedAddress = ({ address, truncationLength, ...props }) => (
  <Monospace
    {...props}
    adjustsFontSizeToFit={true}
    minimumFontScale={0.5}
    numberOfLines={1}
  >
    {address
      ? abbreviations.address(address, truncationLength)
      : 'Error displaying address'
    }
  </Monospace>
);

TruncatedAddress.propTypes = {
  address: PropTypes.string,
  truncationLength: PropTypes.number,
};

export default TruncatedAddress;
