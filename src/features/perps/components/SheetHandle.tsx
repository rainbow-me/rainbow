import React from 'react';
import { Box, useColorMode } from '@/design-system';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HANDLE_COLOR, LIGHT_HANDLE_COLOR, PERPS_BACKGROUND_DARK, PERPS_BACKGROUND_LIGHT } from '@/features/perps/constants';

export type SheetHandleProps = {
  backgroundColor?: string;
  extraPaddingTop?: number;
  gradientColors?: { start?: string; end?: string };
  withoutGradient?: boolean;
};

export const SheetHandle = ({ backgroundColor, extraPaddingTop, gradientColors, withoutGradient }: SheetHandleProps) => {
  const { isDarkMode } = useColorMode();
  const screenBackgroundColor = isDarkMode ? PERPS_BACKGROUND_DARK : PERPS_BACKGROUND_LIGHT;
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <Box position="absolute" top="0px" left="0px" right="0px" width="full" pointerEvents="none">
      <Box backgroundColor={backgroundColor} height={safeAreaInsets.top + (extraPaddingTop ?? 8)} width="full">
        <Box
          height={{ custom: 5 }}
          width={{ custom: 36 }}
          borderRadius={3}
          position="absolute"
          style={{ backgroundColor: isDarkMode ? HANDLE_COLOR : LIGHT_HANDLE_COLOR, bottom: 0, alignSelf: 'center' }}
        />
      </Box>
      {!withoutGradient && (
        <EasingGradient
          endColor={gradientColors?.end ?? screenBackgroundColor}
          startColor={gradientColors?.start ?? screenBackgroundColor}
          endOpacity={0}
          startOpacity={1}
          style={{ height: 32, width: '100%', pointerEvents: 'none' }}
        />
      )}
    </Box>
  );
};
