import React, { useMemo } from 'react';
import { ButtonPressAnimation } from '@/components/animations';
import { Box, Inline, Text, TextIcon } from '@/design-system';
import i18n from '@/languages';
import { formatCurrency } from '@/helpers/strings';
import { useAccountAccentColor } from '@/hooks/useAccountAccentColor';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { useHyperliquidBalance } from '@/features/perps/stores/derived/useHyperliquidBalance';
import { navigateToPerps } from '@/features/perps/utils/navigateToPerps';

const HEIGHT = 48;

export const PerpsHeader = React.memo(function PerpsHeader({ isDarkMode }: { isDarkMode: boolean }) {
  const { accentColor: accountColor } = useAccountAccentColor();
  const accountValueNative = useHyperliquidBalance();

  const navigationButtonColors = useMemo(() => {
    return {
      icon: accountColor,
      border: opacityWorklet(accountColor, isDarkMode ? 0.08 : 0.015),
      background: opacityWorklet(accountColor, isDarkMode ? 0.16 : 0.1),
    };
  }, [accountColor, isDarkMode]);

  return (
    <ButtonPressAnimation onPress={navigateToPerps} scaleTo={1.05} testID={'perps-list-header'}>
      <Box height={{ custom: HEIGHT }} paddingHorizontal="20px" justifyContent="center">
        <Inline alignHorizontal="justify" alignVertical="center">
          <Inline horizontalSpace={'8px'} alignVertical="center">
            <Text size="22pt" color="label" weight="heavy">
              {i18n.account.tab_perps()}
            </Text>
            <Box
              borderWidth={5 / 3}
              borderColor={{ custom: navigationButtonColors.border }}
              backgroundColor={navigationButtonColors.background}
              borderRadius={14}
              height={28}
              width={28}
              justifyContent="center"
              alignItems="center"
            >
              <TextIcon color={{ custom: navigationButtonColors.icon }} size="icon 14px" weight="heavy">
                {'􀆊'}
              </TextIcon>
            </Box>
          </Inline>

          <Inline horizontalSpace="8px" alignVertical="center">
            <Text align="right" color="label" size="20pt" weight="bold">
              {formatCurrency(accountValueNative)}
            </Text>
          </Inline>
        </Inline>
      </Box>
    </ButtonPressAnimation>
  );
});
