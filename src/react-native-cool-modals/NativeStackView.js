/* eslint-disable react/no-array-index-key */

import { StackActions, useTheme } from '@react-navigation/native';
import * as React from 'react';
import { NativeModules, StyleSheet, View } from 'react-native';
import Components from './screens';

export const ModalContext = React.createContext();

function ScreenView({ state, navigation, descriptors, route, colors }) {
  const ref = React.useRef();
  const onComponentRef = React.useCallback(e => {
    ref.current = e && e._nativeTag;
  }, []);

  const context = React.useMemo(
    () => ({
      jumpToLong: () =>
        ref.current &&
        NativeModules.RNCMScreenManager.jumpTo(true, ref.current),
      jumpToShort: () =>
        ref.current &&
        NativeModules.RNCMScreenManager.jumpTo(false, ref.current),
    }),
    []
  );

  const { options, render: renderScene } = descriptors[route.key];
  const {
    gestureEnabled,
    stackPresentation = 'push',
    stackAnimation,
    contentStyle,
  } = options;

  const {
    backgroundColor,
    dismissable,
    customStack,
    topOffset,
    showDragIndicator,
    allowsDragToDismiss,
    allowsTapToDismiss,
    anchorModalToLongForm,
    longFormHeight,
    onWillDismiss,
    backgroundOpacity,
    cornerRadius,
    headerHeight,
    isShortFormEnabled,
    shortFormHeight,
    springDamping,
    startFromShortForm,
    transitionDuration,
    onTouchTop,
    ignoreBottomOffset,
  } = options;

  return (
    <ModalContext.Provider value={context}>
      <Components.Screen
        longFormHeight={longFormHeight}
        onComponentRef={onComponentRef}
        ignoreBottomOffset={ignoreBottomOffset}
        onTouchTop={onTouchTop}
        dismissable={dismissable}
        customStack={customStack}
        topOffset={topOffset}
        showDragIndicator={showDragIndicator}
        allowsDragToDismiss={allowsDragToDismiss}
        allowsTapToDismiss={allowsTapToDismiss}
        anchorModalToLongForm={anchorModalToLongForm}
        onWillDismiss={onWillDismiss}
        modalBackgroundColor={backgroundColor}
        backgroundOpacity={backgroundOpacity}
        cornerRadius={cornerRadius}
        headerHeight={headerHeight}
        isShortFormEnabled={isShortFormEnabled}
        shortFormHeight={shortFormHeight}
        springDamping={springDamping}
        startFromShortForm={startFromShortForm}
        transitionDuration={transitionDuration}
        key={route.key}
        style={StyleSheet.absoluteFill}
        gestureEnabled={gestureEnabled}
        stackPresentation={stackPresentation}
        stackAnimation={stackAnimation}
        onAppear={() => {
          options?.onAppear?.();
          navigation.emit({
            target: route.key,
            type: 'appear',
          });
        }}
        onDismissed={() => {
          options?.onDismissed?.();
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
        onFinishTransitioning={() => {
          navigation.emit({
            target: route.key,
            type: 'finishTransitioning',
          });
        }}
      >
        <View
          style={[
            styles.container,
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
    <Components.ScreenStack style={styles.container}>
      {state.routes.map((route, i) => {
        return (
          <ScreenView
            key={`screen${i}`}
            state={state}
            navigation={navigation}
            descriptors={descriptors}
            route={route}
            colors={colors}
          />
        );
      })}
    </Components.ScreenStack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
