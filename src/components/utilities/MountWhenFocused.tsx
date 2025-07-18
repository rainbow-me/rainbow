import React from 'react';
import { ViewProps } from 'react-native';
import Animated, { AnimatedProps, AnimatedStyle, Easing, FadeIn, FadeOut } from 'react-native-reanimated';
import { Route, UseRoute } from '@/navigation/routesNames';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { useRoute } from '@react-navigation/native';

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

const DEFAULTS = {
  duration: 300,
  easing: Easing.bezier(0.22, 1, 0.36, 1).factory(),
};

export const MountWhenFocused = ({
  animated = true,
  children,
  entering = FadeIn.duration(DEFAULTS.duration).easing(DEFAULTS.easing),
  exiting = FadeOut.duration(DEFAULTS.duration).easing(DEFAULTS.easing),
  route,
  style,
}: MountWhenFocusedProps) => {
  const currentRoute = useRoute<UseRoute>().name;
  const isRouteActive = useNavigationStore(state => state.isRouteActive(route ?? currentRoute));

  if (!isRouteActive) return null;
  if (!animated) return children;

  return (
    <Animated.View entering={entering} exiting={exiting} style={style}>
      {children}
    </Animated.View>
  );
};
