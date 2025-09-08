import * as i18n from '@/languages';
import React, { useMemo } from 'react';
import Text from './Text';
import { toChecksumAddress } from '@/handlers/web3';
import { abbreviations } from '@/utils';

const TruncatedAddress = ({ address, firstSectionLength, truncationLength, ...props }, ref) => {
  const text = useMemo(
    () =>
      address
        ? abbreviations.formatAddressForDisplay(toChecksumAddress(address), truncationLength, firstSectionLength)
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
