import React from 'react';
import { Box, useBackgroundColor, useColorMode } from '@/design-system';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IS_ANDROID } from '@/env';

const HANDLE_COLOR = 'rgba(245, 248, 255, 0.3)';
const LIGHT_HANDLE_COLOR = 'rgba(9, 17, 31, 0.3)';

export interface SheetHandleProps {
  extraPaddingTop?: number;
}

export const SheetHandle = ({ extraPaddingTop = IS_ANDROID ? 24 : 12 }: SheetHandleProps) => {
  const { isDarkMode } = useColorMode();
  const screenBackgroundColor = useBackgroundColor('surfacePrimary');
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <Box position="absolute" top="0px" left="0px" right="0px" width="full" pointerEvents="none">
      <Box background={'surfacePrimary'} height={safeAreaInsets.top + extraPaddingTop} width="full">
        <Box
          height={{ custom: 5 }}
          width={{ custom: 36 }}
          borderRadius={3}
          position="absolute"
          style={{ backgroundColor: isDarkMode ? HANDLE_COLOR : LIGHT_HANDLE_COLOR, bottom: 0, alignSelf: 'center' }}
        />
      </Box>
      <EasingGradient
        endColor={screenBackgroundColor}
        startColor={screenBackgroundColor}
        endOpacity={0}
        startOpacity={1}
        style={{ height: 32, width: '100%', pointerEvents: 'none' }}
      />
    </Box>
  );
};
