import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated from 'react-native-reanimated';

import { Box, globalColors } from '@/design-system';

import { useTheme } from '@/theme';

type FadeGradientProps = { side: 'top' | 'bottom'; style?: StyleProp<Animated.AnimateStyle<StyleProp<ViewStyle>>> };

export const FadeGradient = ({ side, style }: FadeGradientProps) => {
  const { colors, isDarkMode } = useTheme();

  const isTop = side === 'top';
  const solidColor = isDarkMode ? globalColors.white10 : '#FBFCFD';
  const transparentColor = colors.alpha(solidColor, 0);

  return (
    <Box
      as={Animated.View}
      height={{ custom: 20 }}
      pointerEvents="none"
      position="absolute"
      style={[
        {
          bottom: isTop ? undefined : 0,
          top: isTop ? 0 : undefined,
        },
        style,
      ]}
      width="full"
    >
      <LinearGradient
        colors={[solidColor, transparentColor]}
        end={{ x: 0.5, y: isTop ? 1 : 0 }}
        locations={[0, 1]}
        pointerEvents="none"
        start={{ x: 0.5, y: isTop ? 0 : 1 }}
        style={{
          height: 20,
          width: '100%',
        }}
      />
    </Box>
  );
};
