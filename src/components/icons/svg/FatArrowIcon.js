import React from 'react';
import Animated from 'react-native-reanimated';
import { Path } from 'react-native-svg';
import Svg from '../Svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const FatArrowIcon = ({ color, colors, ...props }, ref) => (
  <AnimatedSvg fill={color} height="18" ref={ref} viewBox="0 0 15 18" width="15" {...props}>
    <AnimatedPath
      d="M7.50464 17.2384C6.66873 17.2384 6.10217 16.6518 6.10217 15.788V6.24149L6.19505 4.22601L4.44892 6.25077L2.33127 8.36842C2.07121 8.61919 1.74613 8.80495 1.32817 8.80495C0.575851 8.80495 0 8.25697 0 7.4582C0 7.09597 0.148607 6.75232 0.436533 6.45511L6.47368 0.417957C6.73375 0.157895 7.12384 0 7.50464 0C7.88545 0 8.27554 0.157895 8.5356 0.417957L14.5635 6.45511C14.8514 6.75232 15 7.09597 15 7.4582C15 8.25697 14.4241 8.80495 13.6718 8.80495C13.2539 8.80495 12.9288 8.61919 12.678 8.36842L10.5604 6.25077L8.81424 4.22601L8.89783 6.24149V15.788C8.89783 16.6518 8.34056 17.2384 7.50464 17.2384Z"
      fill={color || colors.black}
    />
  </AnimatedSvg>
);

export default React.forwardRef(FatArrowIcon);
