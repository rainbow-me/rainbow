import React, { memo } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Box, Text } from '@/design-system';
import { THICK_BORDER_WIDTH } from '@/styles/constants';

type MarketLeverageBadgeProps = {
  backgroundColor: string;
  borderColor: string;
  leverage: number;
  shadowColor: string;
  shadowOpacity: number;
  style?: StyleProp<ViewStyle>;
  textColor: string;
};

export const MarketLeverageBadge = memo(function MarketLeverageBadge({
  backgroundColor,
  borderColor,
  leverage,
  shadowColor,
  shadowOpacity,
  style,
  textColor,
}: MarketLeverageBadgeProps) {
  return (
    <Box
      alignItems="center"
      justifyContent="center"
      backgroundColor={backgroundColor}
      borderColor={{ custom: borderColor }}
      borderRadius={8}
      borderWidth={THICK_BORDER_WIDTH}
      paddingHorizontal={{ custom: 5 }}
      paddingVertical={{ custom: 5 }}
      style={StyleSheet.flatten([styles.shadow, { shadowColor, shadowOpacity }, style])}
    >
      <Text align="center" size="11pt" weight="heavy" color={{ custom: textColor }}>
        {`${leverage}x`}
      </Text>
    </Box>
  );
});

const styles = StyleSheet.create({
  shadow: { shadowOffset: { width: 0, height: 2 }, shadowRadius: 4.5 },
});
