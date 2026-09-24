import React from 'react';
import { Dimensions, StyleSheet, View, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';

import {
  StackActions,
  useTheme,
  type NavigationHelpers,
  type ParamListBase,
  type StackActionHelpers,
  type StackNavigationState,
} from '@react-navigation/native';
import type { StackNavigationEventMap, StackNavigationOptions } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CoolModalScreen, { type NativeProps } from './specs/NativeCoolModalScreen';
import CoolModalScreenStack from './specs/NativeCoolModalScreenStack';

type CoolModalNativeOptions = Pick<
  NativeProps,
  | 'allowsDragToDismiss'
  | 'allowsTapToDismiss'
  | 'anchorModalToLongForm'
  | 'backgroundOpacity'
  | 'cornerRadius'
  | 'customStack'
  | 'disableShortFormAfterTransitionToLongForm'
  | 'dismissable'
  | 'headerHeight'
  | 'ignoreBottomOffset'
  | 'interactWithScrollView'
  | 'isShortFormEnabled'
  | 'longFormHeight'
  | 'onTouchTop'
  | 'onWillDismiss'
  | 'relevantScrollViewDepth'
  | 'shortFormHeight'
  | 'showDragIndicator'
  | 'springDamping'
  | 'stackAnimation'
  | 'stackPresentation'
  | 'startFromShortForm'
  | 'topOffset'
  | 'transitionDuration'
>;

export type CoolModalNavigationOptions = StackNavigationOptions &
  CoolModalNativeOptions & {
    backgroundColor?: ColorValue;
    contentStyle?: StyleProp<ViewStyle>;
    limitActiveModals?: boolean;
    onAppear?: () => void;
    onDismissed?: () => void;
    single?: boolean;
  };

export type CoolModalNavigationEventMap = StackNavigationEventMap & {
  appear: { data: undefined };
  dismiss: { data: undefined };
  finishTransitioning: { data: undefined };
};

type CoolModalNavigationState = StackNavigationState<ParamListBase>;
type CoolModalNavigationHelpers = NavigationHelpers<ParamListBase, CoolModalNavigationEventMap> & StackActionHelpers<ParamListBase>;
type CoolModalRoute = CoolModalNavigationState['routes'][number];
type CoolModalDescriptor = {
  options: CoolModalNavigationOptions;
  render: () => React.ReactNode;
};
type CoolModalDescriptorMap = Record<string, CoolModalDescriptor>;

const sx = StyleSheet.create({
  container: {
    flex: 1,
  },
});

type NativeStackViewProps = {
  colors: { background: string };
  descriptors: CoolModalDescriptorMap;
  navigation: CoolModalNavigationHelpers;
  route: CoolModalRoute;
  state: CoolModalNavigationState;
  hidden?: boolean;
};

function ScreenView({ colors, descriptors, navigation, route, state, hidden }: NativeStackViewProps) {
  const insets = useSafeAreaInsets();
  const descriptor = descriptors[route.key];

  const { options, render: renderScene } = descriptor;
  const {
    allowsDragToDismiss,
    allowsTapToDismiss,
    anchorModalToLongForm,
    backgroundColor,
    backgroundOpacity,
    contentStyle,
    cornerRadius,
    customStack,
    disableShortFormAfterTransitionToLongForm,
    dismissable,
    gestureEnabled,
    headerHeight,
    ignoreBottomOffset,
    interactWithScrollView,
    isShortFormEnabled,
    longFormHeight,
    onTouchTop,
    onWillDismiss,
    single,
    shortFormHeight,
    showDragIndicator,
    springDamping,
    stackAnimation,
    stackPresentation = 'push',
    relevantScrollViewDepth,
    startFromShortForm,
    topOffset,
    transitionDuration,
  } = options;

  if (single && state.routes.length > 2) {
    return null;
  }

  return (
    <CoolModalScreen
      allowsDragToDismiss={allowsDragToDismiss}
      allowsTapToDismiss={allowsTapToDismiss}
      anchorModalToLongForm={anchorModalToLongForm}
      backgroundOpacity={backgroundOpacity}
      cornerRadius={cornerRadius}
      customStack={customStack}
      disableShortFormAfterTransitionToLongForm={disableShortFormAfterTransitionToLongForm}
      dismissable={dismissable}
      gestureEnabled={gestureEnabled}
      headerHeight={headerHeight}
      hidden={hidden}
      ignoreBottomOffset={ignoreBottomOffset}
      interactWithScrollView={interactWithScrollView}
      isShortFormEnabled={isShortFormEnabled}
      key={route.key}
      // Slack sheet adds insets internally so for consistency with android remove them.
      longFormHeight={(longFormHeight != null ? longFormHeight - insets.bottom : undefined) ?? Dimensions.get('screen').height}
      modalBackgroundColor={backgroundColor}
      onAppear={() => {
        options.onAppear?.();
        navigation.emit({
          target: route.key,
          type: 'appear',
        });
      }}
      onDismissed={() => {
        options.onDismissed?.();
        navigation.emit({
          target: route.key,
          type: 'dismiss',
        });
        navigation.dispatch({
          ...StackActions.pop(),
          source: route.key,
          target: state.key,
        });
      }}
      onTouchTop={onTouchTop}
      onWillDismiss={onWillDismiss}
      relevantScrollViewDepth={relevantScrollViewDepth}
      shortFormHeight={shortFormHeight}
      showDragIndicator={showDragIndicator}
      springDamping={springDamping}
      stackAnimation={stackAnimation}
      stackPresentation={stackPresentation}
      startFromShortForm={startFromShortForm}
      style={StyleSheet.absoluteFill}
      topOffset={topOffset}
      transitionDuration={transitionDuration}
    >
      <View
        style={[
          sx.container,
          {
            backgroundColor: stackPresentation !== 'transparentModal' ? colors.background : undefined,
          },
          contentStyle,
        ]}
      >
        {renderScene()}
      </View>
    </CoolModalScreen>
  );
}

type NativeStackViewComponentProps = {
  state: CoolModalNavigationState;
  navigation: CoolModalNavigationHelpers;
  descriptors: CoolModalDescriptorMap;
};

export default function NativeStackView({ state, navigation, descriptors }: NativeStackViewComponentProps) {
  const { colors } = useTheme();

  let nonSingleRoutesLength = 0;
  for (const route of state.routes) {
    if (!descriptors[route.key].options.single) nonSingleRoutesLength += 1;
  }

  return (
    <CoolModalScreenStack
      style={sx.container}
      onFinishTransitioning={() => {
        navigation.emit({
          target: state.key,
          type: 'finishTransitioning',
        });
      }}
    >
      {state.routes.map((route, i) => {
        const { options } = descriptors[route.key];
        const { limitActiveModals } = options;
        return (
          <ScreenView
            colors={colors}
            descriptors={descriptors}
            hidden={limitActiveModals && nonSingleRoutesLength - 3 >= i && i !== 0}
            key={route.key}
            navigation={navigation}
            route={route}
            state={state}
          />
        );
      })}
    </CoolModalScreenStack>
  );
}
