import React from 'react';
import { isENSAddressFormat } from '../../helpers/validators';
import { abbreviations } from '../../utils';
import Text from './Text';

export default function TruncatedAddress({
  address,
  firstSectionLength,
  truncationLength,
  ...props
}) {
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
      numberOfLines={1}
    >
      {text}
    </Text>
  );
}
