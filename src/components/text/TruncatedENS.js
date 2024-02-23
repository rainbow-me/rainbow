import lang from 'i18n-js';
import React from 'react';
import Text from './Text';
import { abbreviations } from '@/utils';

const TruncatedENS = ({ ens, truncationLength, ...props }, ref) => {
  const text = useMemo(
    () => (ens ? abbreviations.abbreviateEnsForDisplay(ens, truncationLength) : lang.t('wallet.error_displaying_address')),
    [ens, truncationLength]
  );
  return (
    <Text {...props} adjustsFontSizeToFit minimumFontScale={0.5} numberOfLines={1} ref={ref}>
      {text}
    </Text>
  );
};

export default React.forwardRef(TruncatedENS);
