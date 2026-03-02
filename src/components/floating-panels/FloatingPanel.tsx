import React, { type ReactNode } from 'react';
import { type FlexStyle, type StyleProp, type ViewStyle } from 'react-native';
import { Box, type Space } from '@/design-system';

type FloatingPanelProps = {
  borderRadius: number;
  children: ReactNode;
  overflow: FlexStyle['overflow'];
  paddingBottom: Space;
  style: StyleProp<ViewStyle>;
  testID: string;
};

const FloatingPanel = ({ borderRadius = 18, overflow = 'hidden', paddingBottom, style, testID, ...props }: FloatingPanelProps) => {
  return (
    <Box
      background="body (Deprecated)"
      borderRadius={borderRadius}
      paddingBottom={paddingBottom}
      style={[style, { overflow, zIndex: 1 }]}
      testID={testID + '-container'}
      {...props}
    />
  );
};

export default FloatingPanel;
