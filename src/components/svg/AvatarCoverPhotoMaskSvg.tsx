import React from 'react';
import Svg, { Path } from 'react-native-svg';

export default function AvatarCoverPhotoMaskSvg({ backgroundColor }: { backgroundColor?: string }) {
  return (
    <Svg height="32" style={{ top: -6 }} viewBox="0 0 96 29" width="96">
      <Path
        d="M9.22449 23.5H0V28.5H96V23.5H86.7755C85.0671 23.5 83.4978 22.5584 82.6939 21.051C67.8912 -6.70409 28.1088 -6.70408 13.3061 21.051C12.5022 22.5584 10.9329 23.5 9.22449 23.5Z"
        fill={backgroundColor}
      />
    </Svg>
  );
}
