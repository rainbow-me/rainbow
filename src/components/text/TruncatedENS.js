import * as i18n from '@/languages';
import React from 'react';
import Text from './Text';
import { abbreviations } from '@/utils';

const TruncatedENS = ({ ens, truncationLength, ...props }, ref) => {
  const text = React.useMemo(
    () => (ens ? abbreviations.abbreviateEnsForDisplay(ens, truncationLength) : i18n.t(i18n.l.wallet.error_displaying_address)),
    [ens, truncationLength]
  );
  return (
    <Text {...props} adjustsFontSizeToFit minimumFontScale={0.5} numberOfLines={1} ref={ref}>
      {text}
    </Text>
  );
};

export default React.forwardRef(TruncatedENS);
