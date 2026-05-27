import React, { memo, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ETH_COLOR_DARK, ETH_COLOR_DARK_ACCENT } from '@/__swaps__/screens/Swap/constants';
import { Bleed, Text, useColorMode } from '@/design-system';
import { opacity } from '@/framework/ui/utils/opacity';
import { THICK_BORDER_WIDTH } from '@/styles/constants';

type LeverageBadgeProps = {
  backgroundColor?: string;
  borderColor?: string;
  bleed?: boolean;
  leverage: number;
  shadowColor?: string;
  shadowOpacity?: number;
  style?: StyleProp<ViewStyle>;
  textColor?: string;
};

export const LeverageBadge = memo(function LeverageBadge({
  backgroundColor,
  borderColor,
  bleed = true,
  leverage,
  shadowColor,
  shadowOpacity,
  style,
  textColor,
}: LeverageBadgeProps) {
  const { isDarkMode } = useColorMode();
  const color = useMemo(() => {
    if (isDarkMode) return opacity(ETH_COLOR_DARK, 0.16);
    return opacity('#09111F', 0.04);
  }, [isDarkMode]);
  const hasCustomStyle = backgroundColor !== undefined || borderColor !== undefined || shadowColor !== undefined || textColor !== undefined;
  const badge = (
    <View
      style={[
        styles.badge,
        hasCustomStyle ? styles.customBadge : styles.defaultBadge,
        {
          backgroundColor: backgroundColor ?? color,
          borderColor: borderColor ?? color,
          borderWidth: hasCustomStyle ? THICK_BORDER_WIDTH : 1,
          shadowColor,
          shadowOpacity,
        },
        style,
      ]}
    >
      <Text
        align="center"
        size="11pt"
        weight="heavy"
        color={textColor ? { custom: textColor } : isDarkMode ? { custom: ETH_COLOR_DARK_ACCENT } : 'labelTertiary'}
      >
        {`${leverage}x`}
      </Text>
    </View>
  );

  return bleed ? <Bleed vertical="6px">{badge}</Bleed> : badge;
});

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderCurve: 'continuous',
    justifyContent: 'center',
  },
  customBadge: {
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4.5,
  },
  defaultBadge: {
    borderRadius: 10,
    height: 18,
    paddingHorizontal: 5.5,
  },
});
