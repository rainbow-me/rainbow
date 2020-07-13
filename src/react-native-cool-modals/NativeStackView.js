import { StackActions, useTheme } from '@react-navigation/native';
import React, { createContext, useCallback, useMemo, useRef } from 'react';
import { findNodeHandle, NativeModules, StyleSheet, View } from 'react-native';
import Components from './screens';

export const ModalContext = createContext();

const sx = StyleSheet.create({
  container: {
    flex: 1,
  },
});

function ScreenView({ colors, descriptors, navigation, route, state }) {
  const ref = useRef();

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

  const { options, render: renderScene } = descriptors[route.key];
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
    isShortFormEnabled,
    longFormHeight,
    onAppear,
    onDismissed,
    onTouchTop,
    onWillDismiss,
    shortFormHeight,
    showDragIndicator,
    springDamping,
    stackAnimation,
    stackPresentation = 'push',
    startFromShortForm,
    topOffset,
    transitionDuration,
  } = options;

  const contentStyles = useMemo(
    () => [
      sx.container,
      {
        backgroundColor:
          stackPresentation !== 'transparentModal'
            ? colors.background
            : undefined,
      },
      contentStyle,
    ],
    [colors.background, contentStyle, stackPresentation]
  );

  const handleAppear = useCallback(() => {
    if (onAppear) {
      onAppear();
    }
    navigation.emit({
      target: route.key,
      type: 'appear',
    });
  }, [onAppear, navigation, route.key]);

  const handleDismissed = useCallback(() => {
    if (onDismissed) {
      onDismissed();
    }
    navigation.emit({
      target: route.key,
      type: 'dismiss',
    });
    navigation.dispatch({
      ...StackActions.pop(),
      source: route.key,
      target: state.key,
    });
  }, [onDismissed, navigation, route.key, state.key]);

  const handleFinishTransitioning = useCallback(() => {
    navigation.emit({
      target: route.key,
      type: 'finishTransitioning',
    });
  }, [navigation, route.key]);

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
        isShortFormEnabled={isShortFormEnabled}
        key={route.key}
        longFormHeight={longFormHeight}
        modalBackgroundColor={backgroundColor}
        onAppear={handleAppear}
        onDismissed={handleDismissed}
        onFinishTransitioning={handleFinishTransitioning}
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
        <View style={contentStyles}>{renderScene()}</View>
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
