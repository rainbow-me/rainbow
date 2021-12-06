import React, { useMemo } from 'react';
import Text from './Text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/web3' or ... Remove this comment to see the full error message
import { toChecksumAddress } from '@rainbow-me/handlers/web3';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { abbreviations } from '@rainbow-me/utils';

const TruncatedAddress = (
  { address, firstSectionLength, truncationLength, ...props }: any,
  ref: any
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
