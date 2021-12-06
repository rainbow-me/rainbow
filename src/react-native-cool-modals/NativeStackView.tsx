import { StackActions, useTheme } from '@react-navigation/native';
import React, { createContext, useMemo, useRef } from 'react';
import { findNodeHandle, NativeModules, StyleSheet, View } from 'react-native';
// @ts-expect-error ts-migrate(6142) FIXME: Module './screens' was resolved to '/Users/nickbyt... Remove this comment to see the full error message
import Components from './screens';

// @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 0.
export const ModalContext = createContext();

const sx = StyleSheet.create({
  container: {
    flex: 1,
  },
});

const { RNCMScreenManager } = NativeModules;

function ScreenView({
  colors,
  descriptors,
  navigation,
  route,
  state,
  hidden,
}: any) {
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
    single,
    shortFormHeight,
    showDragIndicator,
    springDamping,
    stackAnimation,
    stackPresentation = 'push',
    startFromShortForm,
    topOffset,
    transitionDuration,
    disableShortFormAfterTransitionToLongForm,
  } = options;

  const context = useMemo(
    () => ({
      jumpToLong: () => {
        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'undefined' is not assignable to ... Remove this comment to see the full error message
        const screen = findNodeHandle(ref.current);
        if (screen) {
          RNCMScreenManager.jumpTo(true, screen);
        }
      },
      jumpToShort: () => {
        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'undefined' is not assignable to ... Remove this comment to see the full error message
        const screen = findNodeHandle(ref.current);
        if (screen) {
          RNCMScreenManager.jumpTo(false, screen);
        }
      },
      layout: () => {
        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'undefined' is not assignable to ... Remove this comment to see the full error message
        const screen = findNodeHandle(ref.current);
        if (screen) {
          RNCMScreenManager.layout(screen);
        }
      },
    }),
    []
  );

  if (single && state.routes.length > 2) {
    return null;
  }

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ModalContext.Provider value={context}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Components.Screen
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
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
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

export default function NativeStackView({
  state,
  navigation,
  descriptors,
}: any) {
  const { colors } = useTheme();

  const nonSingleRoutesLength = state.routes.filter((route: any) => {
    const { options } = descriptors[route.key];
    return !options.single;
  }).length;

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Components.ScreenStack style={sx.container}>
      {state.routes.map((route: any, i: any) => {
        const { options } = descriptors[route.key];
        const { limitActiveModals } = options;
        return (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <ScreenView
            colors={colors}
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
    </Components.ScreenStack>
  );
}
