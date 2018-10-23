import { Animated } from 'react-native';
import { get } from 'lodash';
import { isIphoneX } from 'react-native-iphone-x-helper';
import { deviceUtils, safeAreaInsetValues } from '../../utils';

export default function sheet(transitionProps, prevTransitionProps) {
  return {
    transitionSpec: {
      timing: Animated.spring,
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

      const nextEffect = get(transitionProps, 'scene.descriptor.options.effect');
      const prevEffect = get(prevTransitionProps, 'scene.descriptor.options.effect');
      const nextIndex = get(transitionProps, 'index');
      const prevIndex = get(prevTransitionProps, 'index', nextIndex - 1);

      const distanceFromTop = isIphoneX() ? 14 : 6;
      const scaleEnd = 1 - ((safeAreaInsetValues.top + distanceFromTop) / deviceUtils.dimensions.height);
      const heightEnd = safeAreaInsetValues.top + distanceFromTop;
      const borderRadiusEnd = 12;
      const borderRadiusScaledEnd = 12 / (1 - ((safeAreaInsetValues.top + distanceFromTop) / deviceUtils.dimensions.height));
      const opacityEnd = 0.5;

      if (nextEffect === 'sheet' && scene.index === prevIndex && nextIndex > prevIndex) {
        const translateY = position.interpolate({
          inputRange: [prevIndex, nextIndex],
          outputRange: [0, distanceFromTop],
        });

        const opacity = position.interpolate({
          inputRange: [prevIndex, nextIndex],
          outputRange: [1, opacityEnd],
        });

        const scale = position.interpolate({
          inputRange: [prevIndex, nextIndex],
          outputRange: [1, scaleEnd],
        });

        const borderRadius = position.interpolate({
          inputRange: [prevIndex, nextIndex],
          outputRange: [isIphoneX() ? 38.5 : 0, borderRadiusScaledEnd],
        });

        return {
          opacity,
          overflow: 'hidden',
          borderTopLeftRadius: borderRadius,
          borderTopRightRadius: borderRadius,
          transform: [{
            translateY,
          }, {
            scale,
          }],
          zIndex: 1,
        };
      }

      if (nextEffect === 'sheet' && scene.index === nextIndex && nextIndex > prevIndex) {
        const height = layout.initHeight;
        const translateY = position.interpolate({
          inputRange: [prevIndex, nextIndex],
          outputRange: [height, heightEnd],
        });

        return {
          overflow: 'hidden',
          borderTopLeftRadius: borderRadiusEnd,
          borderTopRightRadius: borderRadiusEnd,
          height: height - heightEnd,
          transform: [{
            translateY,
          }],
          zIndex: 2,
        };
      }

      if (prevEffect === 'sheet' && scene.index === nextIndex && nextIndex < prevIndex) {
        const opacity = position.interpolate({
          inputRange: [nextIndex, prevIndex],
          outputRange: [1, opacityEnd],
        });

        const scale = position.interpolate({
          inputRange: [nextIndex, prevIndex],
          outputRange: [1, scaleEnd],
        });

        const borderRadius = position.interpolate({
          inputRange: [nextIndex, prevIndex],
          outputRange: [0, borderRadiusEnd],
        });

        return {
          opacity,
          overflow: 'hidden',
          borderTopLeftRadius: borderRadius,
          borderTopRightRadius: borderRadius,
          transform: [{
            scale,
          }],
          zIndex: 1,
        };
      }

      if (prevEffect === 'sheet' && scene.index === prevIndex && nextIndex < prevIndex) {
        const height = layout.initHeight;
        const translateY = position.interpolate({
          inputRange: [nextIndex, prevIndex],
          outputRange: [height, heightEnd],
        });

        return {
          overflow: 'hidden',
          borderTopLeftRadius: borderRadiusEnd,
          borderTopRightRadius: borderRadiusEnd,
          height: height - heightEnd,
          transform: [{
            translateY,
          }],
          zIndex: 2,
        };
      }

      if ((prevEffect === 'sheet' && scene.index === prevIndex) || (nextEffect === 'sheet' && scene.index === nextIndex)) {
        const height = layout.initHeight;
        const width = layout.initWidth;
        const translateX = position.interpolate({
          inputRange: [scene.index - 1, scene.index],
          outputRange: [width, 0],
        });

        return {
          overflow: 'hidden',
          borderTopLeftRadius: borderRadiusEnd,
          borderTopRightRadius: borderRadiusEnd,
          height: height - heightEnd,
          transform: [{
            translateX,
          }, {
            translateY: heightEnd,
          }],
          zIndex: 2,
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
