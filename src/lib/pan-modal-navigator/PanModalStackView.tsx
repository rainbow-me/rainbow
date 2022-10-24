import {
  StackActions,
  StackNavigationState,
  Theme,
  useTheme,
} from '@react-navigation/native';
import React, { createContext, useMemo, useRef } from 'react';
import { findNodeHandle, NativeModules, StyleSheet, View } from 'react-native';
import PanModalScreenStackNativeComponent from './native-components/PanModalScreenStackNativeComponent';
import PanModalScreenNativeComponent from './native-components/PanModalScreenNativeComponent';
import {
  StackDescriptorMap,
  StackNavigationHelpers,
} from '@react-navigation/stack/src/types';

type ContextType = {
  jumpToLong: () => void;
  jumpToShort: () => void;
  layout: () => void;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

const defaultContextValue: ContextType = {
  jumpToShort: noop,
  jumpToLong: noop,
  layout: noop,
};

export const ModalContext = createContext<ContextType>(defaultContextValue);

const sx = StyleSheet.create({
  container: {
    flex: 1,
  },
});

const PanModalScreenManager = NativeModules.RNCMScreenManager;

type ScreenViewProps = {
  colors: Theme['colors'];
};

function ScreenView({
  colors,
  descriptors,
  navigation,
  route,
  state,
  hidden,
}: // TODO: FIX TS
ScreenViewProps & any) {
  const { options, render: renderScene } = descriptors[route.key];
  // TODO: FIX TS
  const ref = useRef<any>();
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
      jumpToLong: () => {
        const screen = findNodeHandle(ref.current);
        if (screen) {
          PanModalScreenManager.jumpTo(true, screen);
        }
      },
      jumpToShort: () => {
        const screen = findNodeHandle(ref.current);
        if (screen) {
          PanModalScreenManager.jumpTo(false, screen);
        }
      },
      layout: () => {
        const screen = findNodeHandle(ref.current);
        if (screen) {
          PanModalScreenManager.layout(screen);
        }
      },
    }),
    []
  );

  if (single && state.routes.length > 2) {
    return null;
  }

  return (
    <ModalContext.Provider value={context}>
      <PanModalScreenNativeComponent
        // TODO: FIX TS
        // @ts-ignore
        allowsDragToDismiss={allowsDragToDismiss}
        allowsTapToDismiss={allowsTapToDismiss}
        anchorModalToLongForm={anchorModalToLongForm}
        backgroundOpacity={backgroundOpacity}
        cornerRadius={cornerRadius}
        customStack={customStack}
        disableShortFormAfterTransitionToLongForm={
          disableShortFormAfterTransitionToLongForm
        }
        dismissable={dismissable}
        gestureEnabled={gestureEnabled}
        headerHeight={headerHeight}
        hidden={hidden}
        ignoreBottomOffset={ignoreBottomOffset}
        interactWithScrollView={interactWithScrollView}
        isShortFormEnabled={isShortFormEnabled}
        key={route.key}
        longFormHeight={longFormHeight}
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
        onFinishTransitioning={() => {
          navigation?.emit?.({
            target: route.key,
            type: 'finishTransitioning',
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
              backgroundColor:
                stackPresentation !== 'transparentModal'
                  ? colors.background
                  : undefined,
            },
            contentStyle,
          ]}
        >
          {renderScene()}
        </View>
      </PanModalScreenNativeComponent>
    </ModalContext.Provider>
  );
}

type PanModalStackViewProps = {
  state: StackNavigationState;
  navigation: StackNavigationHelpers;
  descriptors: StackDescriptorMap;
};

export default function PanModalStackView({
  state,
  navigation,
  descriptors,
}: PanModalStackViewProps) {
  const { colors } = useTheme();

  // TODO: FIX TS
  const nonSingleRoutesLength = state.routes.filter(route => {
    const { options } = descriptors[route.key];
    // TODO: FIX TS
    // @ts-ignore
    return !options.single;
  }).length;

  return (
    <PanModalScreenStackNativeComponent style={sx.container}>
      {state.routes.map((route, i) => {
        const { options } = descriptors[route.key];
        // TODO: FIX TS
        // @ts-ignore
        const { limitActiveModals } = options;
        console.log(JSON.stringify(colors));
        return (
          <ScreenView
            colors={colors}
            // TODO: FIX TS
            // @ts-ignore
            descriptors={descriptors}
            hidden={
              limitActiveModals && nonSingleRoutesLength - 3 >= i && i !== 0
            }
            key={`screen${i}`}
            navigation={navigation}
            route={route}
            state={state}
          />
        );
      })}
    </PanModalScreenStackNativeComponent>
  );
}
