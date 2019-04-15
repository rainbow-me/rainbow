import Animated from 'react-native-reanimated';
import {
  compose,
  mapProps,
  omitProps,
  toClass,
} from 'recompact';
import SvgPrimitive from 'svgs';
import { reduceStylesArrayToObject } from '../../utils';

const BlacklistedSVGProps = ['direction'];

const Svg = compose(
  omitProps(...BlacklistedSVGProps),
  mapProps(({ style, ...props }) => ({
    ...props,
    style: reduceStylesArrayToObject(style),
  })),
)(SvgPrimitive);

export const AnimatedSvg = Animated.createAnimatedComponent(toClass(Svg));

export default Svg;
