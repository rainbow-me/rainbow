import { StackActions, useTheme } from '@react-navigation/native';
import React, { createContext, useMemo, useRef } from 'react';
import { Dimensions, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Components from './screens';

type ModalContextValue = {
  layout: () => void;
};

export const ModalContext = createContext<ModalContextValue | undefined>(undefined);

const sx = StyleSheet.create({
  container: {
    flex: 1,
  },
});

type Descriptor = {
  key?: string;
  options: Record<string, any>;
  render: () => React.ReactNode;
};

type Route = {
  key: string;
  name: string;
};

type NavigationHelpersLike = {
  emit?: (event: { target: string; type: string }) => void;
  dispatch?: (action: any) => void;
  addListener?: (type: string, listener: (e: any) => void) => void;
  isFocused?: () => boolean;
};

type NativeStackViewProps = {
  colors: { background: string };
  descriptors: Record<string, Descriptor>;
  navigation: NavigationHelpersLike;
  route: Route;
  state: { routes: Route[]; index: number; key: string };
  hidden?: boolean;
};

function ScreenView({ colors, descriptors, navigation, route, state, hidden }: NativeStackViewProps) {
  const insets = useSafeAreaInsets();
  const descriptor = descriptors[route.key];

  const { options = {}, render: renderScene } = descriptor;
  const ref = useRef<React.ComponentRef<typeof Components.Screen> | null>(null);
  const {
    allowsDragToDismiss,
    allowsTapToDismiss,
    anchorModalToLongForm,
    backgroundColor,
    backgroundOpacity,
    contentStyle,
    cornerRadius,
    customStack,
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
    disableShortFormAfterTransitionToLongForm,
  } = options;

  const context = useMemo(
    () => ({
      layout: () => {
        // TODO: Is this needed?
      },
    }),
    []
  );

  if (single && state.routes.length > 2) {
    return null;
  }

  return (
    <ModalContext.Provider value={context}>
      <Components.Screen
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
          options?.onAppear?.();
          navigation?.emit?.({
            target: route.key,
            type: 'appear',
          });
        }}
        onDismissed={() => {
          options?.onDismissed?.();
          navigation?.emit?.({
            target: route.key,
            type: 'dismiss',
          });
          navigation?.dispatch?.({
            ...StackActions.pop(),
            source: route.key,
            target: state.key,
          });
        }}
        onTouchTop={onTouchTop}
        onWillDismiss={onWillDismiss}
        ref={ref}
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
            contentStyle as StyleProp<ViewStyle>,
          ]}
        >
          {renderScene()}
        </View>
      </Components.Screen>
    </ModalContext.Provider>
  );
}

type NativeStackViewComponentProps = {
  state: { routes: Route[]; index: number; key: string };
  navigation: NavigationHelpersLike;
  descriptors: Record<string, Descriptor>;
} & Record<string, unknown>;

export default function NativeStackView({ state, navigation, descriptors }: NativeStackViewComponentProps) {
  const { colors } = useTheme();

  const nonSingleRoutesLength = state.routes.filter(route => {
    const { options = {} } = descriptors[route.key] ?? {};
    return !options.single;
  }).length;

  return (
    <Components.ScreenStack
      style={sx.container}
      onFinishTransitioning={() => {
        navigation?.emit?.({
          target: state.key,
          type: 'finishTransitioning',
        });
      }}
    >
      {state.routes.map((route, i) => {
        const { options = {} } = descriptors[route.key] ?? {};
        const { limitActiveModals } = options;
        return (
          <ScreenView
            colors={colors}
            descriptors={descriptors}
            hidden={limitActiveModals && nonSingleRoutesLength - 3 >= i && i !== 0}
            key={`screen${i}`}
            navigation={navigation}
            route={route}
            state={state}
          />
        );
      })}
    </Components.ScreenStack>
  );
}
