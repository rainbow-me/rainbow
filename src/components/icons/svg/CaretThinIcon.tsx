import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';

const CaretThinIcon = ({ color, colors, ...props }: any, ref: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <Svg height="14" ref={ref} viewBox="0 0 7 14" width="7" {...props}>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <Path
      d="M.317 12.203a.875.875 0 1 0 1.366 1.094l4.15-5.188a1.375 1.375 0 0 0 0-1.718l-4.15-5.188A.875.875 0 1 0 .317 2.297L4.279 7.25.317 12.203z"
      fill={color || colors.black}
      fillRule="nonzero"
    />
  </Svg>
);

export default React.forwardRef(CaretThinIcon);
