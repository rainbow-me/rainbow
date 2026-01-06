import React from 'react';
import { Box, useColorMode } from '@/design-system';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEFAULT_HANDLE_COLOR_DARK, DEFAULT_HANDLE_COLOR_LIGHT } from '@/components/PanelSheet/PanelSheet';
import { POLYMARKET_BACKGROUND_DARK, POLYMARKET_BACKGROUND_LIGHT } from '@/features/polymarket/constants';

export type SheetHandleProps = {
  extraPaddingTop?: number;
  backgroundColor?: string;
  withoutGradient?: boolean;
};

export const PolymarketSheetHandle = ({ extraPaddingTop, backgroundColor, withoutGradient }: SheetHandleProps) => {
  const { isDarkMode } = useColorMode();
  const screenBackgroundColor = isDarkMode ? POLYMARKET_BACKGROUND_DARK : POLYMARKET_BACKGROUND_LIGHT;
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <Box position="absolute" top="0px" left="0px" right="0px" width="full" pointerEvents="none">
      <Box backgroundColor={backgroundColor} height={safeAreaInsets.top + (extraPaddingTop ?? 8)} width="full">
        <Box
          height={{ custom: 5 }}
          width={{ custom: 36 }}
          borderRadius={3}
          position="absolute"
          style={{ backgroundColor: isDarkMode ? DEFAULT_HANDLE_COLOR_DARK : DEFAULT_HANDLE_COLOR_LIGHT, bottom: 0, alignSelf: 'center' }}
        />
      </Box>
      {!withoutGradient && (
        <EasingGradient
          endColor={screenBackgroundColor}
          startColor={screenBackgroundColor}
          endOpacity={0}
          startOpacity={1}
          style={{ height: 32, width: '100%', pointerEvents: 'none' }}
        />
      )}
    </Box>
  );
};
