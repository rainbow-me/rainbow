import PropTypes from 'prop-types';
import React from 'react';
import { Circle, G } from 'react-native-svg';
import Svg from '../Svg';

const ThreeDotsIcon = ({ color, colors, tightDots, circle, ...props }: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <Svg
    height={circle ? '25' : '5'}
    viewBox={tightDots ? (circle ? '-7 0 35 5' : '0 0 21 5') : '0 0 23 5'}
    width={tightDots ? 21 : 23}
    {...props}
  >
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <G fill={color || colors.grey} fillRule="evenodd">
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Circle
        cx="10"
        cy="2"
        fill="transparent"
        r="15"
        stroke={color || colors.grey}
        strokeWidth="2.5"
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Circle cx="2.5" cy="2.5" r="2.5" />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Circle cx={tightDots ? '10.5' : '11.5'} cy="2.5" r="2.5" />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Circle cx={tightDots ? '18.5' : '20.5'} cy="2.5" r="2.5" />
    </G>
  </Svg>
);

ThreeDotsIcon.propTypes = {
  color: PropTypes.string,
  tightDots: PropTypes.bool,
};

export default ThreeDotsIcon;
