import React, { memo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/design-system';
import { Border } from '@/design-system/components/Border/Border';
import { THICK_BORDER_WIDTH } from '@/styles/constants';

const LEVERAGE_BADGE_BORDER_RADIUS = 8;

type LeverageBadgeProps = {
  backgroundColor: string;
  borderColor: string;
  leverage: number;
  shadowColor: string;
  shadowOpacity: number;
  style?: StyleProp<ViewStyle>;
  textColor: string;
};

export const LeverageBadge = memo(function LeverageBadge({
  backgroundColor,
  borderColor,
  leverage,
  shadowColor,
  shadowOpacity,
  style,
  textColor,
}: LeverageBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor, shadowColor, shadowOpacity }, style]}>
      <Text align="center" color={{ custom: textColor }} size="11pt" weight="heavy">
        {`${leverage}x`}
      </Text>
      <Border borderColor={{ custom: borderColor }} borderRadius={LEVERAGE_BADGE_BORDER_RADIUS} borderWidth={THICK_BORDER_WIDTH} />
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: LEVERAGE_BADGE_BORDER_RADIUS,
    justifyContent: 'center',
    paddingHorizontal: 5,
    paddingVertical: 5,
    position: 'absolute',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4.5,
  },
});
