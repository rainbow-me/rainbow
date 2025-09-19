import React, { useMemo } from 'react';
import { ButtonPressAnimation } from '@/components/animations';
import { Box, Inline, Text, TextIcon } from '@/design-system';
import * as i18n from '@/languages';
import { formatCurrency } from '@/helpers/strings';
import { useAccountAccentColor } from '@/hooks/useAccountAccentColor';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import Routes from '@/navigation/routesNames';
import { Navigation } from '@/navigation';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import { useCurrencyConversionStore } from '@/features/perps/stores/currencyConversionStore';
import { multiply } from '@/helpers/utilities';

const HEIGHT = 48;

export const PerpsHeader = React.memo(function PerpsHeader() {
  const { accentColor: accountColor } = useAccountAccentColor();
  const accountValueUsd = useHyperliquidAccountStore(state => state.value);
  const usdToNativeCurrencyConversionRate = useCurrencyConversionStore(state => state.getData()?.usdToNativeCurrencyConversionRate || 1);
  const accountValueNative = multiply(accountValueUsd, usdToNativeCurrencyConversionRate);

  const navigationButtonColors = useMemo(() => {
    return {
      icon: accountColor,
      border: opacityWorklet(accountColor, 0.08),
      background: opacityWorklet(accountColor, 0.16),
    };
  }, [accountColor]);

  return (
    <ButtonPressAnimation
      onPress={() => {
        Navigation.handleAction(Routes.PERPS_ACCOUNT_NAVIGATOR);
      }}
      scaleTo={1.05}
      testID={`perps-list-header`}
    >
      <Box height={{ custom: HEIGHT }} paddingHorizontal={'19px (Deprecated)'} justifyContent="center">
        <Inline alignHorizontal="justify" alignVertical="center">
          <Inline horizontalSpace={'8px'} alignVertical="center">
            <Text size="22pt" color={'label'} weight="heavy">
              {i18n.t(i18n.l.account.tab_perps)}
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

          <Inline horizontalSpace={'8px'} alignVertical="center">
            <Text size="20pt" color={'label'} weight="bold">
              {formatCurrency(accountValueNative)}
            </Text>
          </Inline>
        </Inline>
      </Box>
    </ButtonPressAnimation>
  );
});
