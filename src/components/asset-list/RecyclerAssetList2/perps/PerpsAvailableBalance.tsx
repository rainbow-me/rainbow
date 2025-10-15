import React, { memo } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { StyleSheet } from 'react-native';
import { Box, Text } from '@/design-system';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { navigateToPerps } from '@/features/perps/utils/navigateToPerps';
import { ImgixImage } from '@/components/images';
import { USDC_COLORS, USDC_ICON_URL } from '@/features/perps/constants';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import i18n from '@/languages';

type PerpsAvailableBalanceProps = {
  balance: string;
  isDarkMode: boolean;
};

export const PerpsAvailableBalance = memo(function PerpsAvailableBalance({ balance, isDarkMode }: PerpsAvailableBalanceProps) {
  const backgroundColor = opacityWorklet(USDC_COLORS.primary, isDarkMode ? 0.06 : 0.03);
  const borderColor = opacityWorklet(USDC_COLORS.primary, isDarkMode ? 0.06 : 0.02);

  return (
    <Box paddingHorizontal="20px">
      <ButtonPressAnimation onPress={navigateToPerps} scaleTo={0.96} style={{ marginLeft: -4 }}>
        <GradientBorderView
          borderGradientColors={[borderColor, 'transparent']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 1, y: 0 }}
          borderRadius={14}
          style={{ height: 36, overflow: 'hidden' }}
        >
          <LinearGradient
            colors={[backgroundColor, 'transparent']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Box
            alignItems="center"
            flexDirection="row"
            gap={4}
            height={36}
            justifyContent="space-between"
            paddingLeft="12px"
            paddingVertical={'12px'}
          >
            <Text color="labelTertiary" size="17pt" weight="semibold">
              {i18n.perps.account.available_balance()}
            </Text>

            <Box flexDirection="row" gap={5} alignItems="center">
              <ImgixImage enableFasterImage source={{ uri: USDC_ICON_URL }} size={16} style={{ width: 16, height: 16 }} />
              <Text align="right" color="labelSecondary" size="17pt" weight="semibold">
                {formatCurrency(balance)}
              </Text>
            </Box>
          </Box>
        </GradientBorderView>
      </ButtonPressAnimation>
    </Box>
  );
});
