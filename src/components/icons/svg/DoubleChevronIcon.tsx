import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';

const DoubleChevronIcon = ({ colors, color = colors.black, ...props }: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <Svg fill="none" height="24" viewBox="0 0 27 24" width="27" {...props}>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <Path
      d="M14.111 11.95c0-.42-.146-.762-.488-1.085l-7.49-7.324a1.252 1.252 0 00-.947-.39c-.752 0-1.368.605-1.368 1.357 0 .37.157.713.43.986l6.64 6.446-6.64 6.464c-.273.264-.43.606-.43.987 0 .752.616 1.357 1.368 1.357.37 0 .693-.127.947-.39l7.49-7.325c.342-.322.488-.674.488-1.084z"
      fill={color}
      fillOpacity="0.3"
      opacity="0.5"
    />
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <Path
      d="M25.111 11.95c0-.42-.146-.762-.488-1.085l-7.49-7.324a1.252 1.252 0 00-.947-.39c-.752 0-1.368.605-1.368 1.357 0 .37.157.713.43.986l6.64 6.446-6.64 6.464c-.273.264-.43.606-.43.987 0 .752.616 1.357 1.368 1.357.37 0 .693-.127.947-.39l7.49-7.325c.342-.322.488-.674.488-1.084z"
      fill={color}
      fillOpacity="0.3"
      opacity="0.3"
    />
  </Svg>
);

export default DoubleChevronIcon;
