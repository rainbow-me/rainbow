import React from 'react';
import { StyleSheet } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { IS_IOS } from '@/env';

export const BrowserGestureBlocker = ({
  children,
  disabled,
  enableOnAndroid,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  enableOnAndroid?: boolean;
}) => {
  return IS_IOS || enableOnAndroid ? (
    // @ts-expect-error Property 'children' does not exist on type
    <PanGestureHandler enabled={!disabled}>
      <Animated.View style={styles.cover}>
        <>{children}</>
      </Animated.View>
    </PanGestureHandler>
  ) : (
    <>{children}</>
  );
};

const styles = StyleSheet.create({
  cover: {
    height: '100%',
    width: '100%',
  },
});
