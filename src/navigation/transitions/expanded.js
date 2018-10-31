import { Animated } from 'react-native';
import { get } from 'lodash';
import { deviceUtils } from '../../utils';

export const transitionName = 'expanded';

export default function expanded(navigation, transitionProps, prevTransitionProps) {
  const nextEffect = get(transitionProps, 'scene.descriptor.options.effect');
  const prevEffect = get(prevTransitionProps, 'scene.descriptor.options.effect');
  const nextIndex = get(transitionProps, 'index');
  const prevIndex = get(prevTransitionProps, 'index', nextIndex - 1);

  return {
    transitionSpec: {
      timing: nextEffect === transitionName && nextIndex > prevIndex ? Animated.spring : Animated.timing,
      tension: 100,
      friction: 9.8,
      useNativeDriver: true,
    },
    screenInterpolator: (sceneProps = {}) => {
      const {
        layout,
        position,
        scene,
      } = sceneProps;

      navigation.setTransitionPosition(position);

      const opacityEnd = 0.75;
      const translateYStart = deviceUtils.dimensions.height;

      if (nextEffect === transitionName && scene.index === prevIndex && nextIndex > prevIndex) {
        const opacity = position.interpolate({
          inputRange: [prevIndex, nextIndex],
          outputRange: [1, opacityEnd],
        });

        return {
          opacity,
        };
      }

      if (nextEffect === transitionName && scene.index === nextIndex && nextIndex > prevIndex) {
        const translateY = position.interpolate({
          inputRange: [prevIndex, nextIndex],
          outputRange: [translateYStart, 0],
        });

        return {
          transform: [{
            translateY,
          }],
        };
      }

      if (prevEffect === transitionName && scene.index === nextIndex && nextIndex < prevIndex) {
        const opacity = position.interpolate({
          inputRange: [nextIndex, prevIndex],
          outputRange: [1, opacityEnd],
        });

        return {
          opacity,
        };
      }

      if (prevEffect === transitionName && scene.index === prevIndex && nextIndex < prevIndex) {
        const translateY = position.interpolate({
          inputRange: [nextIndex, prevIndex],
          outputRange: [translateYStart, 0],
        });

        return {
          transform: [{
            translateY,
          }],
        };
      }

      const width = layout.initWidth;
      const translateX = position.interpolate({
        inputRange: [scene.index - 1, scene.index],
        outputRange: [width, 0],
      });

      return {
        overflow: 'hidden',
        transform: [{
          translateX,
        }],
      };
    },
  };
}
