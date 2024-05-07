import React from 'react';
import styled from '@/styled-thing';
import { IS_ANDROID } from '@/env';

export const HandleHeight = 5;

const defaultColor = (colors, showBlur) =>
  IS_ANDROID
    ? showBlur
      ? colors.alpha(colors.blueGreyDark, 0.3)
      : colors.blueGreyDark30
    : colors.alpha(colors.blueGreyDark30, showBlur ? 0.7 : 1.0);

const Handle = styled.View({
  backgroundColor: ({ color, theme: { colors }, showBlur }) => color || defaultColor(colors, showBlur),
  borderRadius: 3,
  height: HandleHeight,
  overflow: 'hidden',
  width: 36,
  zIndex: 9,
});

export default function SheetHandle({ showBlur = false, ...props }) {
  const { isDarkMode } = useTheme();

  return <Handle {...props} isDarkMode={isDarkMode} showBlur={showBlur} />;
}
