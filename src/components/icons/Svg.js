import Animated from 'react-native-reanimated';
import {
  compose,
  mapProps,
  omitProps,
  toClass,
} from 'recompact';
import SvgPrimitive from 'svgs';
import { reduceArrayToObject } from '../../utils';

const BlacklistedSVGProps = ['direction'];

const Svg = compose(
  omitProps(...BlacklistedSVGProps),
  mapProps(({ style, ...props }) => ({
    ...props,
    style: reduceArrayToObject(style),
  })),
)(SvgPrimitive);

export const AnimatedSvg = Animated.createAnimatedComponent(toClass(Svg));

export default Svg;
