import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

import Animated from 'react-native-reanimated';

import { IS_ANDROID } from '@/env';

import { FIELD_BACKGROUND_COLOR, FIELD_BORDER_COLOR, FIELD_BORDER_RADIUS, FIELD_BORDER_WIDTH } from '../constants';

type FieldContainerProps = {
  style?: StyleProp<ViewStyle> | undefined;
  children: React.ReactNode;
};

export function FieldContainer({ style, children }: FieldContainerProps) {
  return (
    <Animated.View
      style={[
        {
          width: '100%',
          borderWidth: FIELD_BORDER_WIDTH,
          borderRadius: FIELD_BORDER_RADIUS,
          borderColor: FIELD_BORDER_COLOR,
          overflow: 'hidden',
          paddingVertical: IS_ANDROID ? 0 : 8,
          paddingHorizontal: 20,
          backgroundColor: FIELD_BACKGROUND_COLOR,
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
