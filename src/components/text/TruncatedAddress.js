import PropTypes from 'prop-types';
import React from 'react';
import { abbreviations } from '../../utils';
import Text from './Text';

const TruncatedAddress = ({
  address,
  firstSectionLength,
  monospace,
  shouldTruncate,
  truncationLength,
  ...props
}) => {
  let text = 'Error displaying address';
  if (address) {
    text = shouldTruncate
      ? abbreviations.address(address, truncationLength, firstSectionLength)
      : address;
  }

  return (
    <Text
      {...props}
      adjustsFontSizeToFit={true}
      minimumFontScale={0.5}
      monospace={monospace}
      numberOfLines={1}
    >
      {text}
    </Text>
  );
};

TruncatedAddress.propTypes = {
  address: PropTypes.string,
  firstSectionLength: PropTypes.number,
  monospace: PropTypes.bool,
  shouldTruncate: PropTypes.bool,
  truncationLength: PropTypes.number,
};

TruncatedAddress.defaultProps = {
  monospace: true,
  shouldTruncate: true,
};

export default TruncatedAddress;
