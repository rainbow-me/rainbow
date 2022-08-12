import React, { ReactNode } from 'react';
import { FlexStyle, ViewStyle } from 'react-native';
import { Box, Space } from '@rainbow-me/design-system';

type FloatingPanelProps = {
  borderRadius: number;
  children: ReactNode;
  overflow: FlexStyle['overflow'];
  paddingBottom: Space;
  style: ViewStyle;
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
  return (
    <Box
      background="body"
      borderRadius={borderRadius}
      paddingBottom={paddingBottom}
      paddingHorizontal="19px"
      style={{ ...style, overflow, zIndex: 1 }}
      testID={testID + '-container'}
      {...props}
    />
  );
};

export default FloatingPanel;
