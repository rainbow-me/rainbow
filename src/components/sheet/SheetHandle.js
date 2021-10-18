import React from 'react';
import styled from 'styled-components';

export const HandleHeight = 5;

const defaultColor = (colors, showBlur) =>
  android
    ? showBlur
      ? colors.alpha(colors.blueGreyDark, 0.3)
      : colors.blueGreyDark30
    : colors.alpha(colors.blueGreyDark30, showBlur ? 0.7 : 1.0);

const Handle = styled.View`
  background-color: ${({ color, theme: { colors }, showBlur }) =>
    color || defaultColor(colors, showBlur)};
  border-radius: 3;
  height: ${HandleHeight};
  overflow: hidden;
  width: 36;
  z-index: 9;
`;

export default function SheetHandle({ showBlur, ...props }) {
  const { isDarkMode } = useTheme();

  return <Handle {...props} isDarkMode={isDarkMode} showBlur={showBlur} />;
}
