import PropTypes from 'prop-types';
import React from 'react';
import { isENSAddressFormat } from '../../helpers/validators';
import { abbreviations } from '../../utils';
import Text from './Text';

const TruncatedAddress = ({
  address,
  firstSectionLength,
  monospace,
  truncationLength,
  ...props
}) => {
  let text = 'Error displaying address';

  if (address) {
    text = isENSAddressFormat(address)
      ? address
      : abbreviations.address(address, truncationLength, firstSectionLength);
  }

  return (
    <Text
      {...props}
      adjustsFontSizeToFit
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
  truncationLength: PropTypes.number,
};

TruncatedAddress.defaultProps = {
  monospace: true,
};

export default TruncatedAddress;
