import { StackActions, useTheme } from '@react-navigation/native';
import React, { createContext, useEffect, useMemo, useRef } from 'react';
import { findNodeHandle, NativeModules, StyleSheet, View } from 'react-native';
import Components from './screens';

export const ModalContext = createContext();

const sx = StyleSheet.create({
  container: {
    flex: 1,
  },
});

function usePrevious(value) {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

function ScreenView({ colors, descriptors, navigation, route, state }) {
  const { options, render: renderScene } = descriptors[route.key];
  const ref = useRef();
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
    shortFormHeight,
    showDragIndicator,
    springDamping,
    stackAnimation,
    stackPresentation = 'push',
    startFromShortForm,
    TEMPORARY_autoJumpToNewHeight,
    topOffset,
    transitionDuration,
  } = options;
  const prevLongFormHeight = usePrevious(longFormHeight);
  const prevShortFormHeight = usePrevious(shortFormHeight);

  const context = useMemo(
    () => ({
      jumpToLong: () => {
        const screen = findNodeHandle(ref.current);
        if (screen) {
          NativeModules.RNCMScreenManager.jumpTo(true, screen);
        }
      },
      jumpToShort: () => {
        const screen = findNodeHandle(ref.current);
        if (screen) {
          NativeModules.RNCMScreenManager.jumpTo(false, screen);
        }
      },
    }),
    []
  );

  // When 'TEMPORARY_autoJumpToNewHeight' option is enabled, automatically "jump" towards either
  // the new "longFormHeight" or new "shortFormHeight"
  useEffect(() => {
    if (
      TEMPORARY_autoJumpToNewHeight &&
      longFormHeight !== prevLongFormHeight
    ) {
      setImmediate(context.jumpToLong);
    } else if (
      TEMPORARY_autoJumpToNewHeight &&
      shortFormHeight !== prevShortFormHeight
    ) {
      setImmediate(context.jumpToShort);
    }
  }, [
    context,
    longFormHeight,
    prevLongFormHeight,
    prevShortFormHeight,
    shortFormHeight,
    TEMPORARY_autoJumpToNewHeight,
  ]);

  return (
    <ModalContext.Provider value={context}>
      <Components.Screen
        allowsDragToDismiss={allowsDragToDismiss}
        allowsTapToDismiss={allowsTapToDismiss}
        anchorModalToLongForm={anchorModalToLongForm}
        backgroundOpacity={backgroundOpacity}
        cornerRadius={cornerRadius}
        customStack={customStack}
        dismissable={dismissable}
        gestureEnabled={gestureEnabled}
        headerHeight={headerHeight}
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
      </Components.Screen>
    </ModalContext.Provider>
  );
}

export default function NativeStackView({ state, navigation, descriptors }) {
  const { colors } = useTheme();

  return (
    <Components.ScreenStack style={sx.container}>
      {state.routes.map((route, i) => (
        <ScreenView
          colors={colors}
          descriptors={descriptors}
          key={`screen${i}`}
          navigation={navigation}
          route={route}
          state={state}
        />
      ))}
    </Components.ScreenStack>
  );
}
