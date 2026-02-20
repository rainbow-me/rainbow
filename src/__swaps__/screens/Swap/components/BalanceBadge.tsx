import React from 'react';
import { type DerivedValue, useAnimatedStyle } from 'react-native-reanimated';
import { AnimatedText, Bleed, Box, useColorMode } from '@/design-system';
import { type TextColor } from '@/design-system/color/palettes';
import { type TextWeight } from '@/design-system/components/Text/Text';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '@/styles/constants';

export const BalanceBadge = ({ color, label, weight }: { color?: TextColor; label: DerivedValue<string>; weight?: TextWeight }) => {
  const { isDarkMode } = useColorMode();

  const labelTextStyle = useAnimatedStyle(() => {
    const isPlaceholderLabel = label.value === 'No Balance' || label.value === 'Token to Swap' || label.value === 'Token to Get';
    return {
      opacity: isPlaceholderLabel ? (isDarkMode ? 0.6 : 0.75) : 1,
    };
  });

  return (
    <Bleed vertical={{ custom: 5.5 }}>
      <Box
        alignItems="center"
        borderRadius={8.5}
        height={{ custom: 20 }}
        justifyContent="center"
        paddingHorizontal={{ custom: 5 }}
        style={{
          borderColor: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR,
          borderWidth: THICK_BORDER_WIDTH,
        }}
      >
        <AnimatedText
          align="center"
          color={color || 'labelQuaternary'}
          size="13pt"
          style={labelTextStyle}
          weight={weight || 'bold'}
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {label}
        </AnimatedText>
      </Box>
    </Bleed>
  );
};
