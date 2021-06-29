import React from 'react';
import Text from './Text';
import { abbreviations } from '@rainbow-me/utils';

const TruncatedENS = ({ ens, truncationLength, ...props }, ref) => {
  const text = useMemo(
    () =>
      ens
        ? abbreviations.abbreviateEnsForDisplay(ens, truncationLength)
        : 'Error displaying address',
    [ens, truncationLength]
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

export default React.forwardRef(TruncatedENS);
