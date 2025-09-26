import React from 'react';
import { ViewProps } from 'react-native';
import Animated, { AnimatedProps, AnimatedStyle, Easing, FadeIn, FadeOut } from 'react-native-reanimated';
import { useRoute } from '@/navigation/Navigation';
import { Route } from '@/navigation/routesNames';
import { useNavigationStore } from '@/state/navigation/navigationStore';

type MountWhenFocusedProps = {
  children: React.ReactNode;
  /**
   * The route that must be active for the component to mount.
   * @default useRoute().name
   */
  route?: Route;
} & (
  | {
      animated?: false;
      entering?: undefined;
      exiting?: undefined;
      style?: undefined;
    }
  | {
      animated: true;
      entering?: AnimatedProps<ViewProps>['entering'];
      exiting?: AnimatedProps<ViewProps>['exiting'];
      style?: AnimatedStyle;
    }
);

const ANIMATION_CONFIG = Object.freeze({
  duration: 300,
  easing: Easing.bezier(0.22, 1, 0.36, 1).factory(),
});

export const DEFAULT_MOUNT_ANIMATIONS = Object.freeze({
  entering: FadeIn.duration(ANIMATION_CONFIG.duration).easing(ANIMATION_CONFIG.easing),
  exiting: FadeOut.duration(ANIMATION_CONFIG.duration).easing(ANIMATION_CONFIG.easing),
});

export const MountWhenFocused = ({
  animated = true,
  children,
  entering = DEFAULT_MOUNT_ANIMATIONS.entering,
  exiting = DEFAULT_MOUNT_ANIMATIONS.exiting,
  route,
  style,
}: MountWhenFocusedProps) => {
  const currentRoute = useRoute().name;
  const isRouteActive = useNavigationStore(state => state.isRouteActive(route ?? currentRoute));

  if (!isRouteActive) return null;
  if (!animated) return children;

  return (
    <Animated.View entering={entering} exiting={exiting} style={style}>
      {children}
    </Animated.View>
  );
};
