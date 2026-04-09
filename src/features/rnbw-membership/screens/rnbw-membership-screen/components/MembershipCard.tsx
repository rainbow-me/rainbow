import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { Border, Box, useColorMode, type Space } from '@/design-system';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';
import { opacity } from '@/framework/ui/utils/opacity';

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
  borderRadius = 32,
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
        backgroundColor={opacity('#202429', 0.4)}
        borderRadius={borderRadius}
        padding={padding}
        paddingHorizontal={paddingHorizontal}
        paddingVertical={paddingVertical}
        paddingTop={paddingTop}
        paddingBottom={paddingBottom}
      >
        <Border borderTopWidth={2} borderRadius={borderRadius} borderColor={{ custom: opacity('#D6D6D6', 0.02) }} />
        <InnerShadow borderRadius={borderRadius} color={opacity('#FFFFFF', 0.06)} blur={2.5} dx={0} dy={1} />
        {children}
      </Box>
    );
  }

  return (
    <GradientBorderView
      borderRadius={borderRadius}
      borderGradientColors={['#FFFFFF', opacity('#FFFFFF', 0.3)]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.57 }}
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
          colors={['#FFFFFF', '#FFFFFF']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.57 }}
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
