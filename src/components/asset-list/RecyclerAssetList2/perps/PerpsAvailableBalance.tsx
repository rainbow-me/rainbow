import React, { memo } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { StyleSheet } from 'react-native';
import { Box, Text } from '@/design-system';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { RainbowImage } from '@/components/RainbowImage';
import { USDC_COLORS, USDC_ICON_URL } from '@/features/perps/constants';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { formatCurrency } from '@/helpers/strings';

type PerpsAvailableBalanceProps = {
  balance: string;
};

export const PerpsAvailableBalance = memo(function PerpsAvailableBalance({ balance }: PerpsAvailableBalanceProps) {
  const color = opacityWorklet(USDC_COLORS.primary, 0.06);

  return (
    <Box paddingHorizontal={'20px'}>
      <ButtonPressAnimation
        onPress={() => {
          Navigation.handleAction(Routes.PERPS_ACCOUNT_NAVIGATOR);
        }}
        scaleTo={0.96}
      >
        <GradientBorderView
          borderGradientColors={[color, 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 1, y: 0 }}
          borderRadius={14}
          style={{ height: 36, overflow: 'hidden' }}
        >
          <LinearGradient
            colors={[color, 'transparent']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Box justifyContent="center" height={36} paddingLeft={'10px'} paddingVertical={'12px'} borderRadius={14}>
            <Box gap={4} flexDirection="row" alignItems="center" justifyContent="space-between">
              <Box flexDirection="row" gap={10} alignItems="center">
                <RainbowImage source={{ url: USDC_ICON_URL }} style={{ width: 20, height: 20 }} />
                <Text color="label" size="17pt" weight="medium">
                  {'Available Balance'}
                </Text>
              </Box>
              <Text color="labelTertiary" size="17pt" weight="medium">
                {formatCurrency(balance)}
              </Text>
            </Box>
          </Box>
        </GradientBorderView>
      </ButtonPressAnimation>
    </Box>
  );
});
