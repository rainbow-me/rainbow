import { Animated, Easing } from 'react-native';
import { get } from 'lodash';

export default function sheet() {
  return {
    transitionSpec: {
      duration: 750,
      easing: Easing.out(Easing.poly(4)),
      timing: Animated.timing,
      useNativeDriver: true,
    },
    screenInterpolator: (sceneProps = {}) => {
      const {
        layout,
        position,
        scene,
        scenes,
      } = sceneProps;

      const effect = get(sceneProps, 'scene.descriptor.options.effect');
      const nextEffect = get(sceneProps, `scenes[${scenes.length - 1}].descriptor.options.effect`);

      if (nextEffect === 'sheet') {
        if (effect === 'sheet') {
          const height = layout.initHeight;
          const translateY = position.interpolate({
            inputRange: [scene.index - 1, scene.index],
            outputRange: [height, 40],
          });

          return {
            overflow: 'hidden',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            height: height - 40,
            transform: [{
              translateY,
            }],
          };
        }

        const opacity = position.interpolate({
          inputRange: [scene.index - 1, scene.index],
          outputRange: [1, 0.75],
        });

        const scale = position.interpolate({
          inputRange: [scene.index - 1, scene.index],
          outputRange: [1, 0.96],
        });

        const borderRadius = position.interpolate({
          inputRange: [scene.index - 1, scene.index],
          outputRange: [0, 10],
        });

        return {
          opacity,
          overflow: 'hidden',
          borderTopLeftRadius: borderRadius,
          borderTopRightRadius: borderRadius,
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
        transform: [{
          translateX,
        }],
      };
    },
  };
}
