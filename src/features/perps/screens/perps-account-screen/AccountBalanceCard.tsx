import React, { memo } from 'react';
import { Box, Stack, Text, TextShadow, useColorMode } from '@/design-system';
import { HYPERLIQUID_GREEN, PERPS_COLORS, USDC_ICON_URL } from '@/features/perps/constants';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { toFixedWorklet } from '@/safe-math/SafeMath';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { View } from 'react-native';
import { HyperliquidButton } from '@/features/perps/components/HyperliquidButton';
import { RainbowImage } from '@/components/RainbowImage';

export const PerpsAccountBalanceCard = memo(function PerpsAccountBalanceCard() {
  const { isDarkMode } = useColorMode();
  const { accentColors } = usePerpsAccentColorContext();
  const balance = useHyperliquidAccountStore(state => state.balance);
  const formattedBalance = `${toFixedWorklet(balance, 2)} USDC`;
  const isBalanceZero = balance === '0';

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
          <RainbowImage source={{ url: USDC_ICON_URL }} style={{ width: 40, height: 40 }} />
          <Stack space={'10px'}>
            <Text color="labelSecondary" size="11pt" weight="heavy">
              {'AVAILABLE BALANCE'}
            </Text>
            <View style={{ opacity: isBalanceZero ? 0.4 : 1 }}>
              <TextShadow color={HYPERLIQUID_GREEN} blur={8} shadowOpacity={0.24}>
                <Text color={{ custom: HYPERLIQUID_GREEN }} size="17pt" weight="heavy">
                  {formattedBalance}
                </Text>
              </TextShadow>
            </View>
          </Stack>
        </Box>
        {!isBalanceZero && (
          <Box flexDirection="row" gap={10}>
            <ButtonPressAnimation
              onPress={() => {
                Navigation.handleAction(Routes.PERPS_WITHDRAWAL_SCREEN);
              }}
            >
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
            <HyperliquidButton
              onPress={() => {
                Navigation.handleAction(Routes.PERPS_DEPOSIT_SCREEN);
              }}
              height={40}
              width={52}
              paddingHorizontal={'16px'}
              paddingVertical={'12px'}
              borderRadius={24}
            >
              <Text color={{ custom: '#000000' }} size="20pt" weight="black">
                {'􀅼'}
              </Text>
            </HyperliquidButton>
          </Box>
        )}
        {isBalanceZero && (
          <HyperliquidButton
            onPress={() => {
              Navigation.handleAction(Routes.PERPS_DEPOSIT_SCREEN);
            }}
            paddingHorizontal={'16px'}
            paddingVertical={'12px'}
            borderRadius={24}
          >
            <Text color={isDarkMode ? 'black' : 'white'} size="20pt" weight="black">
              {'Deposit'}
            </Text>
          </HyperliquidButton>
        )}
      </Box>
    </Box>
  );
});
