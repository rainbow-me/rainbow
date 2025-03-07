import React from 'react';
import Animated, { AnimatedProps } from 'react-native-reanimated';
import { ViewStyle } from 'react-native';
import { FIELD_BACKGROUND_COLOR, FIELD_BORDER_COLOR, FIELD_BORDER_RADIUS, FIELD_BORDER_WIDTH } from '../constants';
import { IS_ANDROID } from '@/env';

export function FieldContainer({ style, children }: { style?: AnimatedProps<ViewStyle>; children: React.ReactNode }) {
  return (
    <Animated.View
      style={[
        {
          width: '100%',
          borderWidth: FIELD_BORDER_WIDTH,
          borderRadius: FIELD_BORDER_RADIUS,
          borderColor: FIELD_BORDER_COLOR,
          paddingVertical: IS_ANDROID ? 0 : 8,
          paddingHorizontal: 20,
          backgroundColor: FIELD_BACKGROUND_COLOR,
        },
        // @ts-expect-error TODO: fix
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
