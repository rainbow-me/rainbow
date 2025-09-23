import React from 'react';
import { Box, useColorMode } from '@/design-system';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IS_ANDROID } from '@/env';
import { HANDLE_COLOR, LIGHT_HANDLE_COLOR, PERPS_BACKGROUND_DARK, PERPS_BACKGROUND_LIGHT } from '@/features/perps/constants';

export type SheetHandleProps = {
  extraPaddingTop?: number;
  backgroundColor?: string;
  withoutGradient?: boolean;
};

export const SheetHandle = ({ extraPaddingTop = IS_ANDROID ? 24 : 12, backgroundColor, withoutGradient }: SheetHandleProps) => {
  const { isDarkMode } = useColorMode();
  const screenBackgroundColor = isDarkMode ? PERPS_BACKGROUND_DARK : PERPS_BACKGROUND_LIGHT;
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <Box position="absolute" top="0px" left="0px" right="0px" width="full" pointerEvents="none">
      <Box
        // background={backgroundColor ? undefined: 'surfacePrimary'}
        backgroundColor={backgroundColor}
        height={safeAreaInsets.top + extraPaddingTop}
        width="full"
      >
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
