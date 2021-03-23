import { VibrancyView } from '@react-native-community/blur';
import React from 'react';
import { View } from 'react-native';
import styled from 'styled-components';

export const HandleHeight = 5;

const defaultColor = colors =>
  android ? colors.alpha(colors.blueGreyDark, 0.7) : colors.blueGreyDark30;

const Handle = styled.View.attrs({
  blurAmount: 20,
})`
  background-color: ${({ color, theme: { colors } }) =>
    color || defaultColor(colors)};
  border-radius: 3;
  height: ${HandleHeight};
  overflow: hidden;
  width: 36;
  z-index: 9;
`;

export default function SheetHandle({ showBlur, ...props }) {
  const { isDarkMode } = useTheme();

  return (
    <Handle
      {...props}
      as={showBlur && ios ? VibrancyView : View}
      blurType={isDarkMode ? 'chromeMaterial' : 'light'}
      isDarkMode={isDarkMode}
      showBlur={showBlur}
    />
  );
}
