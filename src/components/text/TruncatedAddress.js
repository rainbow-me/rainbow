import React, { useMemo } from 'react';
import Text from './Text';
import { toChecksumAddress } from '@rainbow-me/handlers/web3';
import { abbreviations } from '@rainbow-me/utils';

const TruncatedAddress = (
  { address, firstSectionLength, truncationLength, ...props },
  ref
) => {
  const text = useMemo(
    () =>
      address
        ? abbreviations.formatAddressForDisplay(
            toChecksumAddress(address),
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
      ref={ref}
    >
      {text}
    </Text>
  );
};

export default React.forwardRef(TruncatedAddress);
