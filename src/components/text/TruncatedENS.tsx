import React from 'react';
import Text from './Text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { abbreviations } from '@rainbow-me/utils';

const TruncatedENS = ({ ens, truncationLength, ...props }: any, ref: any) => {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
  const text = useMemo(
    () =>
      ens
        ? abbreviations.abbreviateEnsForDisplay(ens, truncationLength)
        : 'Error displaying address',
    [ens, truncationLength]
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

export default React.forwardRef(TruncatedENS);
