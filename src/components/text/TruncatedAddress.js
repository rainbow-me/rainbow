import React, { useMemo } from 'react';

import { formatAddressForDisplay } from '@/features/address/core/formatAddress';
import { toChecksumAddress } from '@/handlers/web3';
import * as i18n from '@/languages';

import Text from './Text';

const TruncatedAddress = ({ address, firstSectionLength, truncationLength, ...props }, ref) => {
  const text = useMemo(
    () =>
      address
        ? formatAddressForDisplay(toChecksumAddress(address), truncationLength, firstSectionLength)
        : i18n.t(i18n.l.wallet.error_displaying_address),
    [address, firstSectionLength, truncationLength]
  );

  return (
    <Text {...props} adjustsFontSizeToFit minimumFontScale={0.5} numberOfLines={1} ref={ref}>
      {text}
    </Text>
  );
};

export default React.forwardRef(TruncatedAddress);
