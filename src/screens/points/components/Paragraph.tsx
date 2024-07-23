import React from 'react';
import { View } from 'react-native';

import { CHARACTER_WIDTH } from '../constants';

export const Paragraph = ({ children, gap = 15, leftIndent = 0 }: { children: React.ReactNode; gap?: number; leftIndent?: number }) => {
  return (
    <View
      style={{
        flexWrap: 'wrap',
        gap,
        paddingLeft: leftIndent * CHARACTER_WIDTH,
      }}
    >
      {children}
    </View>
  );
};
