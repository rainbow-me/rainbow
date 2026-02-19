import React from 'react';
import { View, ViewProps } from 'react-native';
import { IS_ANDROID } from '@/env';
import styled from '@/framework/ui/styled-thing';
import { Colors } from '@/styles';
import { useTheme } from '@/theme';
import { opacity } from '@/framework/ui/utils/opacity';

export const SHEET_HANDLE_HEIGHT = 5;

const defaultColor = (colors: Colors, showBlur: boolean): string =>
  IS_ANDROID
    ? showBlur
      ? opacity(colors.blueGreyDark, 0.3)
      : colors.blueGreyDark30
    : opacity(colors.blueGreyDark30, showBlur ? 0.7 : 1.0);

const Handle = styled(View)({
  backgroundColor: ({ color, theme: { colors }, showBlur }: { color: string | undefined; showBlur: boolean; theme: { colors: Colors } }) =>
    color || defaultColor(colors, showBlur),
  borderRadius: 3,
  height: SHEET_HANDLE_HEIGHT,
  overflow: 'hidden',
  width: 36,
  zIndex: 9,
});

export default function SheetHandle({ color, showBlur = false, ...props }: { color?: string; showBlur?: boolean } & ViewProps) {
  const { isDarkMode } = useTheme();
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Handle {...props} color={color} isDarkMode={isDarkMode} showBlur={showBlur} />;
}
