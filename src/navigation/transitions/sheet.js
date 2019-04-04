import { get } from 'lodash';
import { Animated } from 'react-native';
import { getStatusBarHeight, isIphoneX } from 'react-native-iphone-x-helper';
import { updateTransitionProps } from '../../redux/navigation';
import store from '../../redux/store';
import { colors } from '../../styles';
import { deviceUtils, statusBar } from '../../utils';

const distanceFromTop = 14;
const statusBarHeight = getStatusBarHeight(true);

export const sheetVerticalOffset = distanceFromTop + statusBarHeight;
export const transitionName = 'sheet';

export default function sheet(navigation, transitionProps, prevTransitionProps) {
  const nextEffect = get(transitionProps, 'scene.descriptor.options.effect');
  const prevEffect = get(prevTransitionProps, 'scene.descriptor.options.effect');
  const nextIndex = get(transitionProps, 'index');
  const prevIndex = get(prevTransitionProps, 'index', nextIndex - 1);

  if (nextEffect === transitionName) {
    statusBar.setBarStyle('light-content', true);
  }

  if (prevEffect === transitionName) {
    statusBar.setBarStyle('dark-content', true);
  }

  return {
    containerStyle: {
      backgroundColor: colors.black,
      opacity: 1,
    },
    screenInterpolator: (sceneProps = {}) => {
      const {
        layout,
        position,
        scene,
      } = sceneProps;

      store.dispatch(updateTransitionProps({
        effect: transitionName,
        nextIndex,
        position,
        prevIndex,
      }));

      const scaleEnd = 1 - ((statusBarHeight + (isIphoneX() ? distanceFromTop : 0)) / deviceUtils.dimensions.height);
      const heightEnd = statusBarHeight + distanceFromTop;
      const borderRadiusEnd = 12;
      const borderRadiusScaledEnd = borderRadiusEnd / scaleEnd;
      const opacityEnd = 0.5;

      if (nextEffect === transitionName && scene.index === prevIndex && nextIndex > prevIndex) {
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
          borderTopLeftRadius: borderRadius,
          borderTopRightRadius: borderRadius,
          opacity,
          overflow: 'hidden',
          transform: [{
            translateY,
          }, {
            scale,
          }],
          zIndex: 1,
        };
      }

      if (nextEffect === transitionName && scene.index === nextIndex && nextIndex > prevIndex) {
        const height = layout.initHeight;
        const translateY = position.interpolate({
          inputRange: [prevIndex, nextIndex],
          outputRange: [height, heightEnd],
        });

        return {
          borderTopLeftRadius: borderRadiusEnd,
          borderTopRightRadius: borderRadiusEnd,
          height: height - heightEnd,
          overflow: 'hidden',
          transform: [{
            translateY,
          }],
          zIndex: 2,
        };
      }

      if (prevEffect === transitionName && scene.index === nextIndex && nextIndex < prevIndex) {
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
          borderTopLeftRadius: borderRadius,
          borderTopRightRadius: borderRadius,
          opacity,
          overflow: 'hidden',
          transform: [{
            scale,
          }],
          zIndex: 1,
        };
      }

      if (prevEffect === transitionName && scene.index === prevIndex && nextIndex < prevIndex) {
        const height = layout.initHeight;
        const translateY = position.interpolate({
          inputRange: [nextIndex, prevIndex],
          outputRange: [height, heightEnd],
        });

        return {
          borderTopLeftRadius: borderRadiusEnd,
          borderTopRightRadius: borderRadiusEnd,
          height: height - heightEnd,
          overflow: 'hidden',
          transform: [{
            translateY,
          }],
          zIndex: 2,
        };
      }

      if ((prevEffect === transitionName && scene.index === prevIndex) || (nextEffect === transitionName && scene.index === nextIndex)) {
        const height = layout.initHeight;
        const width = layout.initWidth;
        const translateX = position.interpolate({
          inputRange: [scene.index - 1, scene.index],
          outputRange: [width, 0],
        });

        return {
          borderTopLeftRadius: borderRadiusEnd,
          borderTopRightRadius: borderRadiusEnd,
          height: height - heightEnd,
          overflow: 'hidden',
          transform: [{
            translateX,
          }, {
            translateY: heightEnd,
          }],
          zIndex: 2,
        };
      }

      if (nextEffect === transitionName && prevIndex > nextIndex && scene.index === nextIndex - 1) {
        const width = layout.initWidth;
        const translateX = position.interpolate({
          inputRange: [nextIndex - 1, nextIndex],
          outputRange: [width, 0],
        });

        return {
          borderTopLeftRadius: borderRadiusEnd,
          borderTopRightRadius: borderRadiusEnd,
          opacity: opacityEnd,
          overflow: 'hidden',
          transform: [{
            translateX,
          }, {
            translateY: distanceFromTop,
          }, {
            scale: scaleEnd,
          }],
        };
      }

      if (prevEffect === transitionName && prevIndex < nextIndex && scene.index === prevIndex - 1) {
        const width = layout.initWidth;
        const translateX = position.interpolate({
          inputRange: [prevIndex - 1, prevIndex],
          outputRange: [width, 0],
        });

        return {
          borderTopLeftRadius: borderRadiusEnd,
          borderTopRightRadius: borderRadiusEnd,
          opacity: opacityEnd,
          overflow: 'hidden',
          transform: [{
            translateX,
          }, {
            translateY: distanceFromTop,
          }, {
            scale: scaleEnd,
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
    transitionSpec: {
      friction: 9.8,
      tension: 58,
      timing: ((nextEffect === transitionName) && (nextIndex > prevIndex)) ? Animated.spring : Animated.timing,
      useNativeDriver: true,
    },
  };
}
