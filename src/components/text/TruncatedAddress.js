import React, { useMemo } from 'react';
import { abbreviations } from '../../utils';
import Text from './Text';

export default function TruncatedAddress({
  address,
  firstSectionLength,
  truncationLength,
  ...props
}) {
  const text = useMemo(
    () =>
      address
        ? abbreviations.formatAddressForDisplay(
            address,
            truncationLength,
            firstSectionLength
          )
        : 'Error displaying address',
    [address, firstSectionLength, truncationLength]
  );

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
