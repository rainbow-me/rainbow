import React from 'react';
import { View } from 'react-native';
import { alignHorizontalToFlexAlign } from '@/design-system/layout/alignment';

import { CHARACTER_WIDTH } from '../constants';

export const Line = ({
  alignHorizontal,
  children,
  gap = 10,
  leftIndent = 0,
}: {
  alignHorizontal?: 'center' | 'justify' | 'left' | 'right';
  children: React.ReactNode;
  gap?: number;
  leftIndent?: number;
}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap,
        justifyContent: alignHorizontal ? alignHorizontalToFlexAlign[alignHorizontal] : undefined,
        paddingLeft: leftIndent * CHARACTER_WIDTH,
      }}
    >
      {children}
    </View>
  );
};
