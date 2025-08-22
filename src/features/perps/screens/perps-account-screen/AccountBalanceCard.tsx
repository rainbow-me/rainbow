import React, { memo } from 'react';
import { Box, Stack, Text, TextShadow } from '@/design-system';
import { HYPERLIQUID_GREEN, PERPS_COLORS } from '@/features/perps/constants';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { toFixedWorklet } from '@/safe-math/SafeMath';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

export const PerpsAccountBalanceCard = memo(function PerpsAccountBalanceCard() {
  const { accentColors } = usePerpsAccentColorContext();
  const balance = useHyperliquidAccountStore(state => state.balance);
  // TODO (kane): use neweset currency formatting
  const formattedBalance = `${toFixedWorklet(balance, 2)} USDC`;

  return (
    <Box
      backgroundColor={PERPS_COLORS.surfacePrimary}
      padding={'12px'}
      borderRadius={110}
      borderWidth={2}
      borderColor={{ custom: accentColors.opacity6 }}
    >
      <Box flexDirection="row" justifyContent="space-between">
        <Box flexDirection="row" alignItems="center" gap={12}>
          <HyperliquidTokenIcon symbol="USDC" style={{ width: 40, height: 40 }} />
          <Stack space={'10px'}>
            <Text color="labelSecondary" size="11pt" weight="heavy">
              {'AVAILABLE BALANCE'}
            </Text>
            <TextShadow color={HYPERLIQUID_GREEN} blur={8} shadowOpacity={0.24}>
              <Text color={{ custom: HYPERLIQUID_GREEN }} size="17pt" weight="heavy">
                {formattedBalance}
              </Text>
            </TextShadow>
          </Stack>
        </Box>
        <Box flexDirection="row" gap={10}>
          <ButtonPressAnimation onPress={() => {}}>
            <Box
              justifyContent="center"
              alignItems="center"
              backgroundColor={accentColors.opacity8}
              height={40}
              width={52}
              borderRadius={24}
              borderWidth={2}
              borderColor={{ custom: accentColors.opacity6 }}
            >
              <TextShadow color={accentColors.opacity100} blur={6} shadowOpacity={0.24}>
                <Text color={{ custom: accentColors.opacity100 }} size="20pt" weight="black">
                  {'􀅽'}
                </Text>
              </TextShadow>
            </Box>
          </ButtonPressAnimation>
          <ButtonPressAnimation
            onPress={() => {
              Navigation.handleAction(Routes.PERPS_DEPOSIT_SCREEN);
            }}
          >
            <Box
              justifyContent="center"
              alignItems="center"
              // TODO (kane):
              backgroundColor={'#72FFD9'}
              height={40}
              width={52}
              borderRadius={24}
              borderWidth={2}
              borderColor={{ custom: opacityWorklet('#FFFFFF', 0.16) }}
            >
              <Text color={{ custom: '#000000' }} size="20pt" weight="black">
                {'􀅼'}
              </Text>
            </Box>
          </ButtonPressAnimation>
        </Box>
      </Box>
    </Box>
  );
});
