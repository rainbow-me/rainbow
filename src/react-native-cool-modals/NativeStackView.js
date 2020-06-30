import { StackActions, useTheme } from '@react-navigation/native';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Components from './screens';

export default function NativeStackView({ state, navigation, descriptors }) {
  const { colors } = useTheme();

  return (
    <Components.ScreenStack style={styles.container}>
      {state.routes.map(route => {
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
          <Components.Screen
            longFormHeight={longFormHeight}
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
