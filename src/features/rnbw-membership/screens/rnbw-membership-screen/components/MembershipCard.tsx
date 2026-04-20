import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { Border, Box, useColorMode, type Space } from '@/design-system';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';

import {
  MEMBERSHIP_CARD_BORDER_RADIUS,
  MEMBERSHIP_CARD_DARK_FILL,
  MEMBERSHIP_CARD_DARK_INNER_SHADOW,
  MEMBERSHIP_CARD_DARK_TOP_HIGHLIGHT,
  MEMBERSHIP_CARD_LIGHT_BORDER_GRADIENT,
  MEMBERSHIP_CARD_LIGHT_FILL,
  MEMBERSHIP_CARD_LIGHT_GRADIENT_END,
  MEMBERSHIP_CARD_LIGHT_GRADIENT_START,
} from './membershipCardVisuals';

type MembershipCardProps = {
  children: ReactNode;
  borderRadius?: number;
  padding?: Space;
  paddingHorizontal?: Space;
  paddingVertical?: Space;
  paddingTop?: Space;
  paddingBottom?: Space;
};

export function MembershipCard({
  children,
  borderRadius = MEMBERSHIP_CARD_BORDER_RADIUS,
  padding,
  paddingHorizontal,
  paddingVertical,
  paddingTop,
  paddingBottom,
}: MembershipCardProps) {
  const { isDarkMode } = useColorMode();

  if (isDarkMode) {
    return (
      <Box
        backgroundColor={MEMBERSHIP_CARD_DARK_FILL}
        borderRadius={borderRadius}
        padding={padding}
        paddingHorizontal={paddingHorizontal}
        paddingVertical={paddingVertical}
        paddingTop={paddingTop}
        paddingBottom={paddingBottom}
      >
        <Border borderTopWidth={2} borderRadius={borderRadius} borderColor={{ custom: MEMBERSHIP_CARD_DARK_TOP_HIGHLIGHT }} />
        <InnerShadow
          borderRadius={borderRadius}
          color={MEMBERSHIP_CARD_DARK_INNER_SHADOW.color}
          blur={MEMBERSHIP_CARD_DARK_INNER_SHADOW.blur}
          dx={MEMBERSHIP_CARD_DARK_INNER_SHADOW.dx}
          dy={MEMBERSHIP_CARD_DARK_INNER_SHADOW.dy}
        />
        {children}
      </Box>
    );
  }

  return (
    <GradientBorderView
      borderRadius={borderRadius}
      borderGradientColors={MEMBERSHIP_CARD_LIGHT_BORDER_GRADIENT}
      start={MEMBERSHIP_CARD_LIGHT_GRADIENT_START}
      end={MEMBERSHIP_CARD_LIGHT_GRADIENT_END}
      style={styles.shadow}
    >
      <Box
        borderRadius={borderRadius}
        background={'surfaceSecondary'}
        padding={padding}
        paddingHorizontal={paddingHorizontal}
        paddingVertical={paddingVertical}
        paddingTop={paddingTop}
        paddingBottom={paddingBottom}
      >
        <LinearGradient
          colors={[MEMBERSHIP_CARD_LIGHT_FILL, MEMBERSHIP_CARD_LIGHT_FILL]}
          start={MEMBERSHIP_CARD_LIGHT_GRADIENT_START}
          end={MEMBERSHIP_CARD_LIGHT_GRADIENT_END}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </Box>
    </GradientBorderView>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 9,
    shadowColor: '#000000',
  },
});
