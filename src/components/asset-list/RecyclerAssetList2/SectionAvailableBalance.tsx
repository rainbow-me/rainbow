import React, { memo } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { StyleSheet } from 'react-native';
import { Box } from '@/design-system/components/Box/Box';
import { Text } from '@/design-system/components/Text/Text';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { ImgixImage } from '@/components/images';
import { USDC_COLORS, USDC_ICON_URL } from '@/features/perps/constants';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { opacity } from '@/framework/ui/utils/opacity';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import * as i18n from '@/languages';

type SectionAvailableBalanceProps = {
  balance: string;
  isDarkMode: boolean;
  onPress: () => void;
};

export const SectionAvailableBalance = memo(function SectionAvailableBalance({
  balance,
  isDarkMode,
  onPress,
}: SectionAvailableBalanceProps) {
  const backgroundColor = opacity(USDC_COLORS.primary, isDarkMode ? 0.06 : 0.03);
  const borderColor = opacity(USDC_COLORS.primary, isDarkMode ? 0.06 : 0.02);

  return (
    <Box paddingHorizontal="20px">
      <ButtonPressAnimation onPress={onPress} scaleTo={0.96} style={{ marginLeft: -4 }}>
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
              {i18n.t(i18n.l.perps.account.available_balance)}
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
