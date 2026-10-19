import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NativeScreen, NativeScreenStack } from './screens';
import {
  type NativeScreenProps,
  type NativeStackDescriptor,
  type NativeStackDescriptors,
  type NativeStackNavigation,
  type NativeStackNavigatorProps,
  type NativeStackRoute,
  type NativeStackState,
} from './types';

type StackProps = {
  descriptors: NativeStackDescriptors;
  navigation: NativeStackNavigation;
  onPresentationApplied?: NativeStackNavigatorProps['onPresentationApplied'];
  state: NativeStackState;
};
type ScreenProps = {
  colors: { background: string };
  descriptor: NativeStackDescriptor;
  inStack: boolean;
  navigatorKey: string;
  onDismissed: (descriptor: NativeStackDescriptor, request: number) => void;
  onPresentationApplied?: NativeStackNavigatorProps['onPresentationApplied'];
};

const sx = StyleSheet.create({
  container: {
    flex: 1,
  },
});

function ScreenView({ colors, descriptor, inStack, navigatorKey, onDismissed, onPresentationApplied }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { options, render: renderScene, route } = descriptor;
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
    limitActiveModals,
    longFormHeight,
    onTouchTop,
    onWillDismiss,
    shortFormHeight,
    springDamping,
    stackAnimation,
    stackPresentation = 'push',
    startFromShortForm,
    topOffset,
    transitionDuration,
  } = options;

  const acknowledgePresentation: NonNullable<NativeScreenProps['onPresentationApplied']> = ({ nativeEvent: { presentationRequest } }) => {
    onPresentationApplied?.(navigatorKey, route.key, presentationRequest);
  };

  return (
    <NativeScreen
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
      ignoreBottomOffset={ignoreBottomOffset}
      inStack={inStack}
      interactWithScrollView={interactWithScrollView}
      isShortFormEnabled={isShortFormEnabled}
      limitActiveModals={limitActiveModals}
      // PanModal adds the bottom inset internally
      longFormHeight={longFormHeight != null ? longFormHeight - insets.bottom : undefined}
      modalBackgroundColor={backgroundColor}
      onAppear={event => {
        acknowledgePresentation(event);
        options.onAppear?.();
      }}
      onDismissed={({ nativeEvent: { presentationRequest } }) => onDismissed(descriptor, presentationRequest)}
      onPresentationApplied={acknowledgePresentation}
      onTouchTop={onTouchTop}
      onWillDismiss={onWillDismiss}
      presentationRequest={route.presentationRequest ?? 0}
      shortFormHeight={shortFormHeight}
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
    </NativeScreen>
  );
}

type MountedStackState = {
  descriptors: NativeStackDescriptors;
  previousDescriptors: NativeStackDescriptors;
  routes: NativeStackRoute[];
};

class MountedStack extends React.Component<StackProps & { colors: { background: string } }, MountedStackState> {
  state: MountedStackState = {
    descriptors: this.props.descriptors,
    previousDescriptors: this.props.descriptors,
    routes: this.props.state.routes,
  };

  static getDerivedStateFromProps(props: StackProps, state: MountedStackState): MountedStackState | null {
    if (props.descriptors === state.previousDescriptors) return null;

    let routes = props.state.routes;
    let descriptors = props.descriptors;
    // Keep outgoing screens mounted until their native dismissal completes
    if (routes !== state.routes) {
      for (const route of state.routes) {
        if (Object.hasOwn(props.descriptors, route.key)) continue;
        if (routes === props.state.routes) {
          routes = routes.slice();
          descriptors = { ...descriptors };
        }
        routes.push(route);
        descriptors[route.key] = state.descriptors[route.key];
      }
    }

    return { descriptors, previousDescriptors: props.descriptors, routes };
  }

  private handleDismissed = (descriptor: NativeStackDescriptor, request: number): void => {
    const { navigation, state } = this.props;
    const { route } = descriptor;
    const current: NativeStackRoute | undefined = navigation.getState().routes.find(current => current.key === route.key);
    if (current && (current.presentationRequest ?? 0) !== request) return;

    if (current) {
      descriptor.options.onDismissed?.();
      navigation.emit({ target: route.key, type: 'dismiss' });
      navigation.dispatch({ type: 'NATIVE_DISMISS', payload: { presentationRequest: request }, source: route.key, target: state.key });

      const remaining: NativeStackRoute | undefined = navigation.getState().routes.find(current => current.key === route.key);
      if (remaining) {
        // A newer request or a beforeRemove listener kept this route
        if ((remaining.presentationRequest ?? 0) === request) {
          navigation.dispatch({ type: 'NATIVE_RESTORE', payload: { presentationRequest: request }, source: route.key, target: state.key });
        }
        return;
      }
    }

    this.setState(({ descriptors, routes }) => {
      if (!Object.hasOwn(descriptors, route.key)) return null;
      if ((descriptors[route.key].route.presentationRequest ?? 0) !== request) return null;
      const remainingDescriptors = { ...descriptors };
      delete remainingDescriptors[route.key];
      return {
        descriptors: remainingDescriptors,
        routes: routes.filter(current => current.key !== route.key),
      };
    });
  };

  render(): React.JSX.Element {
    const { colors, descriptors, onPresentationApplied, state } = this.props;
    return (
      <NativeScreenStack style={sx.container}>
        {this.state.routes.map(route => (
          <ScreenView
            colors={colors}
            descriptor={this.state.descriptors[route.key]}
            inStack={Object.hasOwn(descriptors, route.key)}
            key={route.key}
            navigatorKey={state.key}
            onDismissed={this.handleDismissed}
            onPresentationApplied={onPresentationApplied}
          />
        ))}
      </NativeScreenStack>
    );
  }
}

export default function NativeStackView(props: StackProps): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <MountedStack
      colors={colors}
      descriptors={props.descriptors}
      navigation={props.navigation}
      onPresentationApplied={props.onPresentationApplied}
      state={props.state}
    />
  );
}
