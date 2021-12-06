import PropTypes from 'prop-types';
import React from 'react';
import { Circle } from 'react-native-svg';
import Svg from '../Svg';

const DotIcon = ({ color, colors, ...props }: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <Svg height="7" viewBox="0 0 7 7" width="7" {...props}>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <Circle cx="3.5" cy="3.5" fill={color || colors.black} r="3.5" />
  </Svg>
);

DotIcon.propTypes = {
  color: PropTypes.string,
};

export default DotIcon;
