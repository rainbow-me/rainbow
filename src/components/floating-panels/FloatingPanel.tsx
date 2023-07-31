import React, { ReactNode } from 'react';
import { FlexStyle, StyleProp, ViewStyle } from 'react-native';
import { Box, Space } from '@/design-system';
import { useTheme } from '@/theme';

type FloatingPanelProps = {
  borderRadius: number;
  children: ReactNode;
  overflow: FlexStyle['overflow'];
  paddingBottom: Space;
  style: StyleProp<ViewStyle>;
  testID: string;
};

const FloatingPanel = ({
  borderRadius = 18,
  overflow = 'hidden',
  paddingBottom,
  style,
  testID,
  ...props
}: FloatingPanelProps) => {
  const { isDarkMode } = useTheme();
  return (
    <Box
      background={isDarkMode ? 'surfaceSecondary' : 'surfacePrimary'}
      borderRadius={borderRadius}
      paddingBottom={paddingBottom}
      style={[style, { overflow, zIndex: 1 }]}
      testID={testID + '-container'}
      {...props}
    />
  );
};

export default FloatingPanel;
