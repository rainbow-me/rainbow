import PropTypes from 'prop-types';
import React from 'react';
import Svg, { Defs, Path, RadialGradient, Stop } from 'svgs';

const EmojiRecentIcon = ({ color, ...props }) => (
  <Svg height="30" width="30" viewBox="0 0 30 30" {...props}>
    <Defs>
      <RadialGradient
        cx="100%"
        cy="49.9814195%"
        fx="100%"
        fy="49.9814195%"
        r="108.068849%"
        id="rainbow"
      >
        <Stop stopColor="#FFB114" offset="0%" />
        <Stop stopColor="#FF54BB" offset="63.5417%" />
        <Stop stopColor="#00F0FF" offset="100%" />
      </RadialGradient>
    </Defs>
    <Path
      d="M15,7 C19.418278,7 23,10.581722 23,15 C23,19.418278 19.418278,23 15,23 C10.581722,23 7,19.418278 7,15 C7,10.581722 10.581722,7 15,7 Z M15,8 C11.1340068,8 8,11.1340068 8,15 C8,18.8659932 11.1340068,22 15,22 C18.8659932,22 22,18.8659932 22,15 C22,11.1340068 18.8659932,8 15,8 Z M11,14.6563333 L15.6666667,14.6563333 L15.6666667,15.6563333 L11,15.6563333 L11,14.6563333 Z M14.6666667,9 L15.6666667,9 L15.6666667,15.3126667 L14.6666667,15.3126667 L14.6666667,9 Z"
      fill={color ? color : 'url(#rainbow)'}
      fillRule="nonzero"
    />
  </Svg>
);

EmojiRecentIcon.propTypes = {
  color: PropTypes.string,
};

EmojiRecentIcon.defaultProps = {
  color: null,
};

export default EmojiRecentIcon;
