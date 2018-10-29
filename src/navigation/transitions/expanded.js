import { Animated } from 'react-native';
import { get } from 'lodash';

export const transitionName = 'expanded';

export default function expanded(transitionProps, prevTransitionProps) {
  const nextEffect = get(transitionProps, 'scene.descriptor.options.effect');
  const prevEffect = get(prevTransitionProps, 'scene.descriptor.options.effect');
  const nextIndex = get(transitionProps, 'index');
  const prevIndex = get(prevTransitionProps, 'index', nextIndex - 1);

  return {
    transitionSpec: {
      timing: nextEffect === transitionName && nextIndex > prevIndex ? Animated.spring : Animated.timing,
      tension: 58,
      friction: 9.8,
      useNativeDriver: true,
    },
    screenInterpolator: (sceneProps = {}) => {
      const {
        layout,
        position,
        scene,
      } = sceneProps;

      const opacityEnd = 0.25;

      if (nextEffect === transitionName && scene.index === prevIndex && nextIndex > prevIndex) {
        const opacity = position.interpolate({
          inputRange: [prevIndex, nextIndex],
          outputRange: [1, opacityEnd],
        });

        return {
          opacity,
          overflow: 'hidden',
        };
      }

      if (nextEffect === transitionName && scene.index === nextIndex && nextIndex > prevIndex) {
        const scale = position.interpolate({
          inputRange: [prevIndex, nextIndex],
          outputRange: [0, 1],
        });

        return {
          overflow: 'hidden',
          transform: [{
            scale,
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
          overflow: 'hidden',
        };
      }

      if (prevEffect === transitionName && scene.index === prevIndex && nextIndex < prevIndex) {
        const scale = position.interpolate({
          inputRange: [nextIndex, prevIndex],
          outputRange: [0, 1],
        });

        return {
          overflow: 'hidden',
          transform: [{
            scale,
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
